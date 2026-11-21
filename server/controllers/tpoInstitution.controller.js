import Institution from "../models/Institution.model.js";
import User from "../models/User.model.js";
import TPO from "../models/TPO.model.js";
import TPOAuditLog from "../models/TPOAuditLog.model.js";
import {
  countInstitutionStudentSeats,
  getEffectiveStudentLimit,
} from "../utils/institutionStudentLimit.js";

/**
 * GET /api/tpo/settings
 * Returns institution profile and settings for the TPO
 */
export const getInstitutionSettings = async (req, res) => {
  try {
    const institution = await Institution.findById(req.institutionId).lean();

    if (!institution) {
      return res.status(404).json({ success: false, message: "Institution not found" });
    }

    // Get all TPO officers from dedicated TPO collection, fallback to User if legacy
    let tpoOfficers = await TPO.find(
      { institutionId: req.institutionId },
      "name email designation phone isPrimary status createdAt"
    ).lean();

    if (!tpoOfficers || tpoOfficers.length === 0) {
      const legacyTpos = await User.find(
        { institutionId: req.institutionId, role: "tpo" },
        "name email tpoProfile status createdAt"
      ).lean();
      tpoOfficers = legacyTpos.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        designation: u.tpoProfile?.designation || "Placement Officer",
        phone: u.tpoProfile?.phone || "",
        isPrimary: !!u.tpoProfile?.isPrimary,
        status: u.status || "active",
        createdAt: u.createdAt,
      }));
    }

    const studentSeatsUsed = await countInstitutionStudentSeats(req.institutionId);
    const studentSeatLimit = getEffectiveStudentLimit(institution);

    return res.json({
      success: true,
      data: {
        institution,
        tpoUsers: tpoOfficers,
        tpoOfficers,
        seatUsage: {
          used: studentSeatsUsed,
          limit: studentSeatLimit,
        },
      },
    });
  } catch (error) {
    console.error("getInstitutionSettings error:", error);
    return res.status(500).json({ success: false, message: "Failed to load settings" });
  }
};

/**
 * PUT /api/tpo/settings
 * Updates institution profile and settings (primary TPO only for sensitive fields)
 */
export const updateInstitutionSettings = async (req, res) => {
  try {
    const {
      name,
      shortName,
      website,
      address,
      contactPhone,
      emailDomain,
      settings,
    } = req.body;

    const institution = await Institution.findById(req.institutionId);

    if (!institution) {
      return res.status(404).json({ success: false, message: "Institution not found" });
    }

    // Only primary TPO can change sensitive fields
    const isPrimary = req.tpoUser.tpoProfile?.isPrimary;

    if (name !== undefined && isPrimary) institution.name = name.trim();
    if (shortName !== undefined) institution.shortName = shortName?.trim();
    if (website !== undefined) institution.website = website?.trim();
    if (address !== undefined) institution.address = { ...institution.address, ...address };
    if (contactPhone !== undefined) institution.contactPhone = contactPhone?.trim();
    if (emailDomain !== undefined && isPrimary) {
      institution.emailDomain = emailDomain?.toLowerCase().trim();
    }

    // Settings (readiness weights, permissions)
    if (settings && typeof settings === "object") {
      if (settings.readinessWeights) {
        const w = settings.readinessWeights;
        const total = (w.resume || 0) + (w.interview || 0) + (w.technical || 0) + (w.engagement || 0);
        if (Math.round(total) !== 100) {
          return res.status(400).json({
            success: false,
            message: "Readiness weights must sum to 100",
          });
        }
        institution.settings.readinessWeights = {
          resume: w.resume,
          interview: w.interview,
          technical: w.technical,
          engagement: w.engagement,
        };
      }
      if (settings.allowStudentSelfLink !== undefined)
        institution.settings.allowStudentSelfLink = settings.allowStudentSelfLink;
      if (settings.requireStudentConsent !== undefined)
        institution.settings.requireStudentConsent = settings.requireStudentConsent;
      if (settings.showResumeContent !== undefined && isPrimary)
        institution.settings.showResumeContent = settings.showResumeContent;
      if (settings.showDetailedScores !== undefined)
        institution.settings.showDetailedScores = settings.showDetailedScores;
    }

    // Persist full departments list if provided
    if (Array.isArray(req.body.departments)) {
      institution.departments = req.body.departments.map((d) => ({
        name: d.name?.trim(),
        code: d.code?.trim() || d.name?.trim().slice(0, 6).toUpperCase(),
        type: d.type?.trim() || "Engineering",
        description: d.description?.trim(),
        isActive: d.isActive !== false,
      }));
    }

    // Persist full batches list if provided
    if (Array.isArray(req.body.batches)) {
      institution.batches = req.body.batches.map((b) => ({
        name: b.name?.trim(),
        startYear: Number(b.startYear) || new Date().getFullYear(),
        endYear: Number(b.endYear) || new Date().getFullYear() + 4,
        departmentId: b.departmentId || undefined,
        isActive: b.isActive !== false,
      }));
    }

    await institution.save();

    return res.json({
      success: true,
      message: "Institution settings updated successfully",
      data: { institution },
    });
  } catch (error) {
    console.error("updateInstitutionSettings error:", error);
    return res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};

/**
 * POST /api/tpo/settings/departments
 * Add a department
 */
export const addDepartment = async (req, res) => {
  try {
    const { name, code, description, type = "Engineering" } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }

    const institution = await Institution.findById(req.institutionId);
    institution.departments.push({
      name: name.trim(),
      code: code?.trim() || name.trim().slice(0, 6).toUpperCase(),
      type: type?.trim() || "Engineering",
      description: description?.trim(),
      isActive: true,
    });
    await institution.save();

    const newDept = institution.departments[institution.departments.length - 1];

    return res.status(201).json({
      success: true,
      message: "Department added",
      data: { department: newDept },
    });
  } catch (error) {
    console.error("addDepartment error:", error);
    return res.status(500).json({ success: false, message: "Failed to add department" });
  }
};

/**
 * DELETE /api/tpo/settings/departments/:deptId
 * Soft-delete a department (set isActive=false)
 */
export const removeDepartment = async (req, res) => {
  try {
    const { deptId } = req.params;
    const institution = await Institution.findById(req.institutionId);
    const dept = institution.departments.id(deptId);

    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    dept.isActive = false;
    await institution.save();

    return res.json({ success: true, message: "Department deactivated" });
  } catch (error) {
    console.error("removeDepartment error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove department" });
  }
};

/**
 * POST /api/tpo/settings/batches
 * Add a batch
 */
export const addBatch = async (req, res) => {
  try {
    const { name, startYear, endYear, departmentId } = req.body;

    if (!name?.trim() || !startYear || !endYear) {
      return res.status(400).json({ success: false, message: "name, startYear, endYear are required" });
    }

    const institution = await Institution.findById(req.institutionId);
    institution.batches.push({ name: name.trim(), startYear: Number(startYear), endYear: Number(endYear), departmentId });
    await institution.save();

    const newBatch = institution.batches[institution.batches.length - 1];

    return res.status(201).json({
      success: true,
      message: "Batch added",
      data: { batch: newBatch },
    });
  } catch (error) {
    console.error("addBatch error:", error);
    return res.status(500).json({ success: false, message: "Failed to add batch" });
  }
};

/**
 * DELETE /api/tpo/settings/batches/:batchId
 * Soft-delete a batch (set isActive=false)
 */
export const removeBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const institution = await Institution.findById(req.institutionId);
    const batch = institution.batches.id(batchId);

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    batch.isActive = false;
    await institution.save();

    return res.json({ success: true, message: "Batch deactivated" });
  } catch (error) {
    console.error("removeBatch error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove batch" });
  }
};


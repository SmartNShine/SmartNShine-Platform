import mongoose from "mongoose";
import Institution from "../models/Institution.model.js";
import TPO from "../models/TPO.model.js";
import User from "../models/User.model.js";
import { normalizeInstitutionStatus } from "../utils/institutionStatus.js";
import TPOAuditLog from "../models/TPOAuditLog.model.js";
import { countInstitutionStudentSeats } from "../utils/institutionStudentLimit.js";

const DEFAULT_DEPARTMENTS = [
  { name: "Computer Science & Engineering", code: "CSE", type: "Engineering" },
  { name: "Information Technology", code: "IT", type: "Engineering" },
  { name: "Electronics & Communication", code: "ECE", type: "Engineering" },
];

/**
 * Admin provisions a campus + primary TPO (immediate active access).
 * POST /api/admin/institutions
 */
export const createInstitution = async (req, res) => {
  try {
    const {
      institutionName,
      shortName,
      institutionEmail,
      contactPhone,
      website,
      address,
      emailDomain,
      tpoName,
      tpoEmail,
      tpoPassword,
      tpoDesignation,
      tpoPhone,
      departments,
      studentLimit,
    } = req.body;

    if (
      !institutionName ||
      !institutionEmail ||
      !tpoName ||
      !tpoEmail ||
      !tpoPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Institution name, institution email, TPO name, TPO email, and TPO password are required.",
      });
    }

    if (tpoPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "TPO password must be at least 6 characters.",
      });
    }

    const parsedStudentLimit = parseInt(studentLimit, 10);
    if (!Number.isFinite(parsedStudentLimit) || parsedStudentLimit < 1) {
      return res.status(400).json({
        success: false,
        message: "Student seat limit is required and must be at least 1.",
      });
    }
    if (parsedStudentLimit > 500000) {
      return res.status(400).json({
        success: false,
        message: "Student seat limit cannot exceed 500,000.",
      });
    }

    const normalizedTpoEmail = tpoEmail.toLowerCase().trim();
    const normalizedInstEmail = institutionEmail.toLowerCase().trim();

    const existingTpo =
      (await TPO.findOne({ email: normalizedTpoEmail })) ||
      (await User.findOne({ email: normalizedTpoEmail, role: "tpo" }));
    if (existingTpo) {
      return res.status(409).json({
        success: false,
        message: "A TPO account with this email already exists.",
      });
    }

    const existingInstitution = await Institution.findOne({
      contactEmail: normalizedInstEmail,
    });
    if (existingInstitution) {
      return res.status(409).json({
        success: false,
        message: `An institution with contact email ${normalizedInstEmail} already exists.`,
      });
    }

    let parsedDepartments = DEFAULT_DEPARTMENTS;
    if (Array.isArray(departments) && departments.length > 0) {
      parsedDepartments = departments.map((d) => ({
        name: typeof d === "string" ? d.trim() : d.name?.trim(),
        code: typeof d === "object" ? d.code?.trim() : undefined,
        type:
          typeof d === "object" ? d.type?.trim() || "Engineering" : "Engineering",
      }));
    }

    const year = new Date().getFullYear();

    const institution = new Institution({
      name: institutionName.trim(),
      shortName:
        shortName?.trim() || institutionName.trim().slice(0, 10).toUpperCase(),
      contactEmail: normalizedInstEmail,
      contactPhone: contactPhone?.trim(),
      website: website?.trim(),
      address: {
        street: address?.street || "",
        city: address?.city || "",
        state: address?.state || "",
        country: address?.country || "India",
        pincode: address?.pincode || "",
      },
      emailDomain: emailDomain?.toLowerCase().trim() || undefined,
      studentLimit: parsedStudentLimit,
      status: "active",
      departments: parsedDepartments,
      batches: [
        {
          name: `${year}-${year + 4}`,
          startYear: year,
          endYear: year + 4,
          isActive: true,
        },
      ],
    });

    await institution.save();

    let tpoUser;
    try {
      tpoUser = new TPO({
        name: tpoName.trim(),
        email: normalizedTpoEmail,
        password: tpoPassword,
        role: "tpo",
        institutionId: institution._id,
        designation: tpoDesignation?.trim() || "Head of Training & Placement",
        phone: tpoPhone?.trim() || contactPhone?.trim() || "",
        isPrimary: true,
        status: "active",
      });
      await tpoUser.save();
    } catch (tpoErr) {
      await Institution.findByIdAndDelete(institution._id);
      throw tpoErr;
    }

    try {
      await TPOAuditLog.create({
        institutionId: institution._id,
        tpoUserId: tpoUser._id,
        tpoModel: "TPO",
        action: "admin.institution.create",
        targetType: "institution",
        targetId: institution._id,
        description: `Campus provisioned by admin: ${institution.name}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    } catch (auditErr) {
      console.warn("TPO audit log skipped:", auditErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Campus and primary TPO account created. TPO can sign in immediately.",
      institution,
      tpo: {
        _id: tpoUser._id,
        name: tpoUser.name,
        email: tpoUser.email,
      },
    });
  } catch (error) {
    console.error("createInstitution error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create institution.",
    });
  }
};

/**
 * Update campus settings (e.g. student seat limit).
 * PATCH /api/admin/institutions/:id
 */
export const patchInstitution = async (req, res) => {
  try {
    const instId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(instId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid institution ID.",
      });
    }

    const institution = await Institution.findById(instId);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found.",
      });
    }

    const { studentLimit, status } = req.body;

    if (status !== undefined) {
      const nextStatus = normalizeInstitutionStatus(status);
      if (!["active", "suspended"].includes(nextStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be "active" or "suspended".',
        });
      }
      institution.status = nextStatus;

      if (nextStatus === "suspended") {
        await TPO.updateMany(
          { institutionId: institution._id },
          { $set: { status: "disabled" } },
        );
        await User.updateMany(
          { institutionId: institution._id, role: "tpo" },
          { $set: { status: "disabled" } },
        );
      } else {
        await TPO.updateMany(
          { institutionId: institution._id },
          { $set: { status: "active" } },
        );
        await User.updateMany(
          { institutionId: institution._id, role: "tpo" },
          { $set: { status: "active" } },
        );
      }
    }

    if (studentLimit !== undefined) {
      const parsed = parseInt(studentLimit, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return res.status(400).json({
          success: false,
          message: "Student seat limit must be at least 1.",
        });
      }
      if (parsed > 500000) {
        return res.status(400).json({
          success: false,
          message: "Student seat limit cannot exceed 500,000.",
        });
      }

      const used = await countInstitutionStudentSeats(institution._id);
      if (parsed < used) {
        return res.status(400).json({
          success: false,
          message: `Cannot set limit below current seat usage (${used} students enrolled or invited).`,
        });
      }
      institution.studentLimit = parsed;
    }

    await institution.save();

    return res.json({
      success: true,
      message: "Institution updated.",
      institution,
    });
  } catch (error) {
    console.error("patchInstitution error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update institution.",
    });
  }
};

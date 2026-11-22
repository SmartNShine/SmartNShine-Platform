import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.model.js";
import StudentInstitution from "../models/StudentInstitution.model.js";
import Institution from "../models/Institution.model.js";
import Resume from "../models/Resume.model.js";
import InterviewSession from "../models/InterviewSession.model.js";
import InterviewResult from "../models/InterviewResult.model.js";
import ReadinessSnapshot from "../models/ReadinessSnapshot.model.js";
import TPOAuditLog from "../models/TPOAuditLog.model.js";
import { checkInstitutionStudentCapacity } from "../utils/institutionStudentLimit.js";

/**
 * List institution students with filters, pagination, and readiness scores
 * GET /api/tpo/students
 */
export const getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      departmentId,
      batchId,
      status = "active",
      sortBy = "lastActiveAt",
      sortOrder = "desc",
    } = req.query;

    const query = {
      institutionId: req.institutionId,
    };

    if (status && status !== "all") {
      query.status = status;
    }

    if (departmentId) {
      query.departmentId = new mongoose.Types.ObjectId(departmentId);
    }

    if (batchId) {
      query.batchId = new mongoose.Types.ObjectId(batchId);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // First fetch links
    const total = await StudentInstitution.countDocuments(query);

    const studentLinks = await StudentInstitution.find(query)
      .populate("userId", "name email profilePicture lastLogin usage")
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Fetch institution department & batch names for display
    const institution = await Institution.findById(req.institutionId)
      .select("departments batches")
      .lean();

    const deptMap = {};
    institution?.departments?.forEach((d) => {
      deptMap[d._id.toString()] = d.name;
    });

    const batchMap = {};
    institution?.batches?.forEach((b) => {
      batchMap[b._id.toString()] = b.name;
    });

    // Fetch latest readiness snapshot for each student
    const userIds = studentLinks.map((l) => l.userId?._id).filter(Boolean);

    const snapshots = await ReadinessSnapshot.find({
      institutionId: req.institutionId,
      userId: { $in: userIds },
    })
      .sort({ computedAt: -1 })
      .lean();

    const snapshotMap = {};
    snapshots.forEach((s) => {
      const uId = s.userId.toString();
      if (!snapshotMap[uId]) {
        snapshotMap[uId] = s;
      }
    });

    // Filter by search keyword on name/email if provided
    let results = studentLinks.map((link) => {
      const u = link.userId || {};
      const snap = snapshotMap[u._id?.toString()];

      return {
        _id: link._id,
        linkId: link._id,
        userId: u._id,
        name: u.name || "Invited Student",
        email: u.email || "",
        profilePicture: u.profilePicture,
        rollNumber: link.rollNumber || "",
        section: link.section || "",
        departmentId: link.departmentId,
        departmentName: link.departmentId
          ? deptMap[link.departmentId.toString()] || "N/A"
          : "N/A",
        batchId: link.batchId,
        batchName: link.batchId
          ? batchMap[link.batchId.toString()] || "N/A"
          : "N/A",
        status: link.status,
        consentGiven: link.consentGiven,
        lastActiveAt: link.lastActiveAt || u.lastLogin,
        linkedAt: link.linkedAt || link.createdAt,
        readinessScore: snap?.overallScore ?? null,
        readinessComponents: snap?.components ?? null,
        resumesCreated: u.usage?.resumesCreated || 0,
      };
    });

    if (search.trim()) {
      const s = search.toLowerCase().trim();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(s) ||
          r.email.toLowerCase().includes(s) ||
          r.rollNumber.toLowerCase().includes(s),
      );
    }

    return res.json({
      success: true,
      data: {
        students: results,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("getStudents error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve students list.",
    });
  }
};

/**
 * Get detailed student profile for TPO
 * GET /api/tpo/students/:studentId
 */
export const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const link = await StudentInstitution.findOne({
      userId: studentId,
      institutionId: req.institutionId,
    })
      .populate("userId", "name email profilePicture lastLogin createdAt usage")
      .lean();

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in your institution.",
      });
    }

    const institution = await Institution.findById(req.institutionId)
      .select("departments batches settings")
      .lean();

    const department = institution?.departments?.find(
      (d) => d._id.toString() === link.departmentId?.toString(),
    );
    const batch = institution?.batches?.find(
      (b) => b._id.toString() === link.batchId?.toString(),
    );

    // Latest readiness snapshot
    const readiness = await ReadinessSnapshot.findOne({
      userId: studentId,
      institutionId: req.institutionId,
    })
      .sort({ computedAt: -1 })
      .lean();

    // Resume metrics (without exposing sensitive raw content unless permitted)
    const resumes = await Resume.find({ userId: studentId })
      .select(
        "resumeTitle templateId createdAt updatedAt skills experience education projects achievements targetJobRole",
      )
      .lean();

    const resumeMetrics = resumes.map((r) => ({
      _id: r._id,
      title: r.resumeTitle || "Untitled Resume",
      templateId: r.templateId,
      skillsCount:
        r.skills?.reduce((acc, cat) => acc + (cat.items?.length || 0), 0) || 0,
      experienceCount: r.experience?.length || 0,
      educationCount: r.education?.length || 0,
      projectsCount: r.projects?.length || 0,
      hasSummary: Boolean(r.summary),
      targetJobRole: r.targetJobRole,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));

    // Interview metrics
    const interviewSessions = await InterviewSession.find({
      userId: studentId,
      status: "completed",
    })
      .select(
        "interviewType role currentQuestionIndex totalQuestions totalDurationSeconds createdAt averageScore",
      )
      .lean();

    const interviewResults = await InterviewResult.find({ userId: studentId })
      .select(
        "overallScore skillBreakdown strengths weaknesses hiringRecommendation createdAt interviewType role",
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        student: {
          _id: link.userId?._id,
          name: link.userId?.name,
          email: link.userId?.email,
          profilePicture: link.userId?.profilePicture,
          lastLogin: link.userId?.lastLogin,
          createdAt: link.userId?.createdAt,
        },
        enrollment: {
          linkId: link._id,
          rollNumber: link.rollNumber,
          section: link.section || null,
          department: department
            ? {
                id: department._id,
                name: department.name,
                code: department.code,
              }
            : null,
          batch: batch ? { id: batch._id, name: batch.name } : null,
          status: link.status,
          consentGiven: link.consentGiven,
          linkedAt: link.linkedAt || link.createdAt,
          lastActiveAt: link.lastActiveAt,
        },
        readiness,
        resumeCount: resumes.length,
        resumes: resumeMetrics,
        interviewCount: interviewSessions.length,
        interviews: interviewResults,
      },
    });
  } catch (error) {
    console.error("getStudentProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student profile.",
    });
  }
};

/**
 * Invite an individual student
 * POST /api/tpo/students/invite
 */
export const inviteStudent = async (req, res) => {
  try {
    const { email, name, rollNumber, departmentId, batchId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Student email is required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find or create placeholder user
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // Create user account with a secure temporary password
      const tempPassword = crypto.randomBytes(8).toString("hex") + "A1!";
      user = new User({
        name: name?.trim() || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: tempPassword,
        role: "user",
      });
      await user.save();
    }

    // Check if already linked
    let link = await StudentInstitution.findOne({
      userId: user._id,
      institutionId: req.institutionId,
    });

    if (link && link.status === "active") {
      return res.status(409).json({
        success: false,
        message:
          "This student is already actively enrolled in your institution.",
      });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const needsNewSeat =
      !link ||
      (link.status !== "pending" && link.status !== "active");

    if (needsNewSeat) {
      const capacity = await checkInstitutionStudentCapacity(
        req.institutionId,
        1,
      );
      if (!capacity.ok) {
        return res.status(capacity.status || 403).json({
          success: false,
          message: capacity.message,
          seatUsage: { used: capacity.used, limit: capacity.limit },
        });
      }
    }

    if (!link) {
      link = new StudentInstitution({
        userId: user._id,
        institutionId: req.institutionId,
        departmentId: departmentId
          ? new mongoose.Types.ObjectId(departmentId)
          : undefined,
        batchId: batchId ? new mongoose.Types.ObjectId(batchId) : undefined,
        rollNumber: rollNumber?.trim(),
        status: "pending",
        invitedBy: req.user.userId,
        invitedAt: new Date(),
        inviteToken,
        inviteTokenExpires: expiresAt,
        consentGiven: false,
      });
    } else {
      link.status = "pending";
      link.invitedAt = new Date();
      link.inviteToken = inviteToken;
      link.inviteTokenExpires = expiresAt;
      if (departmentId)
        link.departmentId = new mongoose.Types.ObjectId(departmentId);
      if (batchId) link.batchId = new mongoose.Types.ObjectId(batchId);
      if (rollNumber) link.rollNumber = rollNumber.trim();
    }

    await link.save();

    const inviteLink = `/tpo/accept-invite?token=${inviteToken}`;

    return res.status(201).json({
      success: true,
      message: `Invitation generated for ${normalizedEmail}`,
      data: {
        student: {
          userId: user._id,
          name: user.name,
          email: user.email,
        },
        inviteToken,
        inviteLink,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("inviteStudent error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to invite student.",
    });
  }
};

/**
 * Bulk import students via CSV/JSON payload
 * Handles auto-categorization by branch/department and batch
 * POST /api/tpo/students/bulk-import
 */
export const bulkImportStudents = async (req, res) => {
  try {
    const { students, defaultDepartmentId, defaultBatchId } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student records to import.",
      });
    }

    const institution = await Institution.findById(req.institutionId);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: "Institution not found.",
      });
    }

    let institutionModified = false;

    const initialCapacity = await checkInstitutionStudentCapacity(
      req.institutionId,
      0,
    );
    let seatsRemaining =
      initialCapacity.limit === null
        ? Number.POSITIVE_INFINITY
        : Math.max(0, initialCapacity.limit - initialCapacity.used);

    // Build lookup maps for departments
    const deptByCode = new Map();
    const deptByName = new Map();
    const deptMap = new Map(); // id -> name
    (institution.departments || []).forEach((d) => {
      if (d.isActive !== false) {
        if (d.code) deptByCode.set(d.code.toLowerCase().trim(), d);
        if (d.name) deptByName.set(d.name.toLowerCase().trim(), d);
        deptMap.set(d._id.toString(), d.name);
      }
    });

    // Build lookup maps for batches
    const batchByName = new Map();
    const batchByYear = new Map();
    const batchMap = new Map(); // id -> name
    (institution.batches || []).forEach((b) => {
      if (b.isActive !== false) {
        if (b.name) batchByName.set(b.name.toLowerCase().trim(), b);
        if (b.endYear) batchByYear.set(Number(b.endYear), b);
        batchMap.set(b._id.toString(), b.name);
      }
    });

    const results = {
      total: students.length,
      invited: 0,
      alreadyActive: 0,
      categorizedByBranch: {},
      categorizedByBatch: {},
      errors: [],
    };

    for (let i = 0; i < students.length; i++) {
      const item = students[i];
      const email = item.email?.toLowerCase().trim();

      if (!email || !email.includes("@")) {
        results.errors.push({ row: i + 1, error: "Missing or invalid email address." });
        continue;
      }

      try {
        // 1. Resolve Department / Branch
        let matchedDeptId = null;
        let matchedDeptName = "Unassigned";

        if (item.departmentId && mongoose.Types.ObjectId.isValid(item.departmentId)) {
          matchedDeptId = new mongoose.Types.ObjectId(item.departmentId);
          matchedDeptName = deptMap.get(item.departmentId.toString()) || "Custom Branch";
        } else {
          const rawBranch = (
            item.branch ||
            item.department ||
            item.dept ||
            item.branchCode ||
            item.stream ||
            item.course ||
            ""
          ).toString().trim();

          if (rawBranch) {
            const bClean = rawBranch.toLowerCase();

            // Try exact code match (e.g., "CSE")
            let foundDept = deptByCode.get(bClean);

            // Try exact name match (e.g., "Computer Science")
            if (!foundDept) foundDept = deptByName.get(bClean);

            // Try partial / common abbreviation matching
            if (!foundDept) {
              for (const [nameKey, deptObj] of deptByName.entries()) {
                if (nameKey.includes(bClean) || bClean.includes(nameKey)) {
                  foundDept = deptObj;
                  break;
                }
              }
            }

            // Auto-create department if not present in college's database
            if (!foundDept && rawBranch.length > 0) {
              const autoCode =
                rawBranch.length <= 6
                  ? rawBranch.toUpperCase()
                  : rawBranch
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 6) || "DEPT";

              institution.departments.push({
                name: rawBranch,
                code: autoCode,
                type: "Engineering",
                isActive: true,
              });
              foundDept = institution.departments[institution.departments.length - 1];
              deptByCode.set(autoCode.toLowerCase(), foundDept);
              deptByName.set(rawBranch.toLowerCase(), foundDept);
              deptMap.set(foundDept._id.toString(), foundDept.name);
              institutionModified = true;
            }

            if (foundDept) {
              matchedDeptId = foundDept._id;
              matchedDeptName = foundDept.name;
            }
          }

          // Fallback to defaultDepartmentId if supplied
          if (!matchedDeptId && defaultDepartmentId && mongoose.Types.ObjectId.isValid(defaultDepartmentId)) {
            matchedDeptId = new mongoose.Types.ObjectId(defaultDepartmentId);
            matchedDeptName = deptMap.get(defaultDepartmentId.toString()) || "Default Branch";
          }
        }

        // 2. Resolve Batch
        let matchedBatchId = null;
        let matchedBatchName = "Unassigned";

        if (item.batchId && mongoose.Types.ObjectId.isValid(item.batchId)) {
          matchedBatchId = new mongoose.Types.ObjectId(item.batchId);
          matchedBatchName = batchMap.get(item.batchId.toString()) || "Custom Batch";
        } else {
          const rawBatch = (
            item.batch ||
            item.batchName ||
            item.year ||
            item.graduationYear ||
            item.passoutYear ||
            ""
          ).toString().trim();

          if (rawBatch) {
            const batchClean = rawBatch.toLowerCase();
            let foundBatch = batchByName.get(batchClean);

            const numYear = Number(rawBatch);
            if (!foundBatch && !isNaN(numYear)) {
              foundBatch = batchByYear.get(numYear);
            }

            // Auto-create batch if format matches year (e.g., 2025 or 2021-2025)
            if (!foundBatch && (rawBatch.includes("-") || !isNaN(numYear))) {
              const endYear = rawBatch.includes("-")
                ? Number(rawBatch.split("-")[1]?.trim()) || new Date().getFullYear() + 4
                : numYear;
              const startYear = rawBatch.includes("-")
                ? Number(rawBatch.split("-")[0]?.trim()) || endYear - 4
                : endYear - 4;
              const bName = rawBatch.includes("-") ? rawBatch : `${startYear}-${endYear}`;

              institution.batches.push({
                name: bName,
                startYear,
                endYear,
                isActive: true,
              });
              foundBatch = institution.batches[institution.batches.length - 1];
              batchByName.set(bName.toLowerCase(), foundBatch);
              batchByYear.set(endYear, foundBatch);
              batchMap.set(foundBatch._id.toString(), foundBatch.name);
              institutionModified = true;
            }

            if (foundBatch) {
              matchedBatchId = foundBatch._id;
              matchedBatchName = foundBatch.name;
            }
          }

          // Fallback to defaultBatchId if supplied
          if (!matchedBatchId && defaultBatchId && mongoose.Types.ObjectId.isValid(defaultBatchId)) {
            matchedBatchId = new mongoose.Types.ObjectId(defaultBatchId);
            matchedBatchName = batchMap.get(defaultBatchId.toString()) || "Default Batch";
          }
        }

        // Extract roll number and section
        const rollNumber = (
          item.rollNumber ||
          item.roll_number ||
          item.rollNo ||
          item.usn ||
          item.regNo ||
          item.prn ||
          ""
        ).toString().trim();

        const section = (
          item.section ||
          item.division ||
          item.sec ||
          ""
        ).toString().trim();

        // 3. Find or Create User Account
        let user = await User.findOne({ email });
        if (!user) {
          const tempPassword = crypto.randomBytes(8).toString("hex") + "A1!";
          user = new User({
            name: item.name?.trim() || email.split("@")[0],
            email,
            password: tempPassword,
            role: "user",
          });
          await user.save();
        }

        // 4. Link Student to Institution
        const existingLink = await StudentInstitution.findOne({
          userId: user._id,
          institutionId: req.institutionId,
        });

        if (existingLink && existingLink.status === "active") {
          results.alreadyActive++;
          continue;
        }

        const reusesSeat =
          existingLink &&
          (existingLink.status === "pending" ||
            existingLink.status === "active");

        if (!reusesSeat) {
          if (seatsRemaining <= 0) {
            results.errors.push({
              row: i + 1,
              email,
              error: "Student seat limit reached for this institution.",
            });
            continue;
          }
          seatsRemaining -= 1;
        }

        const inviteToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        if (!existingLink) {
          const newLink = new StudentInstitution({
            userId: user._id,
            institutionId: req.institutionId,
            departmentId: matchedDeptId || undefined,
            batchId: matchedBatchId || undefined,
            rollNumber: rollNumber || undefined,
            section: section || undefined,
            status: "pending",
            invitedBy: req.user.userId,
            invitedAt: new Date(),
            inviteToken,
            inviteTokenExpires: expiresAt,
            consentGiven: false,
          });
          await newLink.save();
        } else {
          existingLink.status = "pending";
          existingLink.inviteToken = inviteToken;
          existingLink.inviteTokenExpires = expiresAt;
          if (matchedDeptId) existingLink.departmentId = matchedDeptId;
          if (matchedBatchId) existingLink.batchId = matchedBatchId;
          if (rollNumber) existingLink.rollNumber = rollNumber;
          if (section) existingLink.section = section;
          await existingLink.save();
        }

        results.invited++;

        // Track categorization breakdown
        results.categorizedByBranch[matchedDeptName] =
          (results.categorizedByBranch[matchedDeptName] || 0) + 1;
        results.categorizedByBatch[matchedBatchName] =
          (results.categorizedByBatch[matchedBatchName] || 0) + 1;
      } catch (err) {
        results.errors.push({ row: i + 1, email, error: err.message });
      }
    }

    if (institutionModified) {
      await institution.save();
    }

    return res.json({
      success: true,
      message: `Bulk import completed: ${results.invited} students invited and categorized.`,
      results,
    });
  } catch (error) {
    console.error("bulkImportStudents error:", error);
    return res.status(500).json({
      success: false,
      message: "Bulk import operation failed.",
    });
  }
};

/**
 * Accept invite token (Public endpoint)
 * POST /api/tpo/students/accept-invite
 */
export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required.",
      });
    }

    const link = await StudentInstitution.findOne({
      inviteToken: token,
      inviteTokenExpires: { $gt: new Date() },
    })
      .populate("institutionId", "name shortName logoUrl")
      .populate("userId", "name email");

    if (!link) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired invitation token.",
      });
    }

    return res.json({
      success: true,
      data: {
        institution: link.institutionId,
        student: {
          name: link.userId?.name,
          email: link.userId?.email,
          userId: link.userId?._id,
        },
        rollNumber: link.rollNumber,
      },
    });
  } catch (error) {
    console.error("acceptInvite error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify invitation token.",
    });
  }
};

/**
 * Student gives consent to institution linking (Authenticated student)
 * POST /api/tpo/students/consent
 */
export const giveConsent = async (req, res) => {
  try {
    const { token, institutionId } = req.body;

    const query = { userId: req.user.userId };
    if (token) query.inviteToken = token;
    if (institutionId) query.institutionId = institutionId;

    const link = await StudentInstitution.findOne(query);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "No pending institution invitation found for your account.",
      });
    }

    link.consentGiven = true;
    link.consentGivenAt = new Date();
    link.status = "active";
    link.linkedAt = new Date();
    link.inviteToken = undefined;
    link.inviteTokenExpires = undefined;

    await link.save();

    return res.json({
      success: true,
      message: "Institution enrollment confirmed and consent recorded.",
      data: {
        institutionId: link.institutionId,
        status: link.status,
      },
    });
  } catch (error) {
    console.error("giveConsent error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit consent.",
    });
  }
};

/**
 * Deactivate a student's institution access
 * PUT /api/tpo/students/:studentId/deactivate
 */
export const deactivateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reason } = req.body;

    const link = await StudentInstitution.findOne({
      userId: studentId,
      institutionId: req.institutionId,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Student enrollment not found.",
      });
    }

    link.status = "deactivated";
    link.deactivatedAt = new Date();
    link.deactivatedReason = reason?.trim() || "Deactivated by TPO";

    await link.save();

    return res.json({
      success: true,
      message: "Student deactivated successfully.",
    });
  } catch (error) {
    console.error("deactivateStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to deactivate student.",
    });
  }
};

/**
 * Reactivate student
 * PUT /api/tpo/students/:studentId/reactivate
 */
export const reactivateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const link = await StudentInstitution.findOne({
      userId: studentId,
      institutionId: req.institutionId,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Student enrollment not found.",
      });
    }

    if (link.status !== "active" && link.status !== "pending") {
      const capacity = await checkInstitutionStudentCapacity(
        req.institutionId,
        1,
      );
      if (!capacity.ok) {
        return res.status(capacity.status || 403).json({
          success: false,
          message: capacity.message,
          seatUsage: { used: capacity.used, limit: capacity.limit },
        });
      }
    }

    link.status = "active";
    link.deactivatedAt = undefined;
    link.deactivatedReason = undefined;

    await link.save();

    return res.json({
      success: true,
      message: "Student reactivated successfully.",
    });
  } catch (error) {
    console.error("reactivateStudent error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reactivate student.",
    });
  }
};

/**
 * Update student's department, batch, or roll number
 * PUT /api/tpo/students/:studentId
 */
export const updateStudentDepartmentBatch = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { departmentId, batchId, rollNumber } = req.body;

    const link = await StudentInstitution.findOne({
      userId: studentId,
      institutionId: req.institutionId,
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: "Student enrollment not found.",
      });
    }

    if (departmentId !== undefined) {
      link.departmentId = departmentId
        ? new mongoose.Types.ObjectId(departmentId)
        : undefined;
    }
    if (batchId !== undefined) {
      link.batchId = batchId ? new mongoose.Types.ObjectId(batchId) : undefined;
    }
    if (rollNumber !== undefined) {
      link.rollNumber = rollNumber.trim();
    }

    await link.save();

    return res.json({
      success: true,
      message: "Student details updated.",
      data: { link },
    });
  } catch (error) {
    console.error("updateStudentDepartmentBatch error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update student details.",
    });
  }
};

/**
 * Track student activity (logins, resumes, interviews)
 * GET /api/tpo/students/:studentId/activity
 */
export const getStudentActivity = async (req, res) => {
  try {
    const { studentId } = req.params;

    const user = await User.findById(studentId)
      .select("name email lastLogin createdAt usage")
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const resumes = await Resume.find({ userId: studentId })
      .select("resumeTitle createdAt updatedAt templateId")
      .sort({ updatedAt: -1 })
      .lean();

    const interviews = await InterviewSession.find({ userId: studentId })
      .select("interviewType role status completedAt createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      data: {
        lastLogin: user.lastLogin,
        joinedAt: user.createdAt,
        usage: user.usage,
        resumes: resumes.map((r) => ({
          id: r._id,
          title: r.resumeTitle || "Untitled Resume",
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        interviews: interviews.map((i) => ({
          id: i._id,
          role: i.role,
          type: i.interviewType,
          status: i.status,
          date: i.completedAt || i.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("getStudentActivity error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load student activity.",
    });
  }
};

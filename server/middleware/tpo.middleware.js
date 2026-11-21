import User from "../models/User.model.js";
import TPO from "../models/TPO.model.js";
import Institution from "../models/Institution.model.js";
import StudentInstitution from "../models/StudentInstitution.model.js";
import TPOAuditLog from "../models/TPOAuditLog.model.js";
import { isInstitutionAccessBlocked } from "../utils/institutionStatus.js";

/**
 * Middleware: Verify user is an authorized TPO and their campus is active.
 * Checks dedicated TPO model first, with fallback to User model.
 * Must be used AFTER authenticateToken middleware.
 */
export const isTpo = async (req, res, next) => {
  try {
    let tpo = await TPO.findById(req.user.userId).lean();
    if (!tpo) {
      tpo = await User.findById(req.user.userId).lean();
    }

    if (!tpo) {
      return res.status(404).json({ success: false, message: "TPO account not found" });
    }

    if (tpo.role !== "tpo") {
      return res.status(403).json({
        success: false,
        message: "Access denied. TPO privileges required.",
      });
    }

    if (tpo.status === "disabled") {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Contact your institution admin.",
      });
    }

    // Load institution
    const institution = await Institution.findById(tpo.institutionId).lean();

    if (!institution) {
      return res.status(403).json({
        success: false,
        message: "No institution linked to your account.",
      });
    }

    // Inject into request with normalized tpoProfile
    req.tpoUser = {
      ...tpo,
      tpoProfile: {
        designation: tpo.designation || tpo.tpoProfile?.designation || "Head of Training & Placement",
        phone: tpo.phone || tpo.tpoProfile?.phone || "",
        isPrimary: tpo.isPrimary !== undefined ? tpo.isPrimary : (tpo.tpoProfile?.isPrimary ?? false),
      },
    };
    req.institution = institution;
    req.institutionId = institution._id;

    if (isInstitutionAccessBlocked(institution.status)) {
      return res.status(403).json({
        success: false,
        message:
          "This campus is suspended. Contact SmartNShine support to restore access.",
        institutionStatus: "suspended",
      });
    }

    next();
  } catch (error) {
    console.error("TPO middleware error:", error);
    res.status(500).json({ success: false, message: "Authorization check failed" });
  }
};

/**
 * Middleware: Validate that a student belongs to the TPO's institution
 * before exposing any student data.
 * Reads :studentId or req.body.userId and validates the link.
 * Sets req.studentLink = StudentInstitution document.
 */
export const validateStudentAccess = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.body.userId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const link = await StudentInstitution.findOne({
      userId: studentId,
      institutionId: req.institutionId,
      status: "active",
      consentGiven: true,
    }).lean();

    if (!link) {
      return res.status(403).json({
        success: false,
        message:
          "Student not found in your institution or has not given consent.",
      });
    }

    req.studentLink = link;
    next();
  } catch (error) {
    console.error("Student access validation error:", error);
    res.status(500).json({ success: false, message: "Student access check failed" });
  }
};

/**
 * Middleware: Write an audit log entry for every TPO action.
 * Attach to routes that read or modify student data.
 */
export const auditLog = (action, targetType = null) => {
  return async (req, res, next) => {
    // Capture original json method to log after response
    const originalJson = res.json.bind(res);

    res.json = async (body) => {
      // Only log on success responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const targetId =
            req.params.studentId ||
            req.params.assignmentId ||
            req.params.id ||
            req.body?.userId ||
            null;

          await TPOAuditLog.create({
            institutionId: req.institutionId,
            tpoUserId: req.tpoUser?._id || req.user?.userId,
            action,
            targetType,
            targetId: targetId || undefined,
            description: `${req.method} ${req.originalUrl}`,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            success: true,
          });
        } catch (logError) {
          // Audit log failure must NOT block the response
          console.error("Audit log write error:", logError.message);
        }
      }
      return originalJson(body);
    };

    next();
  };
};


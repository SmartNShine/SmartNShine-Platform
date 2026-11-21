import User from "../models/User.model.js";
import TPO from "../models/TPO.model.js";
import Institution from "../models/Institution.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import TPOAuditLog from "../models/TPOAuditLog.model.js";

/**
 * Helper to generate TPO JWT
 */
const generateTPOToken = (tpo) => {
  return jwt.sign(
    {
      userId: tpo._id,
      email: tpo.email,
      role: "tpo",
      institutionId: tpo.institutionId,
      userType: "tpo",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

/**
 * TPO Login
 * POST /api/tpo/auth/login
 */
export const loginTpo = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up in dedicated TPO model first
    let tpo = await TPO.findOne({ email: normalizedEmail });
    let isLegacyUser = false;

    // Graceful backward-compatibility check in User model
    if (!tpo) {
      const legacyUser = await User.findOne({ email: normalizedEmail, role: "tpo" });
      if (legacyUser) {
        tpo = legacyUser;
        isLegacyUser = true;
      }
    }

    if (!tpo) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (tpo.role !== "tpo" && tpo.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "This portal is reserved for Training & Placement Officers.",
      });
    }

    const isMatch = await tpo.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (tpo.status === "disabled") {
      return res.status(403).json({
        success: false,
        message:
          "Your TPO account has been disabled. Please contact your institution administrator.",
      });
    }

    // Auto-migrate legacy user into TPO model seamlessly
    if (isLegacyUser && tpo.institutionId) {
      try {
        const migrated = new TPO({
          _id: tpo._id,
          name: tpo.name,
          email: tpo.email,
          password: tpo.password,
          role: "tpo",
          institutionId: tpo.institutionId,
          designation: tpo.tpoProfile?.designation || "Head of Training & Placement",
          phone: tpo.tpoProfile?.phone || "",
          isPrimary: tpo.tpoProfile?.isPrimary ?? true,
          status: tpo.status || "active",
          lastLogin: new Date(),
        });
        const now = new Date();
        const storedTpo = await TPO.collection.findOneAndUpdate(
          { _id: tpo._id, email: normalizedEmail },
          { $setOnInsert: { ...migrated.toObject(), createdAt: now, updatedAt: now } },
          { upsert: true, returnDocument: "after" },
        );
        tpo = TPO.hydrate(storedTpo);
        await User.findByIdAndDelete(tpo._id);
      } catch (migErr) {
        console.warn("Legacy TPO auto-migration warning:", migErr.message);
      }
    }

    // Fetch linked institution
    let institution = null;
    if (tpo.institutionId) {
      institution = await Institution.findById(tpo.institutionId);
    }

    const token = generateTPOToken(tpo);

    tpo.lastLogin = new Date();
    await tpo.save();

    if (institution) {
      try {
        await TPOAuditLog.create({
          institutionId: institution._id,
          tpoUserId: tpo._id,
          tpoModel: isLegacyUser ? "User" : "TPO",
          action: "tpo.login",
          targetType: "tpo",
          targetId: tpo._id,
          description: `TPO logged in: ${tpo.name}`,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      } catch (auditErr) {
        console.warn("Non-fatal TPOAuditLog warning during login:", auditErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: tpo._id,
        _id: tpo._id,
        name: tpo.name,
        email: tpo.email,
        role: "tpo",
        institutionId: tpo.institutionId,
        tpoProfile: {
          designation: tpo.designation || tpo.tpoProfile?.designation || "TPO",
          phone: tpo.phone || tpo.tpoProfile?.phone || "",
          isPrimary: tpo.isPrimary !== undefined ? tpo.isPrimary : (tpo.tpoProfile?.isPrimary ?? false),
        },
      },
      institution: institution
        ? {
            _id: institution._id,
            name: institution.name,
            shortName: institution.shortName,
            status: institution.status,
            contactEmail: institution.contactEmail,
            departments: institution.departments,
            batches: institution.batches,
            settings: institution.settings,
          }
        : null,
    });
  } catch (error) {
    console.error("loginTpo error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to log in as TPO.",
    });
  }
};

/**
 * Add / Invite a secondary TPO account
 * POST /api/tpo/auth/invite-tpo
 */
export const inviteTpo = async (req, res) => {
  try {
    const { name, email, designation, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required for the new TPO.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Only primary TPO can add officers
    if (!req.tpoUser.isPrimary && !req.tpoUser.tpoProfile?.isPrimary) {
      return res.status(403).json({
        success: false,
        message:
          "Only the primary TPO administrator can add authorized TPO accounts.",
      });
    }

    const existingTpo = await TPO.findOne({ email: normalizedEmail });
    if (existingTpo) {
      return res.status(409).json({
        success: false,
        message: "A TPO account with this email already exists.",
      });
    }

    // Generate secure temporary password
    const tempPassword = crypto.randomBytes(6).toString("hex") + "A1!";

    const newTpo = new TPO({
      name: name.trim(),
      email: normalizedEmail,
      password: tempPassword,
      role: "tpo",
      institutionId: req.institutionId,
      designation: designation?.trim() || "Placement Officer",
      phone: phone?.trim() || "",
      isPrimary: false,
      status: "active",
    });

    await newTpo.save();

    return res.status(201).json({
      success: true,
      message: "TPO account created successfully.",
      data: {
        tpo: {
          id: newTpo._id,
          name: newTpo.name,
          email: newTpo.email,
          designation: newTpo.designation,
          tempPassword,
        },
      },
    });
  } catch (error) {
    console.error("inviteTpo error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create TPO account.",
    });
  }
};

/**
 * Get current TPO Profile and Institution details
 * GET /api/tpo/auth/profile
 */
export const getTpoProfile = async (req, res) => {
  try {
    let tpo = await TPO.findById(req.user.userId).select("-password").lean();
    if (!tpo) {
      tpo = await User.findById(req.user.userId).select("-password").lean();
    }

    if (!tpo) {
      return res.status(404).json({
        success: false,
        message: "TPO profile not found.",
      });
    }

    const institution = await Institution.findById(tpo.institutionId).lean();

    return res.json({
      success: true,
      data: {
        user: {
          _id: tpo._id,
          id: tpo._id,
          name: tpo.name,
          email: tpo.email,
          role: "tpo",
          institutionId: tpo.institutionId,
          tpoProfile: {
            designation: tpo.designation || tpo.tpoProfile?.designation || "TPO",
            phone: tpo.phone || tpo.tpoProfile?.phone || "",
            isPrimary: tpo.isPrimary !== undefined ? tpo.isPrimary : (tpo.tpoProfile?.isPrimary ?? false),
          },
        },
        institution,
      },
    });
  } catch (error) {
    console.error("getTpoProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile.",
    });
  }
};

/**
 * Update TPO profile
 * PUT /api/tpo/auth/profile
 */
export const updateTpoProfile = async (req, res) => {
  try {
    const { name, designation, phone } = req.body;

    let tpo = await TPO.findById(req.user.userId);
    if (tpo) {
      if (name) tpo.name = name.trim();
      if (designation !== undefined) tpo.designation = designation.trim();
      if (phone !== undefined) tpo.phone = phone.trim();
      await tpo.save();
    } else {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "TPO profile not found.",
        });
      }
      if (name) user.name = name.trim();
      if (designation !== undefined) {
        if (!user.tpoProfile) user.tpoProfile = {};
        user.tpoProfile.designation = designation.trim();
      }
      if (phone !== undefined) {
        if (!user.tpoProfile) user.tpoProfile = {};
        user.tpoProfile.phone = phone.trim();
      }
      await user.save();
      tpo = user;
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user: {
          id: tpo._id,
          _id: tpo._id,
          name: tpo.name,
          email: tpo.email,
          role: "tpo",
          tpoProfile: {
            designation: tpo.designation || tpo.tpoProfile?.designation,
            phone: tpo.phone || tpo.tpoProfile?.phone,
            isPrimary: tpo.isPrimary !== undefined ? tpo.isPrimary : tpo.tpoProfile?.isPrimary,
          },
        },
      },
    });
  } catch (error) {
    console.error("updateTpoProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

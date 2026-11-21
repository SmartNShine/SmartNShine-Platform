import User from "../models/User.model.js";
import {generateToken} from "../middleware/auth.middleware.js";
import crypto from "crypto";
import {
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation,
} from "../services/email.service.js";
import {notifyNewUser} from "../services/adminNotification.service.js";

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const {email, password, name} = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({error: "All fields are required"});
    }

    // Check if user already exists
    const existingUser = await User.findOne({email});
    if (existingUser) {
      return res
        .status(409)
        .json({error: "User already exists with this email"});
    }

    // Create new user
    const user = new User({email, password, name});
    await user.save();
    notifyNewUser(user, "local");

    // Generate token
    const token = generateToken(user._id, user.email);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role || "user",
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({error: "Registration failed"});
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const {email, password} = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({error: "Email and password are required"});
    }

    // Find user
    const user = await User.findOne({email});
    if (!user) {
      return res.status(401).json({error: "Invalid credentials"});
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({error: "Invalid credentials"});
    }

    // Generate token
    const token = generateToken(user._id, user.email);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role || "user",
        status: user.status || "active",
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({error: "Login failed"});
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    let user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      if (req.user?.role === "tpo" || req.user?.userType === "tpo") {
        const TPO = (await import("../models/TPO.model.js")).default;
        const tpo = await TPO.findById(req.user.userId)
          .select("-password")
          .populate("institutionId");
        if (tpo) {
          return res.json({
            user: {
              _id: tpo._id,
              id: tpo._id,
              name: tpo.name,
              email: tpo.email,
              role: "tpo",
              userType: "tpo",
              designation: tpo.designation,
              institution: tpo.institutionId,
              institutionId: tpo.institutionId?._id || tpo.institutionId,
              status: tpo.status,
            },
          });
        }
      }
      return res.status(404).json({error: "User not found"});
    }

    res.json({user});
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({error: "Failed to get user profile"});
  }
};

/**
 * Forgot Password - Send reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const {email} = req.body;

    if (!email) {
      return res.status(400).json({error: "Email is required"});
    }

    // Find user by email
    const user = await User.findOne({email: email.toLowerCase()});

    // Always return success message (security best practice - don't reveal if email exists)
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Hash token before saving to database
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Save hashed token and expiry to database
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
      await user.save();

      // Send email with unhashed token
      try {
        await sendPasswordResetEmail(email, resetToken, user.name);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
        return res.status(500).json({
          error: "Failed to send reset email. Please try again later.",
        });
      }
    }

    // Always return success (security best practice)
    res.json({
      message: "If that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({error: "Failed to process request"});
  }
};

/**
 * Reset Password - Update password with token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const {token, newPassword} = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({error: "Token and new password are required"});
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({error: "Password must be at least 6 characters long"});
    }

    // Hash the token from URL to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {$gt: Date.now()}, // Token not expired
    });

    if (!user) {
      return res
        .status(400)
        .json({error: "Invalid or expired password reset token"});
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email (non-blocking)
    sendPasswordChangeConfirmation(user.email, user.name).catch((err) =>
      console.error("Failed to send confirmation email:", err)
    );

    res.json({
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({error: "Failed to reset password"});
  }
};

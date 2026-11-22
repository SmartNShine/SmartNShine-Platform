import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * TPO (Training & Placement Officer) Model
 * Represents verified institutional staff and officers.
 * Kept strictly isolated from the consumer B2C User model.
 */
const tpoSchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    designation: {
      type: String,
      trim: true,
      default: "Head of Training & Placement",
    },
    phone: {
      type: String,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "tpo",
    },
    status: {
      type: String,
      enum: ["active", "pending", "disabled"],
      default: "active",
      index: true,
    },
    permissions: {
      canManageStudents: { type: Boolean, default: true },
      canCreateAssignments: { type: Boolean, default: true },
      canPostAnnouncements: { type: Boolean, default: true },
      canExportReports: { type: Boolean, default: true },
      canEditSettings: { type: Boolean, default: true },
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
tpoSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
tpoSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Compound index for institution queries
tpoSchema.index({ institutionId: 1, status: 1 });

const TPO = mongoose.model("TPO", tpoSchema);

export default TPO;


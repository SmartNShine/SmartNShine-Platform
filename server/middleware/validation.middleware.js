import {body, param, query, validationResult} from "express-validator";
import validator from "validator";

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// ============================================================================
// AUTH VALIDATION RULES
// ============================================================================

/**
 * Validation rules for user registration
 */
export const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({min: 2, max: 100})
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .custom((value) => {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email format");
      }
      return true;
    }),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({min: 8, max: 128})
    .withMessage("Password must be between 8 and 128 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),

  handleValidationErrors,
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({min: 1, max: 128})
    .withMessage("Password is required"),

  handleValidationErrors,
];

/**
 * Validation rules for forgot password
 */
export const validateForgotPassword = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  handleValidationErrors,
];

/**
 * Validation rules for reset password
 */
export const validateResetPassword = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isLength({min: 20, max: 500})
    .withMessage("Invalid reset token"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({min: 8, max: 128})
    .withMessage("Password must be between 8 and 128 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  handleValidationErrors,
];

/**
 * Validation rules for change password
 */
export const validateChangePassword = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({min: 8, max: 128})
    .withMessage("Password must be between 8 and 128 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),

  handleValidationErrors,
];

// ============================================================================
// RESUME VALIDATION RULES
// ============================================================================

/**
 * Validation rules for resume creation
 */
export const validateResumeCreate = [
  body("title")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("resumeTitle")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Resume title must be between 1 and 200 characters"),

  body("templateId")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Invalid template ID"),

  body("name")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),

  body("contact")
    .optional({ values: "falsy" })
    .isObject()
    .withMessage("Contact must be an object"),

  body("contact.email")
    .optional({ values: "falsy" })
    .trim()
    .custom((value) => {
      if (!value || value.trim() === "") return true;
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email format");
      }
      return true;
    }),

  body("contact.phone")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Phone must not exceed 50 characters"),

  body("contact.location")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Location must not exceed 300 characters"),

  body("contact.linkedin")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("LinkedIn URL must not exceed 500 characters"),

  body("contact.portfolio")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Portfolio URL must not exceed 500 characters"),

  body("contact.github")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("GitHub URL must not exceed 500 characters"),

  body("summary")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 10000 })
    .withMessage("Summary must not exceed 10000 characters"),

  body("experience")
    .optional()
    .isArray()
    .withMessage("Experience must be an array"),

  body("education")
    .optional()
    .isArray()
    .withMessage("Education must be an array"),

  body("skills").optional().isArray().withMessage("Skills must be an array"),

  body("projects")
    .optional()
    .isArray()
    .withMessage("Projects must be an array"),

  body("certifications")
    .optional()
    .isArray()
    .withMessage("Certifications must be an array"),

  body("achievements")
    .optional()
    .isArray()
    .withMessage("Achievements must be an array"),

  body("customSections")
    .optional()
    .isArray()
    .withMessage("Custom sections must be an array"),

  body("customSections.*.id")
    .optional()
    .trim()
    .isLength({max: 100})
    .withMessage("Custom section ID must not exceed 100 characters"),

  body("customSections.*.title")
    .optional()
    .trim()
    .isLength({max: 200})
    .withMessage("Custom section title must not exceed 200 characters"),

  body("customSections.*.items")
    .optional()
    .isArray()
    .withMessage("Custom section items must be an array"),

  body("customSections.*.content")
    .optional(),
  handleValidationErrors,
];

/**
 * Validation rules for resume update
 */
export const validateResumeUpdate = [
  param("id").isMongoId().withMessage("Invalid resume ID"),

  body("title")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title must be between 1 and 200 characters"),

  body("resumeTitle")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Resume title must be between 1 and 200 characters"),

  body("templateId")
    .optional({ values: "falsy" })
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Invalid template ID"),

  body("name")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Name must not exceed 100 characters"),

  body("contact")
    .optional({ values: "falsy" })
    .isObject()
    .withMessage("Contact must be an object"),

  body("contact.email")
    .optional({ values: "falsy" })
    .trim()
    .custom((value) => {
      if (!value || value.trim() === "") return true;
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email format");
      }
      return true;
    }),

  body("contact.phone")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 50 })
    .withMessage("Phone must not exceed 50 characters"),

  body("contact.location")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Location must not exceed 300 characters"),

  body("contact.linkedin")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("LinkedIn URL must not exceed 500 characters"),

  body("contact.portfolio")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("Portfolio URL must not exceed 500 characters"),

  body("contact.github")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 })
    .withMessage("GitHub URL must not exceed 500 characters"),

  body("summary")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 10000 })
    .withMessage("Summary must not exceed 10000 characters"),

  body("experience")
    .optional()
    .isArray()
    .withMessage("Experience must be an array"),

  body("education")
    .optional()
    .isArray()
    .withMessage("Education must be an array"),

  body("skills").optional().isArray().withMessage("Skills must be an array"),

  body("projects")
    .optional()
    .isArray()
    .withMessage("Projects must be an array"),

  body("certifications")
    .optional()
    .isArray()
    .withMessage("Certifications must be an array"),

  body("achievements")
    .optional()
    .isArray()
    .withMessage("Achievements must be an array"),

  body("customSections")
    .optional()
    .isArray()
    .withMessage("Custom sections must be an array"),

  body("customSections.*.id")
    .optional()
    .trim()
    .isLength({max: 100})
    .withMessage("Custom section ID must not exceed 100 characters"),

  body("customSections.*.title")
    .optional()
    .trim()
    .isLength({max: 200})
    .withMessage("Custom section title must not exceed 200 characters"),

  body("customSections.*.items")
    .optional()
    .isArray()
    .withMessage("Custom section items must be an array"),

  body("customSections.*.content")
    .optional(),
  handleValidationErrors,
];

/**
 * Validation rules for resume ID parameter
 */
export const validateResumeId = [
  param("id").isMongoId().withMessage("Invalid resume ID"),

  handleValidationErrors,
];

/**
 * Validation rules for content enhancement
 */
export const validateContentEnhance = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({min: 10, max: 10000})
    .withMessage("Content must be between 10 and 10,000 characters"),

  body("sectionType")
    .trim()
    .notEmpty()
    .withMessage("Section type is required")
    .isIn([
      "experience",
      "summary",
      "skills",
      "education",
      "projects",
      "achievements",
      "custom",
    ])
    .withMessage("Invalid section type"),

  body("jobTitle")
    .optional()
    .trim()
    .isLength({max: 200})
    .withMessage("Job title must not exceed 200 characters"),

  body("industry")
    .optional()
    .trim()
    .isLength({max: 100})
    .withMessage("Industry must not exceed 100 characters"),

  handleValidationErrors,
];

/**
 * Validation rules for skills categorization
 */
export const validateSkillsCategorize = [
  body("skills")
    .trim()
    .notEmpty()
    .withMessage("Skills text is required")
    .isString()
    .withMessage("Skills must be a string")
    .isLength({min: 1, max: 5000})
    .withMessage("Skills text must be between 1 and 5000 characters"),

  handleValidationErrors,
];

/**
 * Validation rules for achievements segregation
 */
export const validateAchievementsSegregation = [
  body("achievements")
    .trim()
    .notEmpty()
    .withMessage("Achievements text is required")
    .isString()
    .withMessage("Achievements must be a string")
    .isLength({min: 1, max: 5000})
    .withMessage("Achievements text must be between 1 and 5000 characters"),

  handleValidationErrors,
];

/**
 * Validation rules for custom section processing
 */
export const validateCustomSectionProcessing = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({min: 1, max: 5000})
    .withMessage("Content must be between 1 and 5000 characters"),

  body("title")
    .optional()
    .trim()
    .isLength({max: 200})
    .withMessage("Title must not exceed 200 characters"),

  handleValidationErrors,
];

/**
 * Validation rules for resume parsing
 */
export const validateResumeParse = [
  body("fileUrl")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validator.isURL(value)) {
        throw new Error("File URL must be valid");
      }
      return true;
    }),

  body("text")
    .optional()
    .trim()
    .isLength({min: 50, max: 50000})
    .withMessage("Resume text must be between 50 and 50,000 characters"),

  handleValidationErrors,
];

// ============================================================================
// CONTACT & FEEDBACK VALIDATION RULES
// ============================================================================

/**
 * Validation rules for contact form submission
 */
export const validateContactSubmission = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({min: 2, max: 100})
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required")
    .isLength({min: 5, max: 200})
    .withMessage("Subject must be between 5 and 200 characters"),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({min: 10, max: 2000})
    .withMessage("Message must be between 10 and 2000 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
    )
    .withMessage("Please provide a valid phone number"),

  body("company")
    .optional()
    .trim()
    .isLength({max: 200})
    .withMessage("Company name must not exceed 200 characters"),

  body("category")
    .optional()
    .isIn([
      "general",
      "support",
      "feedback",
      "business",
      "bug-report",
      "feature-request",
    ])
    .withMessage("Invalid category"),

  handleValidationErrors,
];

/**
 * Validation rules for feedback submission
 */
export const validateFeedbackSubmission = [
  body("type")
    .trim()
    .notEmpty()
    .withMessage("Feedback type is required")
    .isIn(["improvement", "feedback", "bug"])
    .withMessage("Type must be 'improvement', 'feedback', or 'bug'"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({min: 5, max: 200})
    .withMessage("Title must be between 5 and 200 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({min: 10, max: 2000})
    .withMessage("Description must be between 10 and 2000 characters"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be 'low', 'medium', 'high', or 'critical'"),

  body("category")
    .optional()
    .trim()
    .isLength({max: 100})
    .withMessage("Category must not exceed 100 characters"),

  body("userAgent")
    .optional()
    .trim()
    .isLength({max: 500})
    .withMessage("User agent must not exceed 500 characters"),

  body("screenshot")
    .optional()
    .trim()
    .custom((value) => {
      if (value && !validator.isURL(value)) {
        throw new Error("Screenshot URL must be valid");
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Validation rules for feedback status update
 */
export const validateFeedbackStatusUpdate = [
  param("id").isMongoId().withMessage("Invalid feedback ID"),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["open", "in-progress", "resolved", "closed"])
    .withMessage(
      "Status must be 'open', 'in-progress', 'resolved', or 'closed'"
    ),

  body("adminResponse")
    .optional()
    .trim()
    .isLength({max: 2000})
    .withMessage("Admin response must not exceed 2000 characters"),

  handleValidationErrors,
];

// ============================================================================
// ATS ANALYSIS VALIDATION RULES
// ============================================================================

/**
 * Validation rules for ATS score analysis
 */
export const validateATSAnalysis = [
  body("resumeText")
    .trim()
    .notEmpty()
    .withMessage("Resume text is required")
    .isLength({min: 100, max: 50000})
    .withMessage("Resume text must be between 100 and 50,000 characters"),

  body("jobDescription")
    .trim()
    .notEmpty()
    .withMessage("Job description is required")
    .isLength({min: 50, max: 10000})
    .withMessage("Job description must be between 50 and 10,000 characters"),

  body("jobTitle")
    .optional()
    .trim()
    .isLength({max: 200})
    .withMessage("Job title must not exceed 200 characters"),

  handleValidationErrors,
];

/**
 * Validation rules for custom job description ATS analysis
 */
export const validateCustomJobATS = [
  body("resumeId")
    .notEmpty()
    .withMessage("Resume ID is required")
    .isMongoId()
    .withMessage("Invalid resume ID"),

  body("jobDescription")
    .trim()
    .notEmpty()
    .withMessage("Job description is required")
    .isLength({min: 50, max: 10000})
    .withMessage("Job description must be between 50 and 10,000 characters"),

  body("jobTitle")
    .optional()
    .trim()
    .isLength({max: 200})
    .withMessage("Job title must not exceed 200 characters"),

  handleValidationErrors,
];

// ============================================================================
// ADMIN VALIDATION RULES
// ============================================================================

/**
 * Validation rules for contact status update
 */
export const validateContactStatusUpdate = [
  param("id").isMongoId().withMessage("Invalid contact ID"),

  body("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["new", "read", "replied", "archived"])
    .withMessage("Status must be 'new', 'read', 'replied', or 'archived'"),

  body("notes")
    .optional()
    .trim()
    .isLength({max: 1000})
    .withMessage("Notes must not exceed 1000 characters"),

  handleValidationErrors,
];

/**
 * Validation rules for user role update
 */
export const validateUserRoleUpdate = [
  param("userId").isMongoId().withMessage("Invalid user ID"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["user", "admin"])
    .withMessage("Role must be either 'user' or 'admin'"),

  handleValidationErrors,
];

/**
 * Validation rules for MongoDB ID parameter
 */
export const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),

  handleValidationErrors,
];

/**
 * Validation rules for MongoDB userId parameter
 */
export const validateUserId = [
  param("userId").isMongoId().withMessage("Invalid user ID format"),

  handleValidationErrors,
];

/**
 * Validation rules for MongoDB templateId parameter
 */
export const validateTemplateId = [
  param("templateId").isMongoId().withMessage("Invalid template ID format"),

  handleValidationErrors,
];

/**
 * Validation rules for MongoDB sessionId parameter
 */
export const validateSessionId = [
  param("sessionId").isMongoId().withMessage("Invalid session ID format"),

  handleValidationErrors,
];

/**
 * Validation rules for pagination query parameters
 */
export const validatePagination = [
  query("page")
    .optional()
    .isInt({min: 1})
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({min: 1, max: 100})
    .withMessage("Limit must be between 1 and 100"),

  query("sortBy")
    .optional()
    .trim()
    .isLength({max: 50})
    .withMessage("Sort field must not exceed 50 characters"),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc", "1", "-1"])
    .withMessage("Sort order must be 'asc', 'desc', '1', or '-1'"),

  handleValidationErrors,
];

/**
 * Validation rules for search query
 */
export const validateSearch = [
  query("search")
    .optional()
    .trim()
    .isLength({max: 200})
    .withMessage("Search query must not exceed 200 characters"),

  handleValidationErrors,
];

// ============================================================================
// FILE UPLOAD VALIDATION
// ============================================================================

/**
 * Custom middleware for file upload validation
 */
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed",
    });
  }

  // 5MB file size limit
  const maxSize = 5 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: "File size exceeds 5MB limit",
    });
  }

  next();
};

/**
 * Sanitize string to prevent XSS
 */
export const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return validator.escape(str);
};

/**
 * Validate and sanitize object recursively
 */
export const sanitizeObject = (obj) => {
  if (typeof obj !== "object" || obj === null) return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

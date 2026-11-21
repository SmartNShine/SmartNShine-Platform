import express from "express";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { isTpo, validateStudentAccess, auditLog } from "../middleware/tpo.middleware.js";
import { authLimiter } from "../middleware/rateLimiter.middleware.js";

// Controllers
import {
  loginTpo,
  inviteTpo,
  getTpoProfile,
  updateTpoProfile,
} from "../controllers/tpoAuth.controller.js";

import {
  getStudents,
  getStudentProfile,
  inviteStudent,
  bulkImportStudents,
  acceptInvite,
  giveConsent,
  deactivateStudent,
  reactivateStudent,
  updateStudentDepartmentBatch,
  getStudentActivity,
} from "../controllers/tpoStudents.controller.js";

import {
  getResumeAnalytics,
  getStudentResumeAnalytics,
  getInterviewAnalytics,
  getStudentInterviewAnalytics,
  getSkillGapAnalysis,
} from "../controllers/tpoAnalytics.controller.js";

import {
  getInstitutionReadiness,
  getStudentReadiness,
  refreshAllReadiness,
} from "../controllers/tpoReadiness.controller.js";

import {
  createAssignment,
  getAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  getStudentAssignments,
  markSubmissionReviewed,
  getAssignmentStats,
} from "../controllers/tpoAssignments.controller.js";

import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  pinAnnouncement,
  getStudentAnnouncements,
  markRead,
} from "../controllers/tpoAnnouncements.controller.js";

import {
  getDepartmentReadinessReport,
  getBatchPerformanceReport,
  getSkillGapReport,
  getStudentProgressReport,
  getAssignmentCompletionReport,
  getOverviewStats,
  exportStudentsCSV,
  exportReadinessCSV,
} from "../controllers/tpoReports.controller.js";

import {
  getInstitutionSettings,
  updateInstitutionSettings,
  addDepartment,
  removeDepartment,
  addBatch,
  removeBatch,
} from "../controllers/tpoInstitution.controller.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================

// TPO login
router.post("/auth/login", authLimiter, loginTpo);

// Accept invite (student accepting TPO invite)
router.post("/students/accept-invite", acceptInvite);

// Student consent (requires student's own auth)
router.post("/students/consent", authenticateToken, giveConsent);

// Student marks announcement as read
router.post("/announcements/:id/read", authenticateToken, markRead);

// Student gets their announcements
router.get("/announcements/for-student/:studentId", authenticateToken, getStudentAnnouncements);

// ==========================================
// TPO AUTHENTICATED ROUTES
// All routes below require: authenticateToken + isTpo
// ==========================================

// Auth & Profile
router.get("/auth/profile", authenticateToken, isTpo, getTpoProfile);
router.put("/auth/profile", authenticateToken, isTpo, updateTpoProfile);
router.post("/auth/invite-tpo", authenticateToken, isTpo, auditLog("tpo.login", "tpo"), inviteTpo);

// ==========================================
// STUDENTS
// ==========================================
router.get(
  "/students",
  authenticateToken,
  isTpo,
  auditLog("student.view", "student"),
  getStudents
);

router.post(
  "/students/invite",
  authenticateToken,
  isTpo,
  auditLog("student.invite", "student"),
  inviteStudent
);

router.post(
  "/students/bulk-import",
  authenticateToken,
  isTpo,
  auditLog("student.import", "student"),
  bulkImportStudents
);

router.get(
  "/students/:studentId",
  authenticateToken,
  isTpo,
  auditLog("student.view", "student"),
  getStudentProfile
);

router.put(
  "/students/:studentId",
  authenticateToken,
  isTpo,
  updateStudentDepartmentBatch
);

router.put(
  "/students/:studentId/deactivate",
  authenticateToken,
  isTpo,
  auditLog("student.deactivate", "student"),
  deactivateStudent
);

router.put(
  "/students/:studentId/reactivate",
  authenticateToken,
  isTpo,
  reactivateStudent
);

router.get(
  "/students/:studentId/activity",
  authenticateToken,
  isTpo,
  auditLog("student.view", "student"),
  getStudentActivity
);

// ==========================================
// ANALYTICS — RESUME
// ==========================================
router.get(
  "/analytics/resume",
  authenticateToken,
  isTpo,
  auditLog("resume.analytics", "resume"),
  getResumeAnalytics
);

router.get(
  "/analytics/resume/:studentId",
  authenticateToken,
  isTpo,
  auditLog("resume.view", "resume"),
  getStudentResumeAnalytics
);

// ==========================================
// ANALYTICS — INTERVIEW
// ==========================================
router.get(
  "/analytics/interview",
  authenticateToken,
  isTpo,
  auditLog("interview.analytics", "interview"),
  getInterviewAnalytics
);

router.get(
  "/analytics/interview/:studentId",
  authenticateToken,
  isTpo,
  auditLog("interview.view", "interview"),
  getStudentInterviewAnalytics
);

router.get(
  "/analytics/skill-gaps",
  authenticateToken,
  isTpo,
  auditLog("interview.analytics", "interview"),
  getSkillGapAnalysis
);

// ==========================================
// READINESS ENGINE
// ==========================================
router.get(
  "/readiness",
  authenticateToken,
  isTpo,
  auditLog("readiness.view", "student"),
  getInstitutionReadiness
);

router.get(
  "/readiness/:studentId",
  authenticateToken,
  isTpo,
  auditLog("readiness.view", "student"),
  getStudentReadiness
);

router.post(
  "/readiness/refresh",
  authenticateToken,
  isTpo,
  refreshAllReadiness
);

// ==========================================
// ASSIGNMENTS
// ==========================================
router.post(
  "/assignments",
  authenticateToken,
  isTpo,
  auditLog("assignment.create", "assignment"),
  createAssignment
);

router.get(
  "/assignments",
  authenticateToken,
  isTpo,
  getAssignments
);

router.get(
  "/assignments/:assignmentId",
  authenticateToken,
  isTpo,
  getAssignment
);

router.put(
  "/assignments/:assignmentId",
  authenticateToken,
  isTpo,
  auditLog("assignment.update", "assignment"),
  updateAssignment
);

router.delete(
  "/assignments/:assignmentId",
  authenticateToken,
  isTpo,
  auditLog("assignment.delete", "assignment"),
  deleteAssignment
);

router.get(
  "/assignments/:assignmentId/submissions",
  authenticateToken,
  isTpo,
  getAssignmentSubmissions
);

router.get(
  "/assignments/:assignmentId/stats",
  authenticateToken,
  isTpo,
  getAssignmentStats
);

router.put(
  "/assignments/:assignmentId/submissions/:userId",
  authenticateToken,
  isTpo,
  markSubmissionReviewed
);

router.get(
  "/students/:studentId/assignments",
  authenticateToken,
  isTpo,
  getStudentAssignments
);

// ==========================================
// ANNOUNCEMENTS
// ==========================================
router.post(
  "/announcements",
  authenticateToken,
  isTpo,
  auditLog("announcement.create", "announcement"),
  createAnnouncement
);

router.get(
  "/announcements",
  authenticateToken,
  isTpo,
  getAnnouncements
);

router.get(
  "/announcements/:id",
  authenticateToken,
  isTpo,
  getAnnouncement
);

router.put(
  "/announcements/:id",
  authenticateToken,
  isTpo,
  updateAnnouncement
);

router.delete(
  "/announcements/:id",
  authenticateToken,
  isTpo,
  auditLog("announcement.delete", "announcement"),
  deleteAnnouncement
);

router.put(
  "/announcements/:id/pin",
  authenticateToken,
  isTpo,
  pinAnnouncement
);

// ==========================================
// REPORTS
// ==========================================
router.get(
  "/reports/overview",
  authenticateToken,
  isTpo,
  auditLog("readiness.view", "institution"),
  getOverviewStats
);

router.get(
  "/reports/department-readiness",
  authenticateToken,
  isTpo,
  auditLog("report.export", "institution"),
  getDepartmentReadinessReport
);

router.get(
  "/reports/batch-performance",
  authenticateToken,
  isTpo,
  auditLog("report.export", "institution"),
  getBatchPerformanceReport
);

router.get(
  "/reports/skill-gaps",
  authenticateToken,
  isTpo,
  auditLog("report.export", "institution"),
  getSkillGapReport
);

router.get(
  "/reports/assignment-completion",
  authenticateToken,
  isTpo,
  auditLog("report.export", "institution"),
  getAssignmentCompletionReport
);

router.get(
  "/reports/students/:studentId",
  authenticateToken,
  isTpo,
  auditLog("report.export", "student"),
  getStudentProgressReport
);

router.get(
  "/reports/export/students",
  authenticateToken,
  isTpo,
  auditLog("report.export", "institution"),
  exportStudentsCSV
);

router.get(
  "/reports/export/readiness",
  authenticateToken,
  isTpo,
  auditLog("report.export", "institution"),
  exportReadinessCSV
);

// ==========================================
// INSTITUTION SETTINGS
// ==========================================
router.get(
  "/settings",
  authenticateToken,
  isTpo,
  getInstitutionSettings
);

router.put(
  "/settings",
  authenticateToken,
  isTpo,
  auditLog("institution.settings.update", "institution"),
  updateInstitutionSettings
);

router.post(
  "/settings/departments",
  authenticateToken,
  isTpo,
  auditLog("department.create", "institution"),
  addDepartment
);

router.delete(
  "/settings/departments/:deptId",
  authenticateToken,
  isTpo,
  auditLog("department.delete", "institution"),
  removeDepartment
);

router.post(
  "/settings/batches",
  authenticateToken,
  isTpo,
  auditLog("batch.create", "institution"),
  addBatch
);

router.delete(
  "/settings/batches/:batchId",
  authenticateToken,
  isTpo,
  auditLog("batch.delete", "institution"),
  removeBatch
);

export default router;


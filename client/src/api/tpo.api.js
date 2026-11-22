/**
 * TPO Dashboard API Client
 * All TPO-specific API calls for SmartNShine Institutional Portal
 */

import axios from "axios";
import { authStorage } from "@/utils/storage";
import { config } from "@/utils/constants";

const api = axios.create({
  baseURL: config.apiUrl,
  headers: { "Content-Type": "application/json" },
});

// Inject auth token
api.interceptors.request.use((cfg) => {
  const token = authStorage.getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ==========================================
// AUTH
// ==========================================
export const tpoAuthAPI = {
  login: (data) => api.post("/tpo/auth/login", data),
  getProfile: () => api.get("/tpo/auth/profile"),
  updateProfile: (data) => api.put("/tpo/auth/profile", data),
  inviteTpo: (data) => api.post("/tpo/auth/invite-tpo", data),
};

// ==========================================
// STUDENTS
// ==========================================
export const tpoStudentsAPI = {
  list: (params) => api.get("/tpo/students", { params }),
  getProfile: (studentId) => api.get(`/tpo/students/${studentId}`),
  invite: (data) => api.post("/tpo/students/invite", data),
  bulkImport: (students, options = {}) =>
    api.post("/tpo/students/bulk-import", { students, ...options }),
  acceptInvite: (data) => api.post("/tpo/students/accept-invite", data),
  giveConsent: (data) => api.post("/tpo/students/consent", data),
  deactivate: (studentId, reason) =>
    api.put(`/tpo/students/${studentId}/deactivate`, { reason }),
  reactivate: (studentId) =>
    api.put(`/tpo/students/${studentId}/reactivate`),
  update: (studentId, data) => api.put(`/tpo/students/${studentId}`, data),
  getActivity: (studentId) => api.get(`/tpo/students/${studentId}/activity`),
  getAssignments: (studentId) =>
    api.get(`/tpo/students/${studentId}/assignments`),
};

// ==========================================
// ANALYTICS
// ==========================================
export const tpoAnalyticsAPI = {
  getResumeAnalytics: (params) =>
    api.get("/tpo/analytics/resume", { params }),
  getStudentResumeAnalytics: (studentId) =>
    api.get(`/tpo/analytics/resume/${studentId}`),
  getInterviewAnalytics: (params) =>
    api.get("/tpo/analytics/interview", { params }),
  getStudentInterviewAnalytics: (studentId) =>
    api.get(`/tpo/analytics/interview/${studentId}`),
  getSkillGaps: (params) =>
    api.get("/tpo/analytics/skill-gaps", { params }),
};

// ==========================================
// READINESS
// ==========================================
export const tpoReadinessAPI = {
  getInstitution: (params) => api.get("/tpo/readiness", { params }),
  getStudent: (studentId) => api.get(`/tpo/readiness/${studentId}`),
  refreshAll: () => api.post("/tpo/readiness/refresh"),
};

// ==========================================
// ASSIGNMENTS
// ==========================================
export const tpoAssignmentsAPI = {
  create: (data) => api.post("/tpo/assignments", data),
  list: (params) => api.get("/tpo/assignments", { params }),
  get: (id) => api.get(`/tpo/assignments/${id}`),
  update: (id, data) => api.put(`/tpo/assignments/${id}`, data),
  delete: (id) => api.delete(`/tpo/assignments/${id}`),
  getSubmissions: (id) => api.get(`/tpo/assignments/${id}/submissions`),
  getStats: (id) => api.get(`/tpo/assignments/${id}/stats`),
  markReviewed: (assignmentId, userId, data) =>
    api.put(`/tpo/assignments/${assignmentId}/submissions/${userId}`, data),
};

// ==========================================
// ANNOUNCEMENTS
// ==========================================
export const tpoAnnouncementsAPI = {
  create: (data) => api.post("/tpo/announcements", data),
  list: (params) => api.get("/tpo/announcements", { params }),
  get: (id) => api.get(`/tpo/announcements/${id}`),
  update: (id, data) => api.put(`/tpo/announcements/${id}`, data),
  delete: (id) => api.delete(`/tpo/announcements/${id}`),
  pin: (id) => api.put(`/tpo/announcements/${id}/pin`),
  markRead: (id) => api.post(`/tpo/announcements/${id}/read`),
};

// ==========================================
// REPORTS
// ==========================================
export const tpoReportsAPI = {
  getOverview: () => api.get("/tpo/reports/overview"),
  getDepartmentReadiness: (params) =>
    api.get("/tpo/reports/department-readiness", { params }),
  getBatchPerformance: (params) =>
    api.get("/tpo/reports/batch-performance", { params }),
  getSkillGaps: (params) => api.get("/tpo/reports/skill-gaps", { params }),
  getAssignmentCompletion: (params) =>
    api.get("/tpo/reports/assignment-completion", { params }),
  getStudentProgress: (studentId) =>
    api.get(`/tpo/reports/students/${studentId}`),
  exportStudentsCSV: () =>
    api.get("/tpo/reports/export/students", { responseType: "blob" }),
  exportReadinessCSV: () =>
    api.get("/tpo/reports/export/readiness", { responseType: "blob" }),
};

// ==========================================
// SETTINGS
// ==========================================
export const tpoSettingsAPI = {
  get: () => api.get("/tpo/settings"),
  update: (data) => api.put("/tpo/settings", data),
  addDepartment: (data) => api.post("/tpo/settings/departments", data),
  removeDepartment: (deptId) => api.delete(`/tpo/settings/departments/${deptId}`),
  addBatch: (data) => api.post("/tpo/settings/batches", data),
  removeBatch: (batchId) => api.delete(`/tpo/settings/batches/${batchId}`),
};


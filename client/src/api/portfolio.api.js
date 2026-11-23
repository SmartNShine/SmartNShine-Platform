import api from "./api";

export const portfolioAPI = {
  list: () => api.get("/portfolio"),
  createBlank: (data = {}) => api.post("/portfolio", data),
  createFromResume: (resumeId, data = {}) =>
    api.post(`/portfolio/from-resume/${resumeId}`, data),
  getById: (id) => api.get(`/portfolio/${id}`),
  update: (id, data) => api.put(`/portfolio/${id}`, data),
  delete: (id) => api.delete(`/portfolio/${id}`),
  publish: (id) => api.post(`/portfolio/${id}/publish`),
  unpublish: (id) => api.post(`/portfolio/${id}/unpublish`),
  syncFromResume: (id) => api.post(`/portfolio/${id}/sync-resume`),

  createProject: (portfolioId, data) =>
    api.post(`/portfolio/${portfolioId}/projects`, data),
  updateProject: (portfolioId, projectId, data) =>
    api.put(`/portfolio/${portfolioId}/projects/${projectId}`, data),
  deleteProject: (portfolioId, projectId) =>
    api.delete(`/portfolio/${portfolioId}/projects/${projectId}`),

  getPublic: (slug) => api.get(`/portfolio/public/${slug}`),
  downloadResume: (slug) =>
    api.get(`/portfolio/public/${slug}/resume`, {responseType: "blob"}),
  getResumeDownloadUrl: (slug) =>
    api.getUri({url: `/portfolio/public/${slug}/resume`}),
  trackView: (slug) => api.post(`/portfolio/public/${slug}/view`),
  trackResumeDownload: (slug) =>
    api.post(`/portfolio/public/${slug}/resume-download`),
  trackContactClick: (slug) =>
    api.post(`/portfolio/public/${slug}/contact-click`),
  trackProjectClick: (slug) =>
    api.post(`/portfolio/public/${slug}/project-click`),

  generateAbout: (portfolioId, data = {}) =>
    api.post(`/portfolio/${portfolioId}/ai/about`, data),
  improveProjectDescription: (portfolioId, data) =>
    api.post(`/portfolio/${portfolioId}/ai/project-description`, data),
  generateSeo: (portfolioId) => api.post(`/portfolio/${portfolioId}/ai/seo`),
  uploadImage: (file, oldImageUrl = null) => {
    const formData = new FormData();
    formData.append("image", file);
    if (oldImageUrl) {
      formData.append("oldImageUrl", oldImageUrl);
    }
    return api.post("/portfolio/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteImage: (imageUrl) => api.post("/portfolio/delete-image", { imageUrl }),
};

export default portfolioAPI;

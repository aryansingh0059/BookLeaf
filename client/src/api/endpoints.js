import api from "./axiosInstance.js";

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
};

export const booksApi = {
  list: () => api.get("/books"),
  get: (id) => api.get(`/books/${id}`),
};

export const ticketsApi = {
  list: () => api.get("/tickets"),
  get: (id) => api.get(`/tickets/${id}`),
  create: (body) => api.post("/tickets", body),
  reply: (id, body) => api.post(`/tickets/${id}/replies`, { body }),
};

export const adminApi = {
  listTickets: (params) => api.get("/admin/tickets", { params }),
  getTicket: (id) => api.get(`/admin/tickets/${id}`),
  patchTicket: (id, body) => api.patch(`/admin/tickets/${id}`, body),
  assignMe: (id) => api.post(`/admin/tickets/${id}/assign-me`),
  addNote: (id, body) => api.post(`/admin/tickets/${id}/notes`, { body }),
  draftReply: (id) => api.post(`/admin/tickets/${id}/draft`),
  sendReply: (id, body, status) =>
    api.post(`/admin/tickets/${id}/reply`, { body, status }),
  reclassify: (id) => api.post(`/admin/tickets/${id}/reclassify`),
  stats: () => api.get("/admin/stats"),
};

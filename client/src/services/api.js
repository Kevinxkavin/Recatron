import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const runScan        = (url, modules) => api.post("/scan/run", { url, modules }).then(r => r.data);
export const getScanById    = (id)            => api.get(`/scan/${id}`).then(r => r.data);

export const getDorkCategories  = ()                           => api.get("/dorks/categories").then(r => r.data);
export const getDorksByCategory = (category, domain, page = 1, limit = 50) =>
  api.get(`/dorks/${encodeURIComponent(category)}`, { params: { domain, page, limit } }).then(r => r.data);
export const searchDorks        = (q, domain, category)        =>
  api.get("/dorks/search", { params: { q, domain, category } }).then(r => r.data);

export const getScanHistory = ()    => api.get("/history").then(r => r.data);
export const deleteScan     = (id)  => api.delete(`/history/${id}`).then(r => r.data);

export default api;

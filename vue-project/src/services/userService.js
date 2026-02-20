import { api } from "@/services/api";

export function getUsers() {
  return api.get("/users");
}

export function getUser(id) {
  return api.get(`/users/${encodeURIComponent(id)}`);
}

export function createUser(data) {
  return api.post("/users", data);
}

export function deleteUser(id) {
  return api.del(`/users/${encodeURIComponent(id)}`);
}

// Admin user endpoints
export function getAdminUsers(params = {}) {
  return api.get("/admin/users", { params });
}

export function getAdminUser(id) {
  return api.get(`/admin/users/${encodeURIComponent(id)}`);
}

export function createAdminUser(data) {
  return api.post("/admin/users", data);
}

export function updateAdminUser(id, data) {
  return api.put(`/admin/users/${encodeURIComponent(id)}`, data);
}
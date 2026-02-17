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
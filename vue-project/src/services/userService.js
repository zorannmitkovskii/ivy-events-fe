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
  return api.del(`/admin/users/${encodeURIComponent(id)}`);
}

// Admin user endpoints
export function getAdminUsers(params = {}) {
  return api.get("/admin/users", { params });
}

/** Keycloak rows per request; the server caps it at the same number. */
const USERS_PAGE = 100;
/** A ceiling on requests, so a runaway answer cannot loop forever. */
const MAX_USER_PAGES = 50;

/**
 * Every user the caller may see, page by page.
 *
 * <p>The plain list endpoint answered twenty and the directory showed those
 * twenty. Its length cannot say whether more exist — filtering by package
 * happens after paging — so this reads `hasMore` from the paged endpoint.
 */
export async function getAllAdminUsers(params = {}) {
  const users = [];
  let first = 0;
  for (let request = 0; request < MAX_USER_PAGES; request++) {
    const page = await api.get("/admin/users/page", { params: { ...params, first, max: USERS_PAGE } });
    users.push(...(page?.items ?? []));
    if (!page?.hasMore) break;
    first = page.nextFirst;
  }
  return users;
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

/** Every agency, for placing a user in one: `{ id, name, ownerEmail }`. Platform admin only. */
export async function getAllAgencies() {
  const res = await api.get("/admin/agencies");
  return res?.data ?? res ?? [];
}
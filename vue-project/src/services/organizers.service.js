import { api } from "@/services/api";

/**
 * The platform administrator's organizer directory (IVY-1102).
 *
 * <p>Sorting and searching are the server's job here, unlike the users table
 * next door. The directory is ordered by workload, and workload lives in the
 * database — sorting a page of twenty in the browser would order the page
 * rather than the company, and the busiest organizer would stay hidden on
 * page three.
 */
export const organizersService = {
  list({ search, sort, direction, first, max, orgId } = {}) {
    const params = {};
    if (search) params.search = search;
    if (sort) params.sort = sort;
    if (direction) params.direction = direction;
    if (first != null) params.first = first;
    if (max != null) params.max = max;
    if (orgId) params.orgId = orgId;
    return api.get("/admin/organizers", { params });
  },

  /** One organizer's events and the work on them — their own workspace aggregate. */
  workload(userId) {
    return api.get(`/admin/organizers/${encodeURIComponent(userId)}/workload`);
  },

  setStatus(userId, enabled) {
    return api.put(`/admin/organizers/${encodeURIComponent(userId)}/status`, { enabled });
  },

  setRole(userId, role) {
    return api.put(`/admin/organizers/${encodeURIComponent(userId)}/role`, { role });
  },
};

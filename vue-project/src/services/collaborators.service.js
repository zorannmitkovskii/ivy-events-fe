import { api } from "@/services/api";

// Collaborator invitations (IVY-103) and pinned events (IVY-104).
//
// Both hang off an event, so both go through `api` — the authenticated client.
// Claiming is the exception: the person redeeming a code has no access to the
// event yet, which is the whole point, so the server protects that call with
// the code rather than with event access.
export const collaboratorsService = {
  /**
   * @param role OWNER | ADMIN | MEMBER — stored and passed to the organization
   *   service. It does not change what the collaborator may do in Ivy yet;
   *   per-event scopes are IVY-106.
   */
  async invite(eventId, { role = "MEMBER", ttlDays } = {}) {
    const res = await api.post(`/events/${encodeURIComponent(eventId)}/invites`, { role, ttlDays });
    return res?.data ?? res;
  },

  async list(eventId) {
    const res = await api.get(`/events/${encodeURIComponent(eventId)}/invites`);
    return res?.data ?? res;
  },

  async claim(code) {
    const res = await api.post("/invites/claim", { code });
    return res?.data ?? res;
  },

  async revoke(eventId, userId) {
    const res = await api.del(
      `/events/${encodeURIComponent(eventId)}/collaborators/${encodeURIComponent(userId)}`
    );
    return res?.data ?? res;
  },
};

export const workspaceService = {
  /** Filters are all optional; omitting them yields the caller's non-archived
   *  events, pinned first. */
  async list({ status, categoryType, from, to } = {}) {
    const params = {};
    if (status) params.status = status;
    if (categoryType) params.categoryType = categoryType;
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await api.get("/events/workspace", { params });
    return res?.data ?? res;
  },

  pin(eventId) {
    return api.put(`/events/${encodeURIComponent(eventId)}/pin`);
  },

  unpin(eventId) {
    return api.del(`/events/${encodeURIComponent(eventId)}/pin`);
  },
};

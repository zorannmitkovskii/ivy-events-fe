import { api } from "@/services/api";

/**
 * The vendor studio's own screens (2026 vendor design): the home, the inbox
 * pipeline, the calendar feed, the profile, the microsite settings, the team
 * roles and the insights.
 *
 * <p>Everything here answers for the caller's own vendor, read from the token
 * on the server — there is no vendor id to pass, and so none to get wrong.
 */
export const vendorWorkspaceService = {
  home() {
    return api.get("/vendor-portal/home");
  },

  /** @param filters workflow, source, q — empty values are left out */
  inbox(filters = {}) {
    return api.get("/vendor-portal/inbox", { params: compact(filters) });
  },

  metrics() {
    return api.get("/vendor-portal/inbox/metrics");
  },

  setWorkflow(inquiryId, status) {
    return api.put(`/vendor-portal/inbox/${encodeURIComponent(inquiryId)}/workflow`, { status });
  },

  /** A vendor reply in the thread. Multipart, because the thread takes attachments. */
  reply(inquiryId, body) {
    const form = new FormData();
    form.append("body", body);
    return api.post(`/inquiries/${encodeURIComponent(inquiryId)}/messages`, form);
  },

  thread(inquiryId) {
    return api.get(`/inquiries/${encodeURIComponent(inquiryId)}/messages`);
  },

  /** @param from, to ISO dates, inclusive */
  calendar(from, to) {
    return api.get("/vendor-portal/calendar", { params: { from, to } });
  },

  reorderMedia(ids) {
    return api.put("/vendor-portal/media/order", { ids });
  },

  setCover(mediaId) {
    return api.put(`/vendor-portal/media/${encodeURIComponent(mediaId)}/cover`);
  },

  profile() {
    return api.get("/vendor-portal/profile");
  },

  saveProfile(payload) {
    return api.put("/vendor-portal/profile", payload);
  },

  microsite() {
    return api.get("/vendor-portal/microsite");
  },

  saveMicrositeSettings(payload) {
    return api.put("/vendor-portal/microsite/settings", payload);
  },

  /** The microsite's own wording, saved whole. */
  saveMicrositeContent(content) {
    return api.put("/vendor-portal/microsite/content", content);
  },

  setTheme(theme) {
    return api.put("/vendor-portal/microsite/theme", { theme });
  },

  publish(live) {
    return api.post("/vendor-portal/microsite/publish", null, { params: { live } });
  },

  setSlug(slug) {
    return api.put("/vendor-portal/application/slug", { slug });
  },

  team() {
    return api.get("/vendor-portal/users");
  },

  invite(payload) {
    return api.post("/vendor-portal/users", payload);
  },

  removeMember(userId) {
    return api.del(`/vendor-portal/users/${encodeURIComponent(userId)}`);
  },

  insights(windowDays = 90) {
    return api.get("/vendor-portal/insights", { params: { windowDays } });
  },

  /** Anonymous, from the public microsite. */
  sendPublicInquiry(slug, payload) {
    return api.post(`/public/vendors/${encodeURIComponent(slug)}/inquiries`, payload);
  },
};

/** The server's data, whichever way the client wrapped it. */
export function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

function compact(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );
}

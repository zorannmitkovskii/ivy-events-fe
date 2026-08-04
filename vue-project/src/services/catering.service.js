import { api } from "@/services/api";

/**
 * The menu, the counts and the kitchen handoff (IVY-402..405).
 *
 * <p>A restaurant collaborator holds `menu:read`, so it can call the reads and
 * acknowledge a guarantee, and is refused everything that edits the menu.
 */
export const cateringService = {
  options(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/menu-options`);
  },

  addOption(eventId, option) {
    return api.post(`/events/${encodeURIComponent(eventId)}/menu-options`, option);
  },

  closeSelection(eventId, closesAt) {
    return api.put(`/events/${encodeURIComponent(eventId)}/menu-selection-deadline`, { closesAt });
  },

  /** What the kitchen has to cook. The restaurant's main read. */
  counts(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/catering-counts`);
  },

  report(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/catering-report`);
  },

  /** @param format "pdf" or "xlsx" */
  download(eventId, format = "pdf") {
    return api.get(`/events/${encodeURIComponent(eventId)}/catering-report.${format}`,
      { responseType: "blob" });
  },

  /** A guest picking their dish from the invitation — no account involved. */
  choose(eventId, guestId, menuOptionId) {
    return api.post(
      `/public/events/${encodeURIComponent(eventId)}/guests/${encodeURIComponent(guestId)}/menu`,
      { menuOptionId });
  },

  // ── the final guarantee ──────────────────────────────────────────────

  guarantee(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/final-guarantee`);
  },

  /** @param revisionReason required from the second version onwards */
  submitGuarantee(eventId, revisionReason) {
    return api.post(`/events/${encodeURIComponent(eventId)}/final-guarantee`,
      { revisionReason: revisionReason || null });
  },

  guaranteeHistory(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/final-guarantee/history`);
  },

  /** Null when the live counts still match what was guaranteed. */
  guaranteeDrift(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/final-guarantee/drift`);
  },

  acknowledgeGuarantee(eventId, guaranteeId) {
    return api.post(
      `/events/${encodeURIComponent(eventId)}/final-guarantee/${encodeURIComponent(guaranteeId)}/acknowledge`);
  },

  /** The venue's own upcoming list — scoped to the events it was invited to. */
  venueUpcoming({ from, to, status } = {}) {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (status) params.status = status;
    return api.get("/venue/upcoming", { params });
  }
};

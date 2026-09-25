import { api } from "@/services/api";

/**
 * The restaurant's own screens.
 *
 * <p>No call takes a vendor id: the backend resolves the vendor from the
 * token, so a restaurant can only ever act as itself.
 */
export const vendorPortalService = {
  me() {
    return api.get("/vendor-portal/me");
  },

  // ── Packages ──────────────────────────────────────────────────────
  listPackages() {
    return api.get("/vendor-portal/packages");
  },

  createPackage(payload) {
    return api.post("/vendor-portal/packages", payload);
  },

  updatePackage(packageId, payload) {
    return api.put(`/vendor-portal/packages/${encodeURIComponent(packageId)}`, payload);
  },

  deletePackage(packageId) {
    return api.del(`/vendor-portal/packages/${encodeURIComponent(packageId)}`);
  },

  // ── Calendar ──────────────────────────────────────────────────────
  listBookings(from, to) {
    return api.get("/vendor-portal/bookings", { params: { from, to } });
  },

  createBooking(payload) {
    return api.post("/vendor-portal/bookings", payload);
  },

  updateBooking(bookingId, payload) {
    return api.put(`/vendor-portal/bookings/${encodeURIComponent(bookingId)}`, payload);
  },

  deleteBooking(bookingId) {
    return api.del(`/vendor-portal/bookings/${encodeURIComponent(bookingId)}`);
  },

  /** How many are coming and what the kitchen is cooking. */
  guestSummary(bookingId) {
    return api.get(`/vendor-portal/bookings/${encodeURIComponent(bookingId)}/guests`);
  },

  // ── Portfolio ─────────────────────────────────────────────────────
  listMedia() {
    return api.get("/vendor-portal/media");
  },

  uploadMedia(file, title) {
    const form = new FormData();
    form.append("file", file);
    if (title) form.append("title", title);
    // Content-Type is left to the browser: it has to add the multipart
    // boundary, and setting the header by hand drops it.
    return api.post("/vendor-portal/media", form);
  },

  addMediaLink(payload) {
    return api.post("/vendor-portal/media/links", payload);
  },

  deleteMedia(mediaId) {
    return api.del(`/vendor-portal/media/${encodeURIComponent(mediaId)}`);
  }
};

/** The couple's side: choosing which package their event runs on. */
export const eventCateringService = {
  /** The venue, the date, the current choice and the offer, in one call. */
  overview(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/catering`);
  },

  availablePackages(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/catering/packages`);
  },

  choosePackage(eventId, packageId) {
    return api.put(`/events/${encodeURIComponent(eventId)}/catering/package`, { packageId });
  }
};

/**
 * The rest of the vendor's calendar (IVY-801).
 *
 * <p>Separate from bookings on purpose: a week away is not a job, and mixing
 * the two means every count of work has to remember to subtract the holidays.
 */
export const vendorAvailabilityService = {
  calendar(from, to) {
    return api.get("/vendor-portal/availability", { params: { from, to } });
  },

  /** Answers with the reasons, buffers included — "free at 08:00" and "free at
   *  08:00 but you need two hours to load in" are different sentences. */
  check(from, to) {
    return api.get("/vendor-portal/availability/check", { params: { from, to } });
  },

  /** Pass `date` for a whole day and the server builds it in the vendor's own
   *  zone. The day the clocks change is 23 or 25 hours long, so a client that
   *  computes start + 24h is wrong twice a year. */
  block({ date, from, to, status = "UNAVAILABLE", reason, timezone }) {
    return api.post("/vendor-portal/availability",
      { date, from, to, status, reason, timezone });
  },

  confirmHold(blockId) {
    return api.post(`/vendor-portal/availability/${encodeURIComponent(blockId)}/confirm`);
  },

  release(blockId) {
    return api.del(`/vendor-portal/availability/${encodeURIComponent(blockId)}`);
  },
};

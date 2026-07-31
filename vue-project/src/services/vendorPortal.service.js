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
    return api.delete(`/vendor-portal/packages/${encodeURIComponent(packageId)}`);
  },

  // ── Floor plans ───────────────────────────────────────────────────
  listFloorPlans() {
    return api.get("/vendor-portal/floor-plans");
  },

  createFloorPlan(payload) {
    return api.post("/vendor-portal/floor-plans", payload);
  },

  updateFloorPlan(planId, payload) {
    return api.put(`/vendor-portal/floor-plans/${encodeURIComponent(planId)}`, payload);
  },

  deleteFloorPlan(planId) {
    return api.delete(`/vendor-portal/floor-plans/${encodeURIComponent(planId)}`);
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
    return api.delete(`/vendor-portal/bookings/${encodeURIComponent(bookingId)}`);
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
    return api.delete(`/vendor-portal/media/${encodeURIComponent(mediaId)}`);
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

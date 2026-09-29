import { api } from "@/services/api";

/**
 * The public vendor marketplace (IVY-703, IVY-704, IVY-705).
 *
 * <p>All open. A couple comparing photographers has no account yet, and making
 * them create one to look is how a marketplace stays empty.
 */
export const vendorDirectoryService = {
  search({ type, city, q, tag, page = 0, size = 24 } = {}) {
    const params = { page, size };
    if (type) params.type = type;
    if (city) params.city = city;
    if (q) params.q = q;
    if (tag) params.tag = tag;
    return api.get("/public/vendors", { params });
  },

  cities() {
    return api.get("/public/vendors/cities");
  },

  /** 301 for an address a vendor used to live at; 404 for suspended. `locale`
   *  names the vendor's tags and picks the articles filed under them. */
  bySlug(slug, locale) {
    const params = locale ? { locale } : {};
    return api.get(`/public/vendors/${encodeURIComponent(slug)}`, { params });
  },

  /** Title, description, canonical and JSON-LD — the same thing the build-time
   *  prerender reads, so a title tag and an og:title cannot disagree. */
  seo(slug, lang) {
    const params = lang ? { lang } : {};
    return api.get(`/public/vendors/${encodeURIComponent(slug)}/seo`, { params });
  },

  reviews(vendorId) {
    return api.get(`/public/vendors/${encodeURIComponent(vendorId)}/reviews`);
  },

  rating(vendorId) {
    return api.get(`/public/vendors/${encodeURIComponent(vendorId)}/rating`);
  },
};

/** A vendor's own application and profile. */
export const vendorApplicationService = {
  schemaFor(type) {
    return api.get("/vendor-portal/application/schema", { params: { type } });
  },

  mine() {
    return api.get("/vendor-portal/application");
  },

  apply({ type, name }) {
    return api.post("/vendor-portal/application", { type, name });
  },

  updateFields(fields) {
    return api.put("/vendor-portal/application/fields", fields);
  },

  submit() {
    return api.post("/vendor-portal/application/submit");
  },

  changeSlug(slug) {
    return api.put("/vendor-portal/application/slug", { slug });
  },

  // ── moderation (admin) ──────────────────────────────────────────────

  queue() {
    return api.get("/vendor-portal/application/queue");
  },

  decide(vendorId, decision, note) {
    return api.post(`/vendor-portal/application/${encodeURIComponent(vendorId)}/decision`,
      { decision, note });
  },

  /** Every vendor, for choosing which one gets an owner. ADMIN reads them all. */
  allVendors() {
    return api.get("/vendors");
  },

  /**
   * Creates the account that runs one vendor (role VENDOR on it). The server
   * emails it a temporary password, and refuses with 409 when the vendor
   * already has an account — after that, its owner adds the staff.
   */
  createOwner(vendorId, { email, firstName, lastName }) {
    return api.post(`/admin/vendors/${encodeURIComponent(vendorId)}/owner`, { email, firstName, lastName });
  },
};

/** Reviews from the couple's and the vendor's side. */
export const vendorReviewService = {
  reviewable(eventId) {
    return api.get(`/events/${encodeURIComponent(eventId)}/reviewable-vendors`);
  },

  submit(eventId, { bookingId, authorName, rating, comment }) {
    return api.post(`/events/${encodeURIComponent(eventId)}/reviews`,
      { bookingId, authorName, rating, comment });
  },

  edit(reviewId, { rating, comment }) {
    return api.put(`/reviews/${encodeURIComponent(reviewId)}`, { rating, comment });
  },

  respond(reviewId, response) {
    return api.post(`/reviews/${encodeURIComponent(reviewId)}/response`, { response });
  },

  report(reviewId) {
    return api.post(`/reviews/${encodeURIComponent(reviewId)}/report`);
  },
};

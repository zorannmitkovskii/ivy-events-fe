import { api } from "@/services/api";

/**
 * Blog, inspiration pages and the editor behind them (EPIC-09).
 *
 * <p>The `/public/*` calls are the ones a search engine and an anonymous
 * visitor reach; everything under `/content/*` needs an editor's token. They
 * are kept in one file because they are one feature, and split by prefix
 * because that is the line that actually matters.
 */
export const contentService = {
  // ── public ─────────────────────────────────────────────────────────────

  published({ category, locale } = {}) {
    return api.get("/public/blog", { params: { category, locale } });
  },

  /** A locale that was never published is a 404, not a fallback to another
   *  language: a half-translated page in search results is worse than none. */
  read(slug, locale) {
    return api.get(`/public/blog/${encodeURIComponent(slug)}`, { params: { locale } });
  },

  landingPage(category, { city, locale } = {}) {
    return api.get(`/public/landing/${encodeURIComponent(category)}`,
      { params: { city, locale } });
  },

  /**
   * One step of a journey.
   *
   * @param consented when false the server keeps counts only, with no identifier
   *   that survives the session. Sent as given — deciding on the client that
   *   "they probably meant yes" is how consent banners become decorative.
   */
  recordEvent({ sessionId, consented, kind, postId, category, locale }) {
    return api.post("/public/content-events",
      { sessionId, consented, kind, postId, category, locale });
  },

  // ── editorial ──────────────────────────────────────────────────────────

  posts() {
    return api.get("/content/posts");
  },

  createPost({ title, category, authorName }) {
    return api.post("/content/posts", { title, category, authorName });
  },

  /** Each locale has its own title, body and SEO fields — a translation is not
   *  the same article with the words swapped. */
  writeVariant(postId, locale, variant) {
    return api.put(
      `/content/posts/${encodeURIComponent(postId)}/variants/${encodeURIComponent(locale)}`,
      variant);
  },

  moveStatus(variantId, status, publishAt) {
    return api.post(`/content/variants/${encodeURIComponent(variantId)}/status`,
      { status, publishAt });
  },

  /** Every locale with its computed SEO, including the warnings. */
  preview(postId) {
    return api.get(`/content/posts/${encodeURIComponent(postId)}/preview`);
  },

  addLink(postId, { targetType, targetId, sortOrder = 0 }) {
    return api.post(`/content/posts/${encodeURIComponent(postId)}/links`,
      { targetType, targetId, sortOrder });
  },

  /** Says which targets are still publishable. A link to a suspended vendor is
   *  found here rather than by a reader. */
  auditLinks(postId) {
    return api.get(`/content/posts/${encodeURIComponent(postId)}/links`);
  },

  removeLink(linkId) {
    return api.del(`/content/links/${encodeURIComponent(linkId)}`);
  },

  analytics(windowDays) {
    return api.get("/content/analytics", { params: { windowDays } });
  },
};

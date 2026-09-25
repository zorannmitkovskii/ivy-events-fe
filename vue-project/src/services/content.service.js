import { api } from "@/services/api";

/**
 * Blog, inspiration pages and the editor behind them (EPIC-09, IVY-906).
 *
 * <p>The `/public/*` calls are the ones a search engine and an anonymous
 * visitor reach; everything under `/content/*` needs an editor's token. They
 * are kept in one file because they are one feature, and split by prefix
 * because that is the line that actually matters.
 */
const enc = encodeURIComponent;

export const contentService = {
  // ── public ─────────────────────────────────────────────────────────────

  /** `q` searches titles and excerpts, case-insensitively, on the server. */
  published({ category, locale, tag, q } = {}) {
    return api.get("/public/blog", { params: { category, locale, tag, q } });
  },

  /** A locale that was never published is a 404, not a fallback to another
   *  language: a half-translated page in search results is worse than none. */
  read(slug, locale) {
    return api.get(`/public/blog/${enc(slug)}`, { params: { locale } });
  },

  landingPage(category, { city, locale } = {}) {
    return api.get(`/public/landing/${enc(category)}`,
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

  /** Every post whatever its state, filtered and paged. Filters left out are
   *  not sent: an empty status reaches Spring as a 400. */
  list({ q, category, status, tag, locale, page = 0, size = 20 } = {}) {
    return api.get("/content/posts", { params: { q, category, status, tag, locale, page, size } });
  },

  /** One post with every language whatever its state, each with its SEO. */
  get(postId) {
    return api.get(`/content/posts/${enc(postId)}`);
  },

  /** @param tagLocale the language a tag that does not exist yet is named in */
  createPost({ title, category, authorName, tags, tagLocale }) {
    return api.post("/content/posts", { title, category, authorName, tags, tagLocale });
  },

  /** What belongs to the post in every language: address, category, tags, cover. */
  updatePost(postId, { slug, category, tags, heroImageKey, tagLocale }) {
    return api.put(`/content/posts/${enc(postId)}`, { slug, category, tags, heroImageKey, tagLocale });
  },

  /** Each locale has its own title, body and SEO fields — a translation is not
   *  the same article with the words swapped. */
  writeVariant(postId, locale, variant) {
    return api.put(`/content/posts/${enc(postId)}/variants/${enc(locale)}`, variant);
  },

  moveStatus(variantId, status, publishAt) {
    return api.post(`/content/variants/${enc(variantId)}/status`, { status, publishAt });
  },

  /** Off the site in every language, kept with its address. */
  archive(postId) {
    return api.post(`/content/posts/${enc(postId)}/archive`);
  },

  /** Only a post that was never published; the server refuses the rest. */
  remove(postId) {
    return api.del(`/content/posts/${enc(postId)}`);
  },

  // ── tags (IVY-909) ─────────────────────────────────────────────────────

  /** Every tag with its names per language and how many posts carry it. */
  tags() {
    return api.get("/content/tags");
  },

  /** Adds a tag before anything carries it, so vendors can pick it. `slug` is optional. */
  createTag({ slug, names }) {
    return api.post("/content/tags", { slug, names });
  },

  /** A tag's names as one object, `{ mk: "сала", en: "venue" }`. A blank name is removed. */
  renameTag(tagId, names) {
    return api.put(`/content/tags/${enc(tagId)}`, { names });
  },

  /** Deletes the tag and takes it off every post carrying it. */
  removeTag(tagId) {
    return api.del(`/content/tags/${enc(tagId)}`);
  },

  /** A cover image. Answers with the storage key to save on the post and a URL
   *  to show now. */
  uploadImage(file) {
    const form = new FormData();
    form.append("file", file);
    return api.post("/content/images", form, { headers: { "Content-Type": "multipart/form-data" } });
  },

  addLink(postId, { targetType, targetId, sortOrder = 0 }) {
    return api.post(`/content/posts/${enc(postId)}/links`, { targetType, targetId, sortOrder });
  },

  /** Says which targets are still publishable. A link to a suspended vendor is
   *  found here rather than by a reader. */
  auditLinks(postId) {
    return api.get(`/content/posts/${enc(postId)}/links`);
  },

  removeLink(linkId) {
    return api.del(`/content/links/${enc(linkId)}`);
  },

  analytics(windowDays) {
    return api.get("/content/analytics", { params: { windowDays } });
  },
};

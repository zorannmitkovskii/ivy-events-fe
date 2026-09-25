import { api } from "@/services/api";

const enc = encodeURIComponent;

/**
 * The shared tags: one taxonomy for posts and vendors (agencies later).
 *
 * <p>Admins add tags (see `contentService.createTag`); a vendor only picks
 * from this list, which is what keeps "свадба" and "свадби" from becoming two
 * tags that connect nothing.
 */
export const tagsService = {
  /** Every tag named in `locale`, with how many posts and vendors carry it. */
  catalog(locale) {
    return api.get("/public/tags", { params: { locale } });
  },

  /** One tag's page: its published posts and listed vendors. 404 for an unknown tag. */
  hub(slug, locale) {
    return api.get(`/public/tags/${enc(slug)}`, { params: { locale } });
  },

  /** The signed-in vendor's own tags, in the order they picked them. */
  mine(locale) {
    return api.get("/vendor-portal/tags", { params: { locale } });
  },

  /** Replaces the signed-in vendor's tags. At most eight, all from the list. */
  setMine(slugs, locale) {
    return api.put("/vendor-portal/tags", { slugs }, { params: { locale } });
  },
};

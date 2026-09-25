import { api } from "@/services/api";

/**
 * The catalogues the public pages are drawn from — what trades a vendor can
 * list under, and which event categories Ivy offers. Open, like the rest of
 * `/public`: a visitor picks a category or a trade before they have an account.
 */
export const publicCatalogService = {
  /** Every vendor trade in the backend's order, with what the portal opens for it. */
  vendorTypes() {
    return api.get("/public/vendor-types");
  },

  /** The category cards: order, availability, sample name per language, and the types under each. */
  eventCategories() {
    return api.get("/public/event-categories");
  }
};

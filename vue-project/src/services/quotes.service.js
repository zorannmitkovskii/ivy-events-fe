import { api } from "@/services/api";

/**
 * Quotes (IVY-803).
 *
 * <p>Nothing here sends a total. Every amount is computed on the server from
 * the items — a number typed in a browser is a number nobody checked, and this
 * one ends up on an invoice.
 */
export const quotesService = {
  /** The vendor's first offer on an inquiry. */
  create(inquiryId, draft) {
    return api.post(`/inquiries/${encodeURIComponent(inquiryId)}/quotes`, draft);
  },

  /** A revision. The previous version is kept and marked superseded — "we
   *  agreed 60,000" has to still be provable three months later. */
  revise(quoteId, draft) {
    return api.post(`/quotes/${encodeURIComponent(quoteId)}/revise`, draft);
  },

  /** Every version, newest first: the negotiation, readable. */
  history(inquiryId) {
    return api.get(`/inquiries/${encodeURIComponent(inquiryId)}/quotes`);
  },

  /** Live quotes side by side, with a comparable total that excludes optional
   *  extras — one vendor's "included" is another's add-on. */
  compare() {
    return api.get("/quotes/compare");
  },

  accept(quoteId) {
    return api.post(`/quotes/${encodeURIComponent(quoteId)}/accept`);
  },

  decline(quoteId, reason) {
    return api.post(`/quotes/${encodeURIComponent(quoteId)}/decline`, { reason });
  },
};

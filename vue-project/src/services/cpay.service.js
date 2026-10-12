import publicApi from "@/services/backendApi";
import { api } from "@/services/api";
import { baseUrl } from "@/services/baseUrl";

export const cpayService = {
  /**
   * Starts a payment. Sent with the organizer's token (the token-aware client,
   * at the API root rather than /v1/api): since INV-603 the server refuses to
   * start paying for an event the caller does not manage, and an anonymous
   * request is exactly that — without the token every event checkout was a 403.
   * Resolves to the body `{ paymentUrl, fields }`.
   */
  async initPayment(payload) {
    return api.post("/api/cpay/init", payload, { baseURL: baseUrl });
  },

  /**
   * The payment's state as a bare word (public). The server serves it at
   * `/api/payments/{ref}/status`; the old `/api/cpay/payments/…` path did not exist.
   */
  async getPaymentStatus(orderRef) {
    return publicApi.get(`/api/payments/${encodeURIComponent(orderRef)}/status`);
  },

  /**
   * INV-701 — the payment and the invitation it publishes, as the server has
   * confirmed them: `{ paymentStatus, eventId, eventStatus, published,
   * publicUrl, design }`. Signed in; only for whoever manages the event.
   */
  async getPublication(orderRef) {
    return api.get(`/payments/${encodeURIComponent(orderRef)}/publication`);
  },
};

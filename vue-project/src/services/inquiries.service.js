import { api } from "@/services/api";
import { baseUrl } from "@/services/baseUrl";

/**
 * Inquiries, from both sides (IVY-802).
 *
 * <p>Every call is scoped to the caller by the server — a thread has two
 * participants and everybody else gets a 404, so there is nothing to filter
 * here.
 */
export const inquiriesService = {
  /** Sent from a vendor's public profile. `eventId` is optional: most first
   *  contacts happen before the couple has an event in Ivy. */
  send(vendorId, details) {
    return api.post(`/vendors/${encodeURIComponent(vendorId)}/inquiries`, details);
  },

  sent() {
    return api.get("/inquiries/sent");
  },

  inbox() {
    return api.get("/vendor-portal/inbox");
  },

  /** The unanswered count comes with the median, which on its own flatters. */
  metrics() {
    return api.get("/vendor-portal/inbox/metrics");
  },

  respond(inquiryId, decision, note) {
    return api.post(`/inquiries/${encodeURIComponent(inquiryId)}/respond`, { decision, note });
  },

  thread(inquiryId) {
    return api.get(`/inquiries/${encodeURIComponent(inquiryId)}/messages`);
  },

  /**
   * Multipart, because a menu or a quote sketch goes the same way as a line of
   * text. Sent with fetch rather than the axios wrapper so the browser sets the
   * multipart boundary itself.
   */
  async reply(inquiryId, { body, authorName, file }) {
    const form = new FormData();
    if (body) form.append("body", body);
    if (authorName) form.append("authorName", authorName);
    if (file) form.append("file", file);

    const response = await fetch(
      `${baseUrl}/v1/api/inquiries/${encodeURIComponent(inquiryId)}/messages`,
      {
        method: "POST",
        body: form,
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });

    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      throw new Error(problem?.data?.detail || problem?.message || "Send failed");
    }
    return response.json();
  },
};

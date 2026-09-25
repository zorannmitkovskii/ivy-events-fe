import { api } from "@/services/api";

/**
 * The agency side (EPIC-10).
 *
 * <p>No call here takes an organization id. The server reads it from the token,
 * and an endpoint that accepted one would be an endpoint somebody eventually
 * calls with a competitor's.
 */
export const crmService = {
  // ── pipeline (IVY-1001) ────────────────────────────────────────────────

  pipeline() {
    return api.get("/crm/leads");
  },

  /** What to do next, soonest first — the list an agency opens in the morning. */
  open() {
    return api.get("/crm/leads/open");
  },

  createLead(lead) {
    return api.post("/crm/leads", lead);
  },

  moveTo(leadId, stage) {
    return api.post(`/crm/leads/${encodeURIComponent(leadId)}/stage`, { stage });
  },

  /** Idempotent on the server: called twice it returns the same event rather
   *  than a second wedding in the agency's count. */
  win(leadId) {
    return api.post(`/crm/leads/${encodeURIComponent(leadId)}/win`, {});
  },

  lose(leadId, reason, note) {
    return api.post(`/crm/leads/${encodeURIComponent(leadId)}/lose`, { reason, note });
  },

  assign(leadId, ownerId) {
    return api.post(`/crm/leads/${encodeURIComponent(leadId)}/owner`, { ownerId });
  },

  lossReasons() {
    return api.get("/crm/leads/loss-reasons");
  },

  // ── proposals (IVY-1003) ───────────────────────────────────────────────

  proposalsFor(leadId) {
    return api.get(`/crm/leads/${encodeURIComponent(leadId)}/proposals`);
  },

  /**
   * @param proposal carries agencyFee and plannedBudget as two separate fields.
   *   They are never added: the fee is what the client pays this agency, the
   *   budget is what they will spend with suppliers.
   */
  createProposal(leadId, proposal) {
    return api.post(`/crm/leads/${encodeURIComponent(leadId)}/proposals`, proposal);
  },

  reviseProposal(proposalId, proposal) {
    return api.post(`/crm/proposals/${encodeURIComponent(proposalId)}/revisions`, proposal);
  },

  acceptProposal(proposalId) {
    return api.post(`/crm/proposals/${encodeURIComponent(proposalId)}/accept`, {});
  },

  // ── approvals (IVY-1002) ───────────────────────────────────────────────

  approvals(eventId) {
    return api.get(`/crm/approvals/event/${encodeURIComponent(eventId)}`);
  },

  openApprovals(eventId) {
    return api.get(`/crm/approvals/event/${encodeURIComponent(eventId)}/open`);
  },

  requestApproval(eventId, request) {
    return api.post(`/crm/approvals/event/${encodeURIComponent(eventId)}`, request);
  },

  decide(requestId, decision, comment) {
    return api.post(`/crm/approvals/${encodeURIComponent(requestId)}/decision`,
      { decision, comment });
  },

  // ── agency settings (IVY-1004, 1005, 1006) ─────────────────────────────

  branding() {
    return api.get("/crm/agency/branding");
  },

  saveBranding(branding) {
    return api.put("/crm/agency/branding", branding);
  },

  plan() {
    return api.get("/crm/agency/plan");
  },

  /** The agency's preferences: timezone, currency, language, notifications. */
  agencySettings() {
    return api.get("/crm/agency/settings");
  },

  /** Owner only; the server refuses a member. */
  saveAgencySettings(settings) {
    return api.put("/crm/agency/settings", settings);
  },

  profitability() {
    return api.get("/crm/agency/profitability");
  },

  leadSources() {
    return api.get("/crm/agency/lead-sources");
  },

  /** Revoked codes included — one that vanished when it stopped working leaves
   *  whoever printed it wondering whether it ever existed. */
  referralCodes() {
    return api.get("/crm/agency/referral-codes");
  },

  createReferralCode(code, rewardNote) {
    return api.post("/crm/agency/referral-codes", { code, rewardNote });
  },

  /**
   * Credits an event to a code.
   *
   * <p>Event-scoped, not organization-scoped: the person entering the code is
   * the couple or their organizer, never the restaurant that earns from it.
   */
  claimReferralCode(eventId, code) {
    return api.post(`/crm/agency/referral-codes/claim/${encodeURIComponent(eventId)}`, { code });
  },

  revokeReferralCode(codeId) {
    return api.del(`/crm/agency/referral-codes/${encodeURIComponent(codeId)}`);
  },
};

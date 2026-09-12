import { api } from "@/services/api";

export const analyticsService = {
  /**
   * Totals and per-event metrics across everything the caller can open.
   *
   * <p>Replaces the two calls per event the workspace page used to make. The
   * filters are the same ones the workspace list takes, so the cards and the
   * table below them always describe the same set of events.
   */
  workspace({ status, categoryType, from, to, organizerId } = {}) {
    const params = {};
    if (status) params.status = status;
    if (categoryType) params.categoryType = categoryType;
    if (from) params.from = from;
    if (to) params.to = to;
    if (organizerId) params.organizerId = organizerId;
    return api.get("/analytics/workspace", { params });
  },

  /**
   * The platform administrator's dashboard, in one request (IVY-1101).
   *
   * <p>Deliberately not `workspace` with a wider scope. That endpoint answers
   * "the events I can see" and is correct for an organizer and for an agency
   * owner; this one answers "the platform" and only an administrator may call
   * it. A 403 here means the caller is not one.
   *
   * <p>Returns totals, the status breakdown, the 30/60/90 buckets and the
   * attention list together — the whole page, so no card fetches its own
   * number and no two cards can describe different sets of events.
   */
  admin({ status, categoryType, from, to } = {}) {
    return api.get("/analytics/admin", { params: adminParams({ status, categoryType, from, to }) });
  },

  /** The attention banner alone, for its own refresh. */
  adminAttention({ status, categoryType, from, to } = {}) {
    return api.get("/analytics/admin/attention", {
      params: adminParams({ status, categoryType, from, to })
    });
  },

  /**
   * The same dashboard, narrowed to the caller's own organization (IVY-1201).
   *
   * <p>Takes no organization id and never will: the server reads it from the
   * token, which is the only reason one agency cannot measure another. Same
   * response shape as `admin`, so both screens render from one component.
   */
  agency({ status, categoryType, from, to } = {}) {
    return api.get("/analytics/agency", { params: adminParams({ status, categoryType, from, to }) });
  },

  /** The agency's attention list alone, for its own refresh. */
  agencyAttention({ status, categoryType, from, to } = {}) {
    return api.get("/analytics/agency/attention", {
      params: adminParams({ status, categoryType, from, to })
    });
  },

  /** The caller's own organization's at-risk window. No id, by design. */
  agencyRiskWindow() {
    return api.get("/crm/agency/risk-window");
  },

  setAgencyRiskWindow(riskWindowDays) {
    return api.put("/crm/agency/risk-window", { riskWindowDays });
  },

  /** An organization's at-risk window, as the admin panel sees it. */
  riskWindow(orgId) {
    return api.get(`/admin/settings/risk-window/${encodeURIComponent(orgId)}`);
  },

  setRiskWindow(orgId, riskWindowDays) {
    return api.put(`/admin/settings/risk-window/${encodeURIComponent(orgId)}`, { riskWindowDays });
  }
};

/**
 * Empty filters are left out rather than sent as empty strings.
 *
 * <p>`?categoryType=` reaches Spring as a blank value for an enum and comes
 * back a 400, so clearing a filter in the UI would look like a server error.
 */
function adminParams({ status, categoryType, from, to }) {
  const params = {};
  if (status) params.status = status;
  if (categoryType) params.categoryType = categoryType;
  if (from) params.from = from;
  if (to) params.to = to;
  return params;
}

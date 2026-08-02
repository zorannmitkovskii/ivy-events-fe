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
  }
};

import { api } from "./api";

/**
 * The traffic dashboard (IVY-906).
 *
 * <p>The period is a name, not a pair of dates. The server owns what "last
 * week" means so that every reader gets the same Monday — a client free to send
 * its own range is a client free to disagree with the next one about what a
 * month is.
 */
export const siteAnalyticsService = {
  /** @param period one of the SitePeriod names, e.g. THIS_WEEK, LAST_MONTH. */
  stats(period) {
    return api.get("/site-analytics/stats", { params: { period } });
  },
};

export default siteAnalyticsService;

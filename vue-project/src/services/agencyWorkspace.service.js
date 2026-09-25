import { api } from "@/services/api";

/**
 * The agency workspace: its home and its event list.
 *
 * <p>Both answer for whoever is asking. An agency owner gets the whole
 * organization, the team and the money; a member gets the events they lead or
 * assist on and the work assigned to them. The server decides which from the
 * token — nothing sent from here can widen it.
 */
export const agencyWorkspaceService = {
  /** @param range how many days ahead "this week" looks: 7 or 14 on the screen */
  home(range = 7) {
    return api.get("/analytics/agency/home", { params: { range } });
  },

  /** Owner only: every vendor booking on the agency's events — held, confirmed and cancelled. */
  vendors() {
    return api.get("/analytics/agency/vendors");
  },

  /**
   * Owner only: the event list as a CSV, built on the server from the same
   * rows. Returns the file as a Blob, ready to hand to a download link.
   */
  exportEvents(filters = {}) {
    const params = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") params[key] = value;
    }
    return api.get("/analytics/agency/events/export", { params, responseType: "blob" });
  },

  /** Every task on the viewer's agency events, with who has each one, the team and the events. */
  tasks() {
    return api.get("/analytics/agency/tasks");
  },

  /**
   * @param filters q, status, withinDays, and leadId (owner) or myRole (member).
   *     Empty values are left out: a blank enum reaches Spring as a 400.
   */
  events(filters = {}) {
    const params = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") params[key] = value;
    }
    return api.get("/analytics/agency/events", { params });
  },
};

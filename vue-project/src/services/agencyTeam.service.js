import { api } from "@/services/api";

/**
 * The agency's own team, with what each organizer is carrying (IVY-1202).
 *
 * <p>Takes no organization id and never will: the server reads it from the
 * token, which is the only reason one agency cannot measure another's staff.
 * The admin-facing twin (`organizers.service`) does take one, because crossing
 * organizations is that screen's whole job.
 */
export const agencyTeamService = {
  workload({ search, sort, direction, first, max } = {}) {
    const params = {};
    if (search) params.search = search;
    if (sort) params.sort = sort;
    if (direction) params.direction = direction;
    if (first != null) params.first = first;
    if (max != null) params.max = max;
    return api.get("/agency/organizers", { params });
  },
};

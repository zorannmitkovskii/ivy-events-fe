import { api } from "@/services/api";

/**
 * The console top-bar searches. The server scopes each to the caller — an
 * agency member's granted events, a vendor's own rows — so nothing sent from
 * here can widen what comes back.
 */
export const workspaceSearchService = {
  agency(q) {
    return api.get("/analytics/agency/search", { params: { q } });
  },

  vendor(q) {
    return api.get("/vendor-portal/search", { params: { q } });
  },
};

/** The hits out of an `ApiResponse`, whichever way the client handed it back. */
export function unwrapHits(response) {
  const rows = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(rows) ? rows : [];
}

import { api } from "@/services/api";

/**
 * What the signed-in person may open.
 *
 * <p>No call names a workspace. The backend resolves the agency or the vendor
 * from the token, so a caller can only ever ask about their own — the same
 * reason the vendor portal service takes no vendor id.
 */
export const privilegesService = {
  /** Every workspace the caller belongs to, with what they hold in each. */
  mine() {
    return api.get("/me/privileges");
  },

  /** Everything one workspace could hand out, for drawing the checkboxes. */
  catalogue(workspaceType) {
    return api.get(`/workspaces/${workspaceType}/privileges`);
  },

  members(workspaceType) {
    return api.get(`/workspaces/${workspaceType}/members`);
  },

  /**
   * Replaces the whole list for one member.
   *
   * <p>The whole list, not a diff. A checkbox screen saves what is ticked, and
   * expressing that as a sequence of grants and revokes invents an order the
   * person never had in mind.
   */
  replace(workspaceType, userId, privileges) {
    return api.put(`/workspaces/${workspaceType}/members/${userId}/privileges`, { privileges });
  },

  removeMember(workspaceType, userId) {
    return api.delete(`/workspaces/${workspaceType}/members/${userId}`);
  },
};

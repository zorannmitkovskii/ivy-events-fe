import publicApi from "@/services/backendApi";

export const invitationPageService = {
  async getByEventId(eventId) {
    const response = await publicApi.get(
      `/public/invitation-page/${encodeURIComponent(eventId)}`
    );
    return response.data;
  },
};

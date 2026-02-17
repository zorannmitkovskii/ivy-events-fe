import { api } from "@/services/api";
import publicApi from "@/services/backendApi";

export const feedbackService = {
  /** Public (no auth) — submit feedback */
  async submit(payload) {
    const res = await publicApi.post("/public/feedback", payload);
    return res.data;
  },

  /** Admin — list all feedback */
  listAll() {
    return api.get("/admin/feedbacks");
  },
};

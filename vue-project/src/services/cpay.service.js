import api from "@/services/backendApi";

export const cpayService = {
  async initPayment(payload) {
    return api.post("/api/cpay/init", payload);
  },

  async getPaymentStatus(orderId) {
    return api.get(`/api/cpay/payments/${encodeURIComponent(orderId)}/status`);
  }
};

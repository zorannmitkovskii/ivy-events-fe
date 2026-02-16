import { api } from "@/services/api";

export const budgetsService = {
  list(eventId) {
    const params = {};
    if (eventId) params.eventId = eventId;
    return api.get("/budgets/summary", { params });
  },

  create(payload) {
    return api.post("/budgets", payload);
  },

  update(budgetId, payload) {
    return api.put(`/budgets/${encodeURIComponent(budgetId)}`, payload);
  },

  remove(budgetId) {
    return api.del(`/budgets/${encodeURIComponent(budgetId)}`);
  },

  createExpense(payload) {
    return api.post("/expenses", payload);
  }
};

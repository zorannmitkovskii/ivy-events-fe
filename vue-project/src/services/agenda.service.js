import { api } from "@/services/api";

export const agendaApi = {
  list(eventId) {
    const params = {};
    if (eventId) params.eventId = eventId;
    return api.get("/agendas", { params });
  },

  getById(agendaId) {
    return api.get(`/agendas/${encodeURIComponent(agendaId)}`);
  },

  create(payload) {
    return api.post("/agendas", payload);
  },

  update(agendaId, payload) {
    return api.put(`/agendas/${encodeURIComponent(agendaId)}`, payload);
  },

  remove(agendaId) {
    return api.del(`/agendas/${encodeURIComponent(agendaId)}`);
  },

  // Convenience aliases used by useAgenda composable
  getDemoAgenda() {
    return api.get("/agendas", { params: { eventId: "demo" } });
  },

  getAgenda(eventId) {
    return api.get("/agendas", { params: { eventId } });
  },

  createItem(eventId, payload) {
    return api.post("/agendas", { ...payload, eventId });
  },

  updateItem(eventId, itemId, payload) {
    return api.put(`/agendas/${encodeURIComponent(itemId)}`, payload);
  },

  deleteItem(eventId, itemId) {
    return api.del(`/agendas/${encodeURIComponent(itemId)}`);
  }
};

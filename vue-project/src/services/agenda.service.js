// src/services/agendaApi.js
const BASE = import.meta.env.VITE_API_BASE_URL; // e.g. https://api.ivyevents.mk

function authHeaders() {
  const token = localStorage.getItem("access_token"); // or your auth store
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    body: body ? JSON.stringify(body) : undefined
  });

  // Handle errors consistently
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }

  // 204 no content
  if (res.status === 204) return null;
  return res.json();
}

export const agendaApi = {
  // ✅ demo
  getDemoAgenda() {
    return http("GET", "/events/demo/agenda");
  },

  // ✅ real event
  getAgenda(eventId) {
    return http("GET", `/events/${encodeURIComponent(eventId)}/agenda`);
  },

  createItem(eventId, payload) {
    return http("POST", `/events/${encodeURIComponent(eventId)}/agenda/items`, payload);
  },

  updateItem(eventId, itemId, payload) {
    return http(
      "PUT",
      `/events/${encodeURIComponent(eventId)}/agenda/items/${encodeURIComponent(itemId)}`,
      payload
    );
  },

  deleteItem(eventId, itemId) {
    return http(
      "DELETE",
      `/events/${encodeURIComponent(eventId)}/agenda/items/${encodeURIComponent(itemId)}`
    );
  }
};

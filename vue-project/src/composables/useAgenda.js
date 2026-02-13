// src/composables/useAgenda.js
import { ref } from "vue";
import { agendaApi } from "@/services/agenda.service.js";
import { onboardingStore } from "@/store/onboarding.store";

export function useAgenda() {
  const loading = ref(false);
  const error = ref(null);
  const items = ref([]);

  async function loadAgenda() {
    loading.value = true;
    error.value = null;

    try {
      const eventId = onboardingStore.eventId;
      if (!eventId) return;

      const data = await agendaApi.list(eventId);
      items.value = Array.isArray(data) ? data : [];
    } catch (e) {
      error.value = e?.message ?? "Failed to load agenda";
    } finally {
      loading.value = false;
    }
  }

  async function createItem(payload) {
    const eventId = onboardingStore.eventId;
    if (!eventId) throw new Error("Missing eventId");
    const created = await agendaApi.createItem(eventId, payload);
    items.value.push(created);
    return created;
  }

  async function updateItem(itemId, payload) {
    const eventId = onboardingStore.eventId;
    if (!eventId) throw new Error("Missing eventId");
    const updated = await agendaApi.updateItem(eventId, itemId, payload);
    const idx = items.value.findIndex(x => x.id === itemId);
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  }

  async function deleteItem(itemId) {
    const eventId = onboardingStore.eventId;
    if (!eventId) throw new Error("Missing eventId");
    await agendaApi.deleteItem(eventId, itemId);
    items.value = items.value.filter(x => x.id !== itemId);
  }

  return {
    loading,
    error,
    items,
    loadAgenda,
    createItem,
    updateItem,
    deleteItem,
  };
}

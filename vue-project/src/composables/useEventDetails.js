import { ref } from "vue";
import { eventDetailsService } from "@/services/eventDetails.service.js";
import { onboardingStore } from "@/store/onboarding.store";
import { getErrorMessage } from "@/services/apiError";

export function useEventDetails() {
  const loading = ref(false);
  const error = ref(null);
  const items = ref([]);

  async function loadEventDetails() {
    loading.value = true;
    error.value = null;

    try {
      const eventId = onboardingStore.eventId;
      if (!eventId) return;

      const data = await eventDetailsService.listByEvent(eventId);
      items.value = Array.isArray(data) ? data : [];
    } catch (e) {
      error.value = getErrorMessage(e);
    } finally {
      loading.value = false;
    }
  }

  async function createItem(payload) {
    const eventId = onboardingStore.eventId;
    if (!eventId) throw new Error("Missing eventId");
    const created = await eventDetailsService.create({ ...payload, eventId });
    items.value.push(created);
    return created;
  }

  async function updateItem(itemId, payload) {
    const updated = await eventDetailsService.update(itemId, payload);
    const idx = items.value.findIndex((x) => x.id === itemId);
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  }

  async function deleteItem(itemId) {
    await eventDetailsService.remove(itemId);
    items.value = items.value.filter((x) => x.id !== itemId);
  }

  return {
    loading,
    error,
    items,
    loadEventDetails,
    createItem,
    updateItem,
    deleteItem,
  };
}

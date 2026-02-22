import { ref } from "vue";
import { ourStoryApi } from "@/services/ourStory.service.js";
import { onboardingStore } from "@/store/onboarding.store";

export function useOurStory() {
  const loading = ref(false);
  const error = ref(null);
  const items = ref([]);
  const images = ref([]);

  async function loadStories() {
    loading.value = true;
    error.value = null;

    try {
      const eventId = onboardingStore.eventId;
      if (!eventId) return;

      const data = await ourStoryApi.listWithImages(eventId);
      items.value = Array.isArray(data.stories) ? data.stories : [];
      images.value = Array.isArray(data.images) ? data.images : [];
    } catch (e) {
      error.value = e?.message ?? "Failed to load stories";
    } finally {
      loading.value = false;
    }
  }

  async function createItem(payload, file) {
    const eventId = onboardingStore.eventId;
    if (!eventId) throw new Error("Missing eventId");
    const created = await ourStoryApi.create({ ...payload, eventId }, file);
    items.value.push(created);
    return created;
  }

  async function updateItem(itemId, payload, file) {
    const updated = await ourStoryApi.update(itemId, payload, file);
    const idx = items.value.findIndex(x => x.id === itemId);
    if (idx !== -1) items.value[idx] = updated;
    return updated;
  }

  async function deleteItem(itemId) {
    await ourStoryApi.remove(itemId);
    items.value = items.value.filter(x => x.id !== itemId);
  }

  return {
    loading,
    error,
    items,
    images,
    loadStories,
    createItem,
    updateItem,
    deleteItem,
  };
}

import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { eventsService } from "@/services/events.service";
import { createDemoEvent } from "@/demo/events.demo";

export function useCreateEvent() {
  const route = useRoute();
  const loading = ref(false);
  const error = ref(null);

  const isDemo = computed(() => String(route.query.demo || "") === "1");

  const createEvent = async (payload) => {
    loading.value = true;
    error.value = null;
    try {
      if (isDemo.value) return createDemoEvent(payload);
      return await eventsService.create(payload);
    } catch (e) {
      error.value = e?.message || "Failed to create event";
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return { createEvent, loading, error, isDemo };
}

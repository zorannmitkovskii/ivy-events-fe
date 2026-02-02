import { ref, computed, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { eventsService } from "@/services/events.service";
import { getDemoOverview } from "@/demo/overview.demo";
import { useAuthUser } from "@/composables/useAuthUser";

export function useEventOverview() {
  const route = useRoute();
  const { eventId } = useAuthUser();

  const data = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isDemo = computed(() => {
    return String(route.query.demo || "") === "1" || eventId.value === "demo";
  });

  const run = async () => {
    loading.value = true;
    error.value = null;

    try {
      if (isDemo.value) {
        data.value = getDemoOverview(eventId.value);
        return;
      }

      data.value = await eventsService.getOverview(eventId.value);
    } catch (e) {
      // fallback to demo so you can still show UI to clients
      data.value = getDemoOverview("demo");
      error.value = e?.message || "Failed to load overview";
    } finally {
      loading.value = false;
    }
  };

  watchEffect(() => {
    // re-fetch when eventId changes (after login)
    if (eventId.value) run();
  });

  return { data, loading, error, run, isDemo };
}

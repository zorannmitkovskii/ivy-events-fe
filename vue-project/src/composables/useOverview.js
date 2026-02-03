import { computed } from "vue";
import { useRoute } from "vue-router";
import { getDemoOverview } from "@/demo/overview.demo";

export function useOverview() {
  const route = useRoute();
  const eventId = computed(() => route.params.eventId);

  // demo only for now
  const data = getDemoOverview(eventId.value);

  return {
    event: data.event,
    overview: data.overview
  };
}

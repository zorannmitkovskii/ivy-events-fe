import { computed } from 'vue'
import { useRoute } from 'vue-router'

export default function useEventId() {
  const route = useRoute()
  const eventId = computed(() => route.params.eventId || null)
  return { eventId }
}

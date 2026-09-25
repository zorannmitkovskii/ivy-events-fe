import { useRoute, useRouter } from 'vue-router'
import { selectEvent } from '@/services/eventSelection.service'

/**
 * Opens one of the agency's events in the event workspace.
 *
 * <p>The event workspace reads which event it is about from the selection
 * store, not from the URL, so the event is selected first and the section
 * opened second — the same two steps the agency calendar takes.
 */
export function useOpenAgencyEvent() {
  const route = useRoute()
  const router = useRouter()

  /** @param section overview, tasks, guests, agenda… — a path under /dashboard/events */
  function openEvent(row, section = 'overview') {
    selectEvent({ id: row.eventId, categoryType: row.categoryType, status: row.status })
    router.push(`/${route.params.lang || 'mk'}/dashboard/events/${section}`)
  }

  return { openEvent }
}

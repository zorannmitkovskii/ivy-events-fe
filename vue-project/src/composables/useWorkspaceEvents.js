import { computed, reactive, ref } from 'vue'
import { eventsService } from '@/services/events.service'

/** The shape the workspace endpoint returns: the event plus this caller's pin. */
function unwrap(response) {
  const rows = Array.isArray(response) ? response : (response?.data ?? [])
  return Array.isArray(rows) ? rows : []
}

export const emptyFilters = () => ({ status: '', categoryType: '', from: '', to: '' })

/**
 * The caller's events, as the workspace shows them.
 *
 * <p>The backend already applies the filters and puts pinned events first, so
 * nothing here re-sorts or re-filters the list — a second copy of those rules
 * would eventually disagree with the one that matters.
 */
export default function useWorkspaceEvents() {
  const rows = ref([])
  const loading = ref(false)
  const error = ref(null)
  const filters = reactive(emptyFilters())

  const events = computed(() => rows.value.map(r => r.event))
  const pinnedEvents = computed(() => rows.value.filter(r => r.pinned).map(r => r.event))

  async function load() {
    loading.value = true
    error.value = null
    try {
      rows.value = unwrap(await eventsService.workspace(filters))
    } catch (e) {
      error.value = e
      rows.value = []
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    Object.assign(filters, emptyFilters())
  }

  /**
   * Flips the star immediately and puts it back if the call fails. Pinning is a
   * preference, not a payment — waiting for a round trip to redraw an icon
   * makes the list feel broken on a slow connection.
   *
   * <p>The row keeps its place until the next load. Reordering on click would
   * pull the row out from under the cursor, which is worse than an order that
   * is one action out of date.
   */
  async function togglePin(eventId) {
    const row = rows.value.find(r => r.event?.id === eventId)
    if (!row) return

    const wasPinned = row.pinned
    row.pinned = !wasPinned
    try {
      await (wasPinned ? eventsService.unpin(eventId) : eventsService.pin(eventId))
    } catch (e) {
      row.pinned = wasPinned
      error.value = e
    }
  }

  return { rows, events, pinnedEvents, filters, loading, error, load, resetFilters, togglePin }
}

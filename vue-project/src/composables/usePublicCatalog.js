import { computed, ref } from 'vue'
import { publicCatalogService } from '@/services/publicCatalog.service'

/**
 * The public catalogues, each loaded once and shared.
 *
 * <p>Module-level for the reason the agency preferences are: every screen that
 * lists a trade or a category asks the same question, and one request answers
 * it. The server caches the answer too, so a reload does not reach the database.
 *
 * <p>A failed read leaves the list empty and says so through `failed`; there is
 * deliberately no hard-coded copy to fall back to, because a stale copy is
 * exactly how the screens drifted apart before.
 */
function cachedList(fetchList) {
  const items = ref([])
  const loaded = ref(false)
  const failed = ref(false)
  let inFlight = null

  function load() {
    if (loaded.value) return Promise.resolve(items.value)
    if (inFlight) return inFlight
    inFlight = Promise.resolve()
      .then(fetchList)
      .then((response) => {
        const data = response?.data ?? response
        items.value = Array.isArray(data) ? data : []
        failed.value = false
        loaded.value = true
        return items.value
      })
      .catch(() => {
        failed.value = true
        return items.value
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }

  function reset() {
    items.value = []
    loaded.value = false
    failed.value = false
    inFlight = null
  }

  return { items, loaded, failed, load, reset }
}

const vendorTypes = cachedList(() => publicCatalogService.vendorTypes())
const eventCategories = cachedList(() => publicCatalogService.eventCategories())

/** Vendor trades, `{ code, capabilities }`, in the backend's grouped order. */
export function useVendorTypes() {
  const codes = computed(() => vendorTypes.items.value.map((type) => type.code))
  return { types: vendorTypes.items, codes, loaded: vendorTypes.loaded, failed: vendorTypes.failed, load: vendorTypes.load }
}

/** Event category cards, `{ category, order, available, featured, tint, sample, types }`, in display order. */
export function useEventCategories() {
  return {
    categories: eventCategories.items,
    loaded: eventCategories.loaded,
    failed: eventCategories.failed,
    load: eventCategories.load,
  }
}

/** Test seam: drops the shared state so one test cannot colour the next. */
export function __resetPublicCatalog() {
  vendorTypes.reset()
  eventCategories.reset()
}

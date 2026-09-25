import { computed, ref } from 'vue'
import { crmService } from '@/services/crm.service'
import { DEFAULT_CURRENCY } from '@/utils/agencyFormat.js'

/**
 * The agency's settings the screens draw with — its currency and language —
 * loaded once and shared.
 *
 * <p>Module-level for the same reason the privileges are: every budget cell on
 * every agency screen asks the same question, and one request answers it.
 * A failed read falls back to the platform's defaults rather than blanking
 * the amounts; the settings page is where a real failure is reported.
 */

const DEFAULTS = Object.freeze({ currency: DEFAULT_CURRENCY, language: 'mk', timezone: 'Europe/Skopje' })

const preferences = ref({ ...DEFAULTS })
const loaded = ref(false)
let inFlight = null

export function useAgencyPreferences() {
  async function load({ force = false } = {}) {
    if (loaded.value && !force) return preferences.value
    if (inFlight && !force) return inFlight

    // Started inside a promise so a failure of any kind — including no
    // settings endpoint to call — lands in the catch, never in the caller.
    inFlight = Promise.resolve()
      .then(() => crmService.agencySettings())
      .then((response) => {
        const data = response?.data?.data ?? response?.data ?? {}
        preferences.value = { ...DEFAULTS, ...data }
        return preferences.value
      })
      .catch(() => {
        preferences.value = { ...DEFAULTS }
        return preferences.value
      })
      .finally(() => {
        loaded.value = true
        inFlight = null
      })
    return inFlight
  }

  const currency = computed(() => preferences.value.currency || DEFAULT_CURRENCY)

  return { preferences, currency, loaded, load }
}

/** Test seam: drops the shared state so one test cannot colour the next. */
export function __resetAgencyPreferences() {
  preferences.value = { ...DEFAULTS }
  loaded.value = false
  inFlight = null
}

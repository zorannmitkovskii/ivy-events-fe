import { ref, onBeforeUnmount } from 'vue'
import { cpayService } from '@/services/cpay.service'
import { CONFIRM_POLL_DELAYS, MAX_CHECK_ERRORS, publishOutcome } from '@/utils/publishOutcome'

/**
 * INV-701 — asks the server what became of a payment until it can say.
 *
 * `phase`:
 * - `loading` — the first answer has not come yet
 * - `confirming` — payment or publication not confirmed yet; checks continue
 * - `slow` — still not confirmed after the checks ran out; a manual `check()` goes on
 * - `published` | `failed` | `paid` — the server's answer (see `publishOutcome`)
 * - `error` — the server could not be asked (several times in a row); `check()` retries
 * - `forbidden` (403), `notFound` (404, or no reference at all)
 *
 * Success is never derived from the redirect or from the query string — only
 * from `GET /v1/api/payments/{ref}/publication`.
 */
export function usePublishConfirmation(orderRef, {
  fetchPublication = (ref) => cpayService.getPublication(ref),
  delays = CONFIRM_POLL_DELAYS,
  maxErrors = MAX_CHECK_ERRORS,
} = {}) {
  const phase = ref('loading')
  const data = ref(null)
  const error = ref(null)

  let timer = null
  let step = 0
  let errorsInRow = 0
  let stopped = false
  let generation = 0

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function scheduleNext(gen) {
    clearTimer()
    if (stopped || gen !== generation) return
    if (step >= delays.length) {
      phase.value = 'slow'
      return
    }
    const wait = delays[step]
    step += 1
    timer = setTimeout(() => { runCheck(gen) }, wait)
  }

  async function runCheck(gen) {
    if (stopped || gen !== generation) return
    const ref = typeof orderRef === 'function' ? orderRef() : orderRef
    if (!ref) {
      phase.value = 'notFound'
      return
    }
    let answer
    try {
      const res = await fetchPublication(ref)
      answer = res && 'paymentStatus' in Object(res) ? res : res?.data
    } catch (e) {
      if (stopped || gen !== generation) return
      const status = e?.status ?? e?.response?.status
      if (status === 403) { error.value = e; phase.value = 'forbidden'; return }
      if (status === 404) { error.value = e; phase.value = 'notFound'; return }
      errorsInRow += 1
      error.value = e
      if (errorsInRow >= maxErrors) {
        phase.value = 'error'
        return
      }
      scheduleNext(gen)
      return
    }
    if (stopped || gen !== generation) return
    errorsInRow = 0
    error.value = null
    data.value = answer
    const outcome = publishOutcome(answer)
    if (outcome === 'confirming') {
      // A late confirmation stays "late", it does not go back to the spinner.
      if (phase.value !== 'slow') phase.value = 'confirming'
      scheduleNext(gen)
      return
    }
    phase.value = outcome
  }

  /** Starts (or restarts, after `slow` or `error`) asking the server. */
  function check() {
    generation += 1
    clearTimer()
    step = 0
    errorsInRow = 0
    stopped = false
    if (phase.value === 'error') phase.value = 'loading'
    return runCheck(generation)
  }

  function stop() {
    stopped = true
    clearTimer()
  }

  onBeforeUnmount(stop)

  return { phase, data, error, check, stop }
}

import { eventsService } from '@/services/events.service'
import {
  onboardingStore,
  setEventId,
  setSelectedCategory,
  setEventStatus,
  setInvitationName
} from '@/store/onboarding.store'

function unwrap(response) {
  if (Array.isArray(response)) return response
  const rows = response?.data ?? response?.content ?? []
  return Array.isArray(rows) ? rows : []
}

export function idOf(event) {
  return event?.id || event?.eventId || ''
}

/**
 * Makes an event the one the dashboard is about.
 *
 * <p>The dashboard reads category and status from the store, not from the event
 * it is showing, so both travel with the id. Setting the id alone leaves the
 * sidebar drawing the previous event's menu.
 */
export function selectEvent(event) {
  setEventId(idOf(event))
  setSelectedCategory(event?.categoryType || '')
  setEventStatus(event?.status || '')
  setInvitationName(event?.invitation?.name || event?.invitationName || '')
}

export function clearSelectedEvent() {
  selectEvent(null)
}

/**
 * Decides which event the dashboard opens on.
 *
 * <p>Until IVY-101 this came from the `eventIds` claim in the token. Access no
 * longer lives in the token, so the list is asked for instead: one event
 * selects itself, several mean the person picks, none means there is nothing to
 * open yet.
 *
 * <p>A stored selection is kept only if it is still in the list — access can be
 * taken away between two visits, and localStorage would not know.
 *
 * <p>When the call fails the stored selection is left untouched. A network
 * blip is not evidence that someone lost their events.
 */
export async function resolveCurrentEvent() {
  let events
  try {
    events = unwrap(await eventsService.getAll())
  } catch {
    return { eventId: onboardingStore.eventId || '', eventCount: 0, failed: true }
  }

  const stored = onboardingStore.eventId
  if (stored && events.some(e => idOf(e) === stored)) {
    return { eventId: stored, eventCount: events.length, failed: false }
  }

  if (events.length === 1) {
    selectEvent(events[0])
    return { eventId: idOf(events[0]), eventCount: 1, failed: false }
  }

  clearSelectedEvent()
  return { eventId: '', eventCount: events.length, failed: false }
}

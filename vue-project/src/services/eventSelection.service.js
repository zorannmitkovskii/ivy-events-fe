import { ref } from 'vue'
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

/**
 * INV-703 — why the last link to a specific event could not open it, or ''.
 *
 * <p>Set by {@link selectEventFromLink} when a dashboard address names an event
 * the person cannot open; the dashboard shell shows it instead of silently
 * showing whichever event happened to be selected before.
 */
export const eventLinkNotice = ref('')

// The redirect that drops `?eventId=` from the address is itself a navigation;
// the notice must survive that one and go away on the next.
let noticeArmed = false

/** Records that a link named an event the person cannot open. */
export function refuseEventLink() {
  eventLinkNotice.value = 'refused'
  noticeArmed = true
}

/** Called on every dashboard navigation without `?eventId=`. */
export function settleEventLinkNotice() {
  if (noticeArmed) {
    noticeArmed = false
    return
  }
  eventLinkNotice.value = ''
}

export function dismissEventLinkNotice() {
  noticeArmed = false
  eventLinkNotice.value = ''
}

const EVENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The `?eventId=` of a dashboard address, when it looks like an event id. */
export function linkedEventId(route) {
  const raw = Array.isArray(route?.query?.eventId) ? route.query.eventId[0] : route?.query?.eventId
  const id = typeof raw === 'string' ? raw.trim() : ''
  return EVENT_ID_PATTERN.test(id) ? id : ''
}

/**
 * INV-703 — a link into the dashboard for one event (`?eventId=`), e.g. "see
 * the guest list" on the publication screen.
 *
 * <p>The dashboard works on the selected event, so the link selects it — but
 * only if it is in the person's own list of events, the same list that decides
 * what they may open (owner, team grant, agency). Anything else is refused and
 * the current selection is left alone; the server refuses the data either way.
 *
 * <p>If the list cannot be loaded the id is selected anyway: the guest list
 * the link was for is then asked for that event, and the server answers 403 if
 * access is missing. Showing a different event's guests would be the worse
 * mistake.
 *
 * @returns {'selected' | 'refused' | 'unverified'}
 */
export async function selectEventFromLink(eventId) {
  let events
  try {
    events = unwrap(await eventsService.getAll())
  } catch {
    if (onboardingStore.eventId !== eventId) setEventId(eventId)
    dismissEventLinkNotice()
    return 'unverified'
  }
  const event = events.find(e => idOf(e) === eventId)
  if (!event) {
    refuseEventLink()
    return 'refused'
  }
  selectEvent(event)
  dismissEventLinkNotice()
  return 'selected'
}

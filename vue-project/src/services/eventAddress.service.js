import { api } from '@/services/api'

/**
 * An event's own invitation address, `<label>.ivyevents.mk`.
 * Free for every event; set by whoever may edit the event.
 */

function unwrap(response) {
  return response?.data ?? response ?? null
}

function base(eventId) {
  return `/events/${encodeURIComponent(eventId)}/address`
}

export const eventAddressService = {
  async get(eventId) {
    return unwrap(await api.get(base(eventId)))
  },

  /** Whether a label could be this event's, and why not / what instead. */
  async availability(eventId, label) {
    return unwrap(await api.get(`${base(eventId)}/availability`, { params: { label } }))
  },

  async save(eventId, label, enabled) {
    return unwrap(await api.put(base(eventId), { label, enabled }))
  },
}

/**
 * The link to hand guests: the event's own address while it is switched on,
 * the ordinary invitation address otherwise. Private links carry a path and a
 * token and are never replaced.
 */
export function invitationLinkFor(address, fallbackUrl) {
  return address?.enabled && address?.url ? address.url : fallbackUrl || ''
}

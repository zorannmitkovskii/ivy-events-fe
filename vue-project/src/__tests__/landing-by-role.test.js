import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Where each role lands after signing in.
 *
 * <p>ORG_ADMIN was absent from this decision entirely. Signing up as an agency
 * grants ORG_ADMIN and USER but <b>not</b> ORGANIZER, so an agency owner fell
 * through to {@code /dashboard/events/overview} — the page built for somebody
 * planning their own wedding — and saw a single event while running twenty.
 */

const roles = new Set()

vi.mock('@/services/auth.service', () => ({
  hasRole: (role) => roles.has(role),
}))

const resolveCurrentEvent = vi.fn()
vi.mock('@/services/eventSelection.service', () => ({
  resolveCurrentEvent: (...args) => resolveCurrentEvent(...args),
}))

const { homeForCurrentUser, landingAfterAuth } = await import('@/router/landing')

beforeEach(() => {
  roles.clear()
  resolveCurrentEvent.mockReset()
  resolveCurrentEvent.mockResolvedValue({ eventId: null, eventCount: 0 })
})

describe('homeForCurrentUser', () => {
  it('sends an agency owner to the agency dashboard', () => {
    roles.add('ORG_ADMIN')
    roles.add('USER')

    // Exactly the role set agency signup produces. Until IVY-1201 this landed
    // on /organizer alongside individual organizers; the scope was already
    // right there, the screen was not.
    expect(homeForCurrentUser('mk')).toBe('/mk/org/dashboard')
  })

  it('leaves an individual organizer on the organizer overview', () => {
    roles.add('ORGANIZER')

    // The half of the old shared route that did not move.
    expect(homeForCurrentUser('mk')).toBe('/mk/organizer')
  })

  it('sends an organizer there too', () => {
    roles.add('ORGANIZER')
    expect(homeForCurrentUser('mk')).toBe('/mk/organizer')
  })

  it('leaves a plain user on their own event', () => {
    roles.add('USER')
    expect(homeForCurrentUser('mk')).toBe('/mk/dashboard/events/overview')
  })

  it('keeps platform admin and vendor ahead of both', () => {
    roles.add('ADMIN')
    roles.add('ORG_ADMIN')
    // Somebody who is both lands on the admin console; the order is the point.
    // The console's front door is the dashboard since IVY-1101 — before that
    // /admin had no overview and redirected straight to the events table.
    expect(homeForCurrentUser('mk')).toBe('/mk/admin/dashboard')

    roles.clear()
    roles.add('VENDOR')
    roles.add('ORGANIZER')
    expect(homeForCurrentUser('mk')).toBe('/mk/vendor/calendar')
  })
})

describe('landingAfterAuth', () => {
  it('sends a brand-new agency with no events to its dashboard, not a blank page', async () => {
    roles.add('ORG_ADMIN')

    await expect(landingAfterAuth('mk')).resolves.toBe('/mk/org/dashboard')
    // The event lookup is not even needed to answer this.
    expect(resolveCurrentEvent).not.toHaveBeenCalled()
  })

  it('does not divert an agency owner to a single event they were headed for', async () => {
    roles.add('ORG_ADMIN')

    // A stale redirect must not put somebody who runs events back on the
    // one-event page; that was the shape of the original complaint.
    await expect(landingAfterAuth('mk', '/mk/dashboard/events/guests'))
      .resolves.toBe('/mk/org/dashboard')
  })

  it('still honours a redirect for a plain user', async () => {
    roles.add('USER')
    resolveCurrentEvent.mockResolvedValue({ eventId: 'e-1', eventCount: 1 })

    await expect(landingAfterAuth('mk', '/mk/dashboard/events/guests'))
      .resolves.toBe('/mk/dashboard/events/guests')
  })

  it('still sends a plain user with several events and none chosen to choose one', async () => {
    roles.add('USER')
    resolveCurrentEvent.mockResolvedValue({ eventId: null, eventCount: 3 })

    await expect(landingAfterAuth('mk')).resolves.toBe('/mk/organizer')
  })
})

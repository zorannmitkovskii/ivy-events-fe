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
    roles.add('AGENCY')
    roles.add('USER')

    // Exactly the role set agency signup produces. Until IVY-1201 this landed
    // on /organizer alongside individual organizers; the scope was already
    // right there, the screen was not.
    expect(homeForCurrentUser('mk')).toBe('/mk/agency/dashboard')
  })

  it('sends an agency member into the agency workspace too, not the bare organiser page', () => {
    roles.add('AGENCY_MEMBER')

    // Since 2026-09 a member has their own version of the agency shell. The
    // standalone /organizer page has no sidebar, so a member landing there had
    // no way to their calendar or tasks.
    expect(homeForCurrentUser('mk')).toBe('/mk/agency/dashboard')
  })

  it('sends a member there after sign-in as well, whatever they were headed for', async () => {
    roles.add('AGENCY_MEMBER')

    await expect(landingAfterAuth('mk', '/mk/dashboard/events/guests')).resolves.toBe('/mk/agency/dashboard')
    expect(resolveCurrentEvent).not.toHaveBeenCalled()
  })

  it('leaves a plain user on their own event', () => {
    roles.add('USER')
    expect(homeForCurrentUser('mk')).toBe('/mk/dashboard/events/overview')
  })

  it('keeps platform admin and vendor ahead of both', () => {
    roles.add('ADMIN')
    roles.add('AGENCY')
    // Somebody who is both lands on the admin console; the order is the point.
    // The console's front door is the dashboard since IVY-1101 — before that
    // /admin had no overview and redirected straight to the events table.
    expect(homeForCurrentUser('mk')).toBe('/mk/admin/dashboard')

    roles.clear()
    roles.add('VENDOR_MEMBER')
    roles.add('AGENCY_MEMBER')
    expect(homeForCurrentUser('mk')).toBe('/mk/vendor/home')
  })
})

describe('landingAfterAuth', () => {
  it('sends a brand-new agency with no events to its dashboard, not a blank page', async () => {
    roles.add('AGENCY')

    await expect(landingAfterAuth('mk')).resolves.toBe('/mk/agency/dashboard')
    // The event lookup is not even needed to answer this.
    expect(resolveCurrentEvent).not.toHaveBeenCalled()
  })

  it('does not divert an agency owner to a single event they were headed for', async () => {
    roles.add('AGENCY')

    // A stale redirect must not put somebody who runs events back on the
    // one-event page; that was the shape of the original complaint.
    await expect(landingAfterAuth('mk', '/mk/dashboard/events/guests'))
      .resolves.toBe('/mk/agency/dashboard')
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

/**
 * Zero events (blueprint §5, phase 4).
 *
 * <p>The three cases the blueprint names are 0, 1 and 2+. Only the last two
 * were ever decided here, so somebody who had just verified their email — the
 * one person guaranteed to have no events — landed on an event dashboard with
 * no event behind it.
 */
describe('landingAfterAuth with no events yet', () => {
  it('starts a brand-new user on creating an event, not on an empty dashboard', async () => {
    roles.add('USER')
    resolveCurrentEvent.mockResolvedValue({ eventId: null, eventCount: 0, failed: false })

    await expect(landingAfterAuth('mk')).resolves.toBe('/mk/event-category')
  })

  it('goes to onboarding even when a stale redirect points at an event screen', async () => {
    roles.add('USER')
    resolveCurrentEvent.mockResolvedValue({ eventId: null, eventCount: 0, failed: false })

    // Same reasoning as the 2+ case above, which also overrides the redirect:
    // an event-scoped page with no event is a blank screen with no explanation.
    await expect(landingAfterAuth('mk', '/mk/dashboard/events/guests'))
      .resolves.toBe('/mk/event-category')
  })

  it('does not send somebody to onboarding because the lookup failed', async () => {
    roles.add('USER')
    // A network failure also reports zero. Treating that as "you have no
    // events" would tell a person with three weddings to create their first.
    resolveCurrentEvent.mockResolvedValue({ eventId: '', eventCount: 0, failed: true })

    await expect(landingAfterAuth('mk')).resolves.toBe('/mk/dashboard/events/overview')
  })

  it('leaves the other roles alone — they are answered before the lookup', async () => {
    for (const role of ['ADMIN', 'VENDOR_MEMBER', 'AGENCY', 'AGENCY_MEMBER']) {
      roles.clear()
      roles.add(role)
      resolveCurrentEvent.mockClear()

      await landingAfterAuth('mk')
      expect(resolveCurrentEvent).not.toHaveBeenCalled()
    }
  })
})

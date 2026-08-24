import { describe, it, expect, beforeEach } from 'vitest'
import {
  onboardingStore, claimOnboardingFor, setEventId, initOnboarding, clearOnboarding,
} from '@/store/onboarding.store'

/**
 * Onboarding state must not outlive the account it belongs to.
 *
 * <p>Written after a real 403: a browser still holding a previous test user's
 * {@code eventId} sent {@code PUT /events/full/<their event>} for a freshly
 * registered account. The backend refused it, correctly — the bug was entirely
 * on this side, and it looked like a permissions fault on the other.
 *
 * <p>It only cleared on logout, so every other way a session ends — an expired
 * token, a closed browser, a second signup on the same machine — carried one
 * person's event into the next person's session.
 */

const STATE = 'onboarding_state_v1'
const OWNER = 'onboarding_owner_v1'

beforeEach(() => {
  localStorage.clear()
  // The store is a module-level reactive object and outlives each test, so
  // clearing storage alone leaves the previous case's eventId in memory.
  clearOnboarding()
  localStorage.clear()
})

describe('claiming onboarding for a user', () => {
  it('discards state left by a different account', () => {
    claimOnboardingFor('user-a')
    setEventId('event-of-a')
    expect(onboardingStore.eventId).toBe('event-of-a')

    const cleared = claimOnboardingFor('user-b')

    expect(cleared).toBe(true)
    // The exact failure: user B's first save went to user A's event.
    expect(onboardingStore.eventId).toBe('')
  })

  it('keeps state for the same account returning mid-signup', () => {
    claimOnboardingFor('user-a')
    setEventId('event-of-a')

    const cleared = claimOnboardingFor('user-a')

    // Persisting it is the whole point; the same person should not start again.
    expect(cleared).toBe(false)
    expect(onboardingStore.eventId).toBe('event-of-a')
  })

  it('keeps the pre-login onboarding a new account is in the middle of', () => {
    // No owner yet: this is the signup flow, where category and invitation are
    // chosen before the account exists. Wiping it at login would throw away the
    // signup in progress.
    onboardingStore.selectedCategory = 'WEDDING'
    onboardingStore.isEmailVerified = true

    const discarded = claimOnboardingFor('user-new')

    expect(discarded).toBe(false)
    expect(onboardingStore.selectedCategory).toBe('WEDDING')
    expect(onboardingStore.isEmailVerified).toBe(true)
  })

  it('drops an unowned eventId, because only a signed-in session could have made it', () => {
    onboardingStore.selectedCategory = 'WEDDING'
    setEventId('event-of-somebody-else')

    const discarded = claimOnboardingFor('user-new')

    expect(discarded).toBe(true)
    expect(onboardingStore.eventId).toBe('')
    // The choices are still this person's own.
    expect(onboardingStore.selectedCategory).toBe('WEDDING')
  })

  it('drops a legacy eventId saved before owners were tracked', () => {
    // An upgrade lands on browsers already holding state with no marker.
    localStorage.setItem(STATE, JSON.stringify({ eventId: 'legacy-event' }))
    initOnboarding()
    expect(onboardingStore.eventId).toBe('legacy-event')

    const discarded = claimOnboardingFor('user-a')

    expect(discarded).toBe(true)
    expect(onboardingStore.eventId).toBe('')
  })

  it('records the owner so the next sign-in can compare', () => {
    claimOnboardingFor('user-a')
    expect(localStorage.getItem(OWNER)).toBe('user-a')
  })
})

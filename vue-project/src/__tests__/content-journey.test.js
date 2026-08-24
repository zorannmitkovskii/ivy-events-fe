import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The content-to-conversion trail (IVY-905).
 *
 * <p>Consent is the whole test. A tracker that decides for itself that somebody
 * probably meant yes is the reason consent banners stopped meaning anything,
 * and the version of this that stores an id "just in case" is indistinguishable
 * from the version that respects the answer — until a regulator asks.
 */

const recordEvent = vi.fn()

vi.mock('@/services/content.service', () => ({
  contentService: {
    recordEvent: (...args) => recordEvent(...args),
  },
}))

const { track, hasConsent, sessionId } = await import('@/composables/useContentJourney')

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  recordEvent.mockResolvedValue({})
})

function accept() {
  localStorage.setItem('cookie_consent', 'accepted')
}

describe('consent', () => {
  it('is false until it is explicitly accepted', () => {
    expect(hasConsent()).toBe(false)

    localStorage.setItem('cookie_consent', 'rejected')
    expect(hasConsent()).toBe(false)

    accept()
    expect(hasConsent()).toBe(true)
  })

  it('sends the answer as given rather than assuming one', async () => {
    await track('CONTENT_VIEW', { category: 'WEDDING' })
    expect(recordEvent.mock.calls[0][0].consented).toBe(false)

    accept()
    await track('CONTENT_VIEW', { category: 'WEDDING' })
    expect(recordEvent.mock.calls[1][0].consented).toBe(true)
  })
})

describe('the session id', () => {
  it('is stable within a session once consent is given', () => {
    accept()
    expect(sessionId()).toBe(sessionId())
    expect(sessionStorage.getItem('ivy_content_session')).toBeTruthy()
  })

  it('is thrown away every call without consent, and never persisted', () => {
    const first = sessionId()
    const second = sessionId()

    // Two different values that cannot be joined, which is what "we counted it
    // but we do not know who" actually requires.
    expect(first).not.toBe(second)
    expect(sessionStorage.getItem('ivy_content_session')).toBeNull()
  })

  it('carries nothing about the person', async () => {
    accept()
    await track('VENDOR_CLICK', { category: 'VENUE', locale: 'mk' })

    const sent = recordEvent.mock.calls[0][0]
    expect(Object.keys(sent).sort())
      .toEqual(['category', 'consented', 'kind', 'locale', 'postId', 'sessionId'])
    expect(sent.sessionId).not.toContain('@')
  })
})

describe('failure', () => {
  it('never lets a counter break the page', async () => {
    recordEvent.mockRejectedValue(new Error('Network error'))

    // No assertion on the error because there must not be one to catch: a
    // reader has never wanted to know that analytics is down.
    await expect(track('CONTENT_VIEW', {})).resolves.toBeUndefined()
  })
})

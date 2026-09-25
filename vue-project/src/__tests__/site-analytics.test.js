import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Site traffic from the browser's side (IVY-906).
 *
 * <p>Consent is most of the test, as it is for the content trail: the version
 * that stores an id "just in case" is indistinguishable from the version that
 * respects the answer, right up until somebody asks. The rest is about the
 * queue — that a click during unload is not lost, and that a counter cannot
 * take a page down with it.
 */

const fetchMock = vi.fn()
const beaconMock = vi.fn()

vi.mock('@/services/baseUrl', () => ({ baseUrl: 'http://api.test' }))

const {
  setConsent,
  hasConsent,
  consentState,
  trackPageView,
  trackClick,
  trackPurchase,
  flush,
  labelFor,
  resetSiteAnalyticsForTest,
} = await import('@/composables/useSiteAnalytics')

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  resetSiteAnalyticsForTest()
  fetchMock.mockResolvedValue({ ok: true })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('navigator', { ...navigator, sendBeacon: beaconMock })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/**
 * Accepts and drains.
 *
 * <p>Accepting records a view of the current page by itself, so without the
 * flush every case below would start with a stray event in the queue.
 */
function accept() {
  setConsent(true)
  flush()
  vi.clearAllMocks()
}

function sentBody() {
  expect(fetchMock).toHaveBeenCalled()
  return JSON.parse(fetchMock.mock.calls[0][1].body)
}

describe('consent', () => {
  it('is unanswered until the visitor answers', () => {
    expect(consentState()).toBeNull()
    expect(hasConsent()).toBe(false)
  })

  it('remembers acceptance', () => {
    setConsent(true)
    expect(hasConsent()).toBe(true)
  })

  it('remembers refusal as an answer, so the banner stays away', () => {
    setConsent(false)
    expect(consentState()).toBe('rejected')
    expect(hasConsent()).toBe(false)
  })

  it('sends nothing at all before an answer', () => {
    trackPageView('/')
    trackClick('cta')
    flush()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(beaconMock).not.toHaveBeenCalled()
  })

  it('sends nothing after a refusal', () => {
    setConsent(false)
    trackPageView('/')
    flush()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never sends what was attempted before an answer', () => {
    trackPageView('/before-any-answer')
    setConsent(false)
    setConsent(true)
    flush()

    // Exactly one event: the view acceptance itself records. The page tracked
    // before there was an answer is gone, not held back for later.
    const events = sentBody().events
    expect(events).toHaveLength(1)
    expect(events[0].path).not.toBe('/before-any-answer')
  })
})

describe('what is sent', () => {
  it('batches events under one session id', () => {
    accept()
    trackPageView('/pricing')
    trackClick('cta-buy')
    flush()

    const body = sentBody()
    expect(body.consented).toBe(true)
    expect(body.sessionId).toBeTruthy()
    expect(body.events).toHaveLength(2)
    expect(body.events[0]).toMatchObject({ type: 'PAGE_VIEW', path: '/pricing' })
    expect(body.events[1]).toMatchObject({ type: 'CLICK', label: 'cta-buy' })
  })

  it('keeps one session id across events', () => {
    accept()
    trackPageView('/a')
    flush()
    const first = sentBody().sessionId

    fetchMock.mockClear()
    trackPageView('/b')
    flush()
    expect(sentBody().sessionId).toBe(first)
  })

  it('carries a purchase amount', () => {
    accept()
    trackPurchase(2400, 'premium')
    flush()

    expect(sentBody().events[0]).toMatchObject({
      type: 'PURCHASE',
      valueAmount: 2400,
      label: 'premium',
    })
  })

  it('ignores a click with no label rather than sending an empty one', () => {
    accept()
    trackClick(null)
    flush()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('flushes on its own once a batch fills up', () => {
    accept()
    for (let i = 0; i < 8; i++) trackClick(`c${i}`)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(sentBody().events).toHaveLength(8)
  })

  it('sends with keepalive and no credentials, never as a beacon', () => {
    // A beacon always carries credentials, and the public endpoint refuses a
    // credentialed cross-origin preflight — every page leave logged a CORS
    // error and lost the session's last events. keepalive outlives the page
    // just the same.
    accept()
    trackClick('last-thing')
    flush()

    expect(beaconMock).not.toHaveBeenCalled()
    const [, options] = fetchMock.mock.calls.at(-1)
    expect(options.keepalive).toBe(true)
    expect(options.credentials).toBe('omit')
  })

  it('empties the queue after sending, so nothing is counted twice', () => {
    accept()
    trackPageView('/once')
    flush()
    fetchMock.mockClear()
    flush()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('click labels', () => {
  function el(html) {
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.appendChild(host)
    return host.firstElementChild
  }

  it('prefers an explicit data-track name', () => {
    const node = el('<button data-track="cta-hero">Book now</button>')
    expect(labelFor(node)).toBe('cta-hero')
  })

  it('falls back to the button text on unannotated pages', () => {
    const node = el('<button>  Book   now </button>')
    expect(labelFor(node)).toBe('Book now')
  })

  it('prefers an aria-label over inner text', () => {
    const node = el('<button aria-label="Close dialog"><i class="x"></i></button>')
    expect(labelFor(node)).toBe('Close dialog')
  })

  it('falls back to the href when a link has no text', () => {
    const node = el('<a href="/pricing"><img alt="" /></a>')
    expect(labelFor(node)).toBe('link:/pricing')
  })

  it('reports nothing for a click on plain text', () => {
    const node = el('<p>just words</p>')
    expect(labelFor(node)).toBeNull()
  })

  it('finds the control when the click landed on a child', () => {
    const node = el('<button data-track="cta-hero"><span>Book</span></button>')
    expect(labelFor(node.querySelector('span'))).toBe('cta-hero')
  })
})

describe('never breaks the page', () => {
  it('survives a failing transport', async () => {
    accept()
    fetchMock.mockRejectedValue(new Error('offline'))
    trackPageView('/')
    expect(() => flush()).not.toThrow()
  })

  it('survives a browser that refuses storage', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(consentState()).toBeNull()
    expect(hasConsent()).toBe(false)
    getItem.mockRestore()
  })
})

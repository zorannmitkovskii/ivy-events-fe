import { baseUrl } from '@/services/baseUrl'

/**
 * Site-wide traffic: who came, what they clicked, how long they stayed
 * (IVY-906).
 *
 * <p>Three rules decide everything here.
 *
 * <p>First, consent is read, never assumed, and nothing at all leaves the
 * browser without it. The server refuses unconsented rows anyway; not sending
 * them means a visitor who declined costs neither a request nor a row.
 *
 * <p>Second, nothing personal is sent. The session id is random, belongs to no
 * account and dies with the tab, and the server cuts query strings off paths on
 * the way in — so a share link that carried a token cannot end up in a report.
 *
 * <p>Third, this never breaks a page. Every entry point swallows its own
 * errors. Analytics that can throw is analytics that will eventually take a
 * checkout down with it, and no visitor ever wanted to know that a counter
 * failed.
 */

const CONSENT_KEY = 'cookie_consent'
const SESSION_KEY = 'ivy_site_session'

/** Send when this many pile up, so a long visit does not hold a full batch. */
const FLUSH_AT = 8

/** ...and at least this often, so a reader who never clicks is still counted. */
const FLUSH_EVERY_MS = 15000

const MAX_LABEL = 128

let queue = []
let flushTimer = null
let visibleSince = null
let accumulatedMs = 0
let started = false
let referrerUsed = false

function endpoint() {
  return baseUrl + '/v1/api/public/site-events'
}

// ── consent ────────────────────────────────────────────────────────────────

export function consentState() {
  try {
    return localStorage.getItem(CONSENT_KEY)
  } catch {
    // A browser that refuses storage is a browser that never consented.
    return null
  }
}

export function hasConsent() {
  return consentState() === 'accepted'
}

/**
 * Records the answer the visitor gave.
 *
 * <p>Accepting starts counting from that moment, not retroactively: nothing is
 * held back waiting for permission, so there is nothing to release.
 */
export function setConsent(accepted) {
  try {
    localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'rejected')
  } catch {
    // Without storage the answer cannot be remembered and the visitor will be
    // asked again. That is the safe way round.
  }
  if (accepted) {
    beginTiming()
    trackPageView(currentPath())
  } else {
    queue = []
  }
}

// ── session ────────────────────────────────────────────────────────────────

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 's-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function sessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const fresh = randomId()
    sessionStorage.setItem(SESSION_KEY, fresh)
    return fresh
  } catch {
    return randomId()
  }
}

function currentPath() {
  try {
    return window.location.pathname
  } catch {
    return null
  }
}

function currentLocale() {
  try {
    return localStorage.getItem('locale') || document.documentElement.lang || null
  } catch {
    return null
  }
}

// ── queue ──────────────────────────────────────────────────────────────────

function enqueue(event) {
  if (!hasConsent()) return
  queue.push(event)
  if (queue.length >= FLUSH_AT) flush()
  else scheduleFlush()
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, FLUSH_EVERY_MS)
}

/**
 * Sends what is queued and forgets it.
 *
 * <p>Always `fetch` with `keepalive`, which outlives the page just as
 * `sendBeacon` does — a normal request started during unload is cancelled with
 * the page, and that is exactly when the most interesting event of the visit
 * is sitting in the queue.
 *
 * <p>Not `sendBeacon`: a beacon always carries credentials, and a JSON beacon
 * to another origin needs a preflight that the public endpoint rightly refuses
 * for credentialed requests. The browser then drops the event with a CORS
 * error on every page leave. The analytics need no cookie, so they send none.
 */
export function flush() {
  if (!queue.length || !hasConsent()) return

  const payload = JSON.stringify({
    sessionId: sessionId(),
    consented: true,
    events: queue,
  })
  queue = []

  try {
    fetch(endpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {})
  } catch {
    // Deliberately silent.
  }
}

// ── what gets recorded ─────────────────────────────────────────────────────

export function trackPageView(path, referrer = null) {
  enqueue({
    type: 'PAGE_VIEW',
    path: path ?? currentPath(),
    referrer: referrer ?? referrerOnce(),
    locale: currentLocale(),
  })
}

export function trackClick(label, path = null) {
  if (!label) return
  enqueue({ type: 'CLICK', label, path: path ?? currentPath(), locale: currentLocale() })
}

export function trackPurchase(valueAmount, label = null) {
  enqueue({
    type: 'PURCHASE',
    path: currentPath(),
    label,
    valueAmount: valueAmount ?? null,
    locale: currentLocale(),
  })
}

/**
 * The document referrer, but only for the first view of a visit.
 *
 * <p>After the first navigation document.referrer is our own last page, which
 * would report every visitor as having arrived from us.
 */
function referrerOnce() {
  if (referrerUsed) return null
  referrerUsed = true
  try {
    return document.referrer || null
  } catch {
    return null
  }
}

// ── time on site ───────────────────────────────────────────────────────────

function beginTiming() {
  if (visibleSince === null) visibleSince = Date.now()
}

/** Counts only the time the tab was actually visible. */
function pauseTiming() {
  if (visibleSince === null) return
  accumulatedMs += Date.now() - visibleSince
  visibleSince = null
}

/**
 * Reports the visit so far.
 *
 * <p>Sent on every hide rather than only on close, because a phone that gets
 * locked may never fire another event. The figure is cumulative, so the report
 * takes the largest per session rather than adding them up.
 */
function endVisit() {
  pauseTiming()
  if (accumulatedMs > 0) {
    enqueue({
      type: 'SESSION_END',
      path: currentPath(),
      durationMs: accumulatedMs,
      locale: currentLocale(),
    })
  }
  flush()
}

// ── wiring ─────────────────────────────────────────────────────────────────

/**
 * Derives a label for a click.
 *
 * <p>data-track wins wherever somebody has named the thing. Everything else
 * falls back to the nearest link or button, so a page nobody annotated still
 * reports something useful instead of nothing.
 */
export function labelFor(target) {
  if (!target || typeof target.closest !== 'function') return null

  const tagged = target.closest('[data-track]')
  if (tagged) {
    const named = tagged.getAttribute('data-track')
    return named ? named.slice(0, MAX_LABEL) : null
  }

  const control = target.closest('a, button, [role="button"]')
  if (!control) return null

  const text = (control.getAttribute('aria-label') || control.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text) return text.slice(0, MAX_LABEL)

  const href = control.getAttribute('href')
  return href ? 'link:' + href.slice(0, 120) : null
}

/**
 * Starts tracking. Safe to call once per app.
 *
 * @param router the Vue router, so a view is counted per route rather than per
 *   full page load — this is a single-page app and full loads are rare.
 */
export function installSiteAnalytics(router) {
  if (started || typeof window === 'undefined') return
  started = true

  if (hasConsent()) {
    beginTiming()
    trackPageView(currentPath())
  }

  if (router && typeof router.afterEach === 'function') {
    router.afterEach((to) => {
      const path = to.fullPath ? to.fullPath.split('?')[0] : to.path
      trackPageView(path)
    })
  }

  document.addEventListener(
    'click',
    (event) => {
      try {
        const label = labelFor(event.target)
        if (label) trackClick(label)
      } catch {
        // Never let a counter stop a click from working.
      }
    },
    { capture: true, passive: true },
  )

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') endVisit()
    else beginTiming()
  })

  window.addEventListener('pagehide', endVisit)
}

/** Test seam: forgets everything this module remembers between cases. */
export function resetSiteAnalyticsForTest() {
  queue = []
  flushTimer = null
  visibleSince = null
  accumulatedMs = 0
  started = false
  referrerUsed = false
}

export default function useSiteAnalytics() {
  return { trackPageView, trackClick, trackPurchase, hasConsent, setConsent, consentState }
}

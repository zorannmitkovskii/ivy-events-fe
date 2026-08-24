import { contentService } from '@/services/content.service'

const SESSION_KEY = 'ivy_content_session'
const CONSENT_KEY = 'cookie_consent'

/**
 * The content-to-conversion trail (IVY-905).
 *
 * <p>Two rules decide everything here.
 *
 * <p>First, consent is read, never assumed. Without it the call still goes out
 * and the server keeps a count with no identifier that outlives the request —
 * so declining changes what is stored, not whether the page works.
 *
 * <p>Second, nothing personal is ever sent. The session id is a random string
 * generated in the browser and belongs to no account, which is why a report
 * built from these can be shown to anyone: there is no guest in it to expose.
 */

export function hasConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted'
  } catch {
    // A browser that refuses storage is a browser that never consented.
    return false
  }
}

/**
 * A random id for this browsing session.
 *
 * <p>Kept in sessionStorage, so it dies with the tab. Without consent it is not
 * persisted at all — a per-call value that cannot be joined to anything, which
 * is the point.
 */
export function sessionId() {
  if (!hasConsent()) return randomId()
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

function randomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `s-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

/**
 * Records one step.
 *
 * <p>Never throws and never blocks. Analytics that can break a page is
 * analytics that will eventually break the page, and no reader has ever wanted
 * to know that a counter failed.
 */
export async function track(kind, { postId = null, category = null, locale = null } = {}) {
  try {
    await contentService.recordEvent({
      sessionId: sessionId(),
      consented: hasConsent(),
      kind,
      postId,
      category,
      locale,
    })
  } catch {
    // Deliberately silent.
  }
}

export default function useContentJourney() {
  return { track, hasConsent, sessionId }
}

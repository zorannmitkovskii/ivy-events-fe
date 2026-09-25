import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Which vendor a hostname belongs to (IVY-706).
 *
 * <p>Every approved supplier gets `<slug>.ivyevents.mk` free — the slug is
 * already unique and the platform already owns the parent domain, so there is
 * nothing for them to claim and no DNS record for them to publish.
 *
 * <p>What matters here is what is *not* a vendor. The platform's own names
 * must never resolve to one, and a hostname must name at most one supplier —
 * otherwise a single profile is reachable at unboundedly many addresses, and
 * search engines and analytics both start counting one business as several.
 */

vi.mock('@/services/env', () => ({
  getRuntimeEnv: () => ({ VITE_PLATFORM_DOMAIN: 'ivyevents.mk' }),
}))

const { resolveVendorHost, platformDomain } = await import('@/services/vendorHost')

const realLocation = window.location

function at(hostname) {
  Object.defineProperty(window, 'location', {
    value: { ...realLocation, hostname },
    writable: true,
    configurable: true,
  })
}

beforeEach(() => at('localhost'))
afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: realLocation, writable: true, configurable: true,
  })
})

describe('a vendor subdomain', () => {
  it('reads the slug off the hostname', () => {
    at('studio-lumiere.ivyevents.mk')
    const resolved = resolveVendorHost()

    expect(resolved.slug).toBe('studio-lumiere')
    expect(resolved.viaHost).toBe(true)
    expect(resolved.host).toBe('studio-lumiere.ivyevents.mk')
  })

  it('does not care what case it was typed in', () => {
    at('Studio-Lumiere.IvyEvents.MK')

    expect(resolveVendorHost().slug).toBe('studio-lumiere')
  })
})

describe('what is not a vendor', () => {
  it('leaves the platform itself alone', () => {
    at('ivyevents.mk')

    expect(resolveVendorHost().slug).toBe('')
    expect(resolveVendorHost().viaHost).toBe(false)
  })

  it('refuses the platform\'s own names', () => {
    // `api.ivyevents.mk` is the backend. A vendor whose slug happened to be
    // "api" must not be able to answer for it.
    for (const reserved of ['www', 'api', 'admin', 'app', 'test', 'staging', 'mail', 'cdn']) {
      at(`${reserved}.ivyevents.mk`)
      expect(resolveVendorHost().slug, reserved).toBe('')
    }
  })

  it('refuses more than one label deep', () => {
    // `a.b.ivyevents.mk` is a mistake or a probe. Accepting it would let one
    // supplier be reached at as many addresses as somebody cares to invent.
    at('a.studio-lumiere.ivyevents.mk')

    expect(resolveVendorHost().slug).toBe('')
  })

  it('refuses a domain that merely ends in the same letters', () => {
    at('notivyevents.mk')

    expect(resolveVendorHost().slug).toBe('')
  })
})

describe('local development, where there is no wildcard DNS', () => {
  it('takes the slug from the path instead', () => {
    at('localhost')
    const resolved = resolveVendorHost('studio-lumiere')

    expect(resolved.slug).toBe('studio-lumiere')
    expect(resolved.viaHost).toBe(false)
  })

  it('still asks the server about the hostname it would have seen', () => {
    // The backend resolves by Host. Handing it `localhost` would find nobody.
    at('localhost')

    expect(resolveVendorHost('studio-lumiere').host).toBe('studio-lumiere.ivyevents.mk')
  })

  it('reports no vendor when the path carries no slug either', () => {
    at('localhost')

    expect(resolveVendorHost().slug).toBe('')
  })
})

describe('the platform domain', () => {
  it('comes from configuration, with the production name as the default', () => {
    expect(platformDomain()).toBe('ivyevents.mk')
  })
})

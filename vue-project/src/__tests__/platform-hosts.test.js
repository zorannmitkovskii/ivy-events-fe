import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Where the app finds its backends when it is opened on a site address.
 *
 * <p>Production serves app and sites from ivyevents.mk; test from test.ivyevents.mk.
 *
 * <p>Invitations, vendor microsites and agency sites are served one label under
 * the platform domain. Without these rules a page on `ana-marko.ivyevents.mk`
 * asked `https://ana-marko.ivyevents.mk:8282` for its data and stayed empty.
 */

function at(hostname) {
  vi.stubGlobal('location', { hostname, protocol: 'https:', origin: `https://${hostname}` })
}

async function fresh(path) {
  vi.resetModules()
  return import(path)
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete window.__ENV__
})

describe('platformRootOf', () => {
  it.each([
    ['ivyevents.mk', 'ivyevents.mk'],
    ['ana-marko.ivyevents.mk', 'ivyevents.mk'],
    ['www.ivyevents.mk', 'ivyevents.mk'],
    ['test.ivyevents.mk', 'test.ivyevents.mk'],
    ['ana-marko.test.ivyevents.mk', 'test.ivyevents.mk'],
    ['ANA-MARKO.IVYEVENTS.MK', 'ivyevents.mk'],
  ])('%s belongs to %s', async (host, root) => {
    const { platformRootOf } = await fresh('@/services/env')
    expect(platformRootOf(host)).toBe(root)
  })

  it.each(['a.b.ivyevents.mk', 'x.y.test.ivyevents.mk', 'dev.ivyevents.mk', 'evil-ivyevents.mk', 'ivyevents.mk.example.com', 'localhost'])(
    '%s belongs to neither',
    async (host) => {
      const { platformRootOf } = await fresh('@/services/env')
      expect(platformRootOf(host)).toBeNull()
    },
  )
})

describe('the environment and its backends, by the address the page is on', () => {
  it.each([
    ['ivyevents.mk', 'prod', 'https://api.ivyevents.mk', 'https://iam.ivyevents.mk', 'https://auth.ivyevents.mk'],
    ['ana-marko.ivyevents.mk', 'prod', 'https://api.ivyevents.mk', 'https://iam.ivyevents.mk', 'https://auth.ivyevents.mk'],
    ['test.ivyevents.mk', 'test', 'https://api.test.ivyevents.mk', 'https://iam.test.ivyevents.mk', 'https://auth.test.ivyevents.mk'],
    ['ana-marko.test.ivyevents.mk', 'test', 'https://api.test.ivyevents.mk', 'https://iam.test.ivyevents.mk', 'https://auth.test.ivyevents.mk'],
  ])('%s → %s', async (host, env, api, iam, auth) => {
    at(host)
    window.__ENV__ = { APP_ENV: '${APP_ENV}' }

    const envModule = await fresh('@/services/env')
    expect(envModule.detectDefaultEnvFromLocation()).toBe(env)
    expect(envModule.computeKeycloakBaseUrl(env)).toBe(auth)
    expect((await fresh('@/services/baseUrl')).baseUrl).toBe(api)
    expect((await fresh('@/services/iamBaseUrl')).iamBaseUrl).toBe(iam)
  })

  it.each([
    ['ivyevents.mk', 'ivyevents.mk'],
    ['ana-marko.ivyevents.mk', 'ivyevents.mk'],
    ['test.ivyevents.mk', 'test.ivyevents.mk'],
    ['ana-marko.test.ivyevents.mk', 'test.ivyevents.mk'],
    ['localhost', 'ivyevents.mk'],
  ])('on %s the sites live under %s, with nothing configured', async (host, domain) => {
    at(host)
    expect((await fresh('@/services/vendorHost')).platformDomain()).toBe(domain)
  })

  it('an explicit platform domain still wins', async () => {
    at('localhost')
    window.__ENV__ = { VITE_PLATFORM_DOMAIN: 'staging.example.mk' }
    expect((await fresh('@/services/vendorHost')).platformDomain()).toBe('staging.example.mk')
  })

  it('leaves local development alone', async () => {
    at('localhost')
    const envModule = await fresh('@/services/env')
    expect(envModule.detectDefaultEnvFromLocation()).toBe('local')
    expect(envModule.computeKeycloakBaseUrl('local')).toBe('http://localhost:8181')
  })
})

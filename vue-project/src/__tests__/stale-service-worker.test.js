import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerServiceWorker, unregisterStaleWorkers } from '@/services/pwa'

/**
 * The stale worker problem (IVY-1202).
 *
 * <p>Stopping the containerised frontend and starting Vite on the same port
 * leaves the production build's service worker registered on that origin. It
 * keeps answering navigations from its precache, so the dev server's code is
 * served and never seen — every edit looks like it did nothing.
 *
 * <p>That is not a theoretical failure. It cost an afternoon of "your fix does
 * not work" before anyone thought to look at the worker, which is exactly why
 * it is pinned here.
 */

function stubServiceWorker({ registrations = [], controlled = false } = {}) {
  const unregister = vi.fn().mockResolvedValue(true)
  const deleted = []

  globalThis.navigator.serviceWorker = {
    getRegistrations: vi.fn().mockResolvedValue(registrations.map(() => ({ unregister }))),
    controller: controlled ? {} : null,
  }
  globalThis.caches = {
    keys: vi.fn().mockResolvedValue(['workbox-precache-v2-http://localhost:5173/', 'ivy-checkin-data']),
    delete: vi.fn((name) => { deleted.push(name); return Promise.resolve(true) }),
  }

  return { unregister, deleted }
}

beforeEach(() => {
  vi.restoreAllMocks()
  delete globalThis.navigator.serviceWorker
  delete globalThis.caches
})

describe('unregisterStaleWorkers', () => {
  it('removes every registration left on the origin', async () => {
    const { unregister } = stubServiceWorker({ registrations: [1, 2] })

    await unregisterStaleWorkers()

    expect(unregister).toHaveBeenCalledTimes(2)
  })

  it('clears the precache too — unregistering alone leaves the old bundle behind', async () => {
    const { deleted } = stubServiceWorker({ registrations: [1] })

    await unregisterStaleWorkers()

    expect(deleted).toContain('workbox-precache-v2-http://localhost:5173/')
  })

  it('does nothing when the origin is clean', async () => {
    const { unregister } = stubServiceWorker({ registrations: [] })

    await expect(unregisterStaleWorkers()).resolves.toBeNull()
    expect(unregister).not.toHaveBeenCalled()
  })

  it('survives a browser that refuses to enumerate registrations', async () => {
    globalThis.navigator.serviceWorker = {
      getRegistrations: vi.fn().mockRejectedValue(new Error('nope')),
      controller: null,
    }

    await expect(unregisterStaleWorkers()).resolves.toBeNull()
  })
})

describe('registerServiceWorker in development', () => {
  it('cleans up instead of registering — the dev build ships no worker', async () => {
    const { unregister } = stubServiceWorker({ registrations: [1] })

    // Vitest runs with import.meta.env.DEV true, which is the branch under test.
    await registerServiceWorker()

    expect(unregister).toHaveBeenCalledTimes(1)
  })

  it('returns null rather than an update function when there is nothing to update', async () => {
    stubServiceWorker({ registrations: [] })
    await expect(registerServiceWorker()).resolves.toBeNull()
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createAutosave, isNetworkError, SAVE_STATUS } from '@/composables/useAutosave'
import SaveStatus from '@/components/invitations/shared/SaveStatus.vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * IVY-INV-301 — the invitation editor's save status.
 *
 * <p>What matters is what the status claims. "Saved to your account" must
 * only appear after the server said so; a failure must keep the local copy
 * and offer a retry; and a retry must never run beside another save, because
 * two overlapping full saves are how an event's sections get written twice.
 */

function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function networkError() {
  return new Error('Network Error')
}

function serverError() {
  return Object.assign(new Error('HTTP 500'), { status: 500 })
}

describe('createAutosave', () => {
  let state
  let local
  let sync
  let online

  function make(overrides = {}) {
    return createAutosave({
      snapshot: () => ({ payload: { ...state } }),
      persistLocal: (snap) => { local.push(snap.payload) },
      clearLocal: () => { local.length = 0 },
      sync: (snap) => sync(snap),
      canSync: () => true,
      isOnline: () => online,
      debounceMs: 1000,
      ...overrides,
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    state = { name: 'Ана & Марко' }
    local = []
    online = true
    sync = vi.fn().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces a burst of changes into one save', async () => {
    const autosave = make()
    for (let i = 0; i < 10; i++) {
      state.name = 'Ана & Марко ' + i
      autosave.schedule()
      await vi.advanceTimersByTimeAsync(200)
    }
    expect(sync).not.toHaveBeenCalled()
    expect(autosave.status.value).toBe(SAVE_STATUS.SAVING)

    await vi.advanceTimersByTimeAsync(1000)
    expect(sync).toHaveBeenCalledTimes(1)
    expect(sync.mock.calls[0][0].payload.name).toBe('Ана & Марко 9')
  })

  it('shows "synced" only after the server answered', async () => {
    const answer = deferred()
    sync.mockReturnValueOnce(answer.promise)
    const autosave = make()

    autosave.schedule()
    await vi.advanceTimersByTimeAsync(1000)
    expect(sync).toHaveBeenCalledTimes(1)
    expect(autosave.status.value).toBe(SAVE_STATUS.SAVING)
    expect(autosave.lastSyncedAt.value).toBeNull()

    answer.resolve({ ok: true })
    await vi.advanceTimersByTimeAsync(0)
    expect(autosave.status.value).toBe(SAVE_STATUS.SYNCED)
    expect(autosave.lastSyncedAt.value).toBeInstanceOf(Date)
  })

  it('keeps the local copy and offers retry when the server fails', async () => {
    sync.mockRejectedValueOnce(serverError())
    const autosave = make()

    autosave.schedule()
    await vi.advanceTimersByTimeAsync(1000)

    expect(autosave.status.value).toBe(SAVE_STATUS.ERROR)
    expect(local).toEqual([{ name: 'Ана & Марко' }])

    const outcome = await autosave.retry()
    expect(outcome.synced).toBe(true)
    expect(autosave.status.value).toBe(SAVE_STATUS.SYNCED)
    // Confirmed by the server — the local copy is no longer needed.
    expect(local).toEqual([])
  })

  it('says offline when the request never got an answer, and resyncs when the network returns', async () => {
    sync.mockRejectedValueOnce(networkError())
    const autosave = make()
    autosave.start()

    autosave.schedule()
    await vi.advanceTimersByTimeAsync(1000)
    expect(autosave.status.value).toBe(SAVE_STATUS.OFFLINE)
    expect(local).toHaveLength(1)

    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledTimes(2)
    expect(autosave.status.value).toBe(SAVE_STATUS.SYNCED)
    autosave.dispose()
  })

  it('does not even try the server while the browser is offline', async () => {
    online = false
    const autosave = make()
    autosave.schedule()
    await vi.advanceTimersByTimeAsync(1000)
    expect(sync).not.toHaveBeenCalled()
    expect(autosave.status.value).toBe(SAVE_STATUS.OFFLINE)
    expect(local).toHaveLength(1)
  })

  it('saves locally only when it cannot sync (guest)', async () => {
    const autosave = make({ canSync: () => false })
    autosave.schedule()
    await vi.advanceTimersByTimeAsync(1000)
    expect(sync).not.toHaveBeenCalled()
    expect(autosave.status.value).toBe(SAVE_STATUS.LOCAL)
    expect(local).toHaveLength(1)
  })

  it('never runs two saves at once — repeated retries join the running one', async () => {
    const first = deferred()
    sync.mockReturnValueOnce(first.promise)
    const autosave = make()

    const a = autosave.flush()
    const b = autosave.retry()
    const c = autosave.retry()
    await vi.advanceTimersByTimeAsync(0)
    expect(sync).toHaveBeenCalledTimes(1)

    first.resolve({ ok: true })
    await Promise.all([a, b, c])
    // One follow-up for the calls that arrived meanwhile, not one each.
    expect(sync).toHaveBeenCalledTimes(2)
  })

  it('a change made during a save is not reported as synced until it is sent', async () => {
    const first = deferred()
    sync.mockReturnValueOnce(first.promise)
    const autosave = make()

    autosave.flush()
    await vi.advanceTimersByTimeAsync(0)
    state.name = 'Changed meanwhile'
    autosave.schedule()

    first.resolve({ ok: true })
    await vi.advanceTimersByTimeAsync(0)
    expect(autosave.status.value).toBe(SAVE_STATUS.SAVING)
    // The local copy of the newer change is kept.
    expect(local).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(1000)
    expect(sync).toHaveBeenCalledTimes(2)
    expect(sync.mock.calls[1][0].payload.name).toBe('Changed meanwhile')
    expect(autosave.status.value).toBe(SAVE_STATUS.SYNCED)
  })

  it('retry can send a snapshot left by an earlier visit', async () => {
    const autosave = make()
    autosave.markLocal()
    expect(autosave.status.value).toBe(SAVE_STATUS.LOCAL)

    await autosave.retry({ snapshot: () => ({ payload: { name: 'from before' }, restored: true }) })
    expect(sync.mock.calls[0][0].payload).toEqual({ name: 'from before' })
    expect(autosave.status.value).toBe(SAVE_STATUS.SYNCED)
  })
})

describe('isNetworkError', () => {
  it('tells a lost request from a server answer', () => {
    expect(isNetworkError(new Error('Network Error'))).toBe(true)
    expect(isNetworkError(new Error('timeout of 30000ms exceeded'))).toBe(true)
    expect(isNetworkError(serverError())).toBe(false)
    expect(isNetworkError(Object.assign(new Error('Conflict'), { name: 'ApiError', status: 409 }))).toBe(false)
  })
})

describe('SaveStatus', () => {
  function mountStatus(props, locale = 'en') {
    const i18n = createI18n({ legacy: false, locale, fallbackLocale: 'en', messages: { en, mk, sq } })
    return mount(SaveStatus, { props, global: { plugins: [i18n] } })
  }

  it.each([
    ['saving', null, 'Saving…'],
    ['local', 'guest', 'Saved on this device. Sign up to keep it in your account.'],
    ['local', 'notCreated', 'Saved on this device. Press Save to create the event in your account.'],
    ['synced', null, 'Saved to your account'],
    ['offline', null, "You're offline. Your changes are saved on this device and will sync when you're back online."],
    ['error', null, "Couldn't save to your account. Your changes are kept on this device."],
  ])('%s (%s) reads correctly', (status, detail, text) => {
    const wrapper = mountStatus({ status, detail })
    expect(wrapper.get('[role="status"]').text()).toBe(text)
    expect(wrapper.attributes('data-status')).toBe(status)
  })

  it('offers retry only where a retry means something', async () => {
    for (const status of ['error', 'offline']) {
      const wrapper = mountStatus({ status })
      await wrapper.get('[data-testid="save-status-retry"]').trigger('click')
      expect(wrapper.emitted('retry')).toHaveLength(1)
    }
    for (const status of ['saving', 'synced']) {
      expect(mountStatus({ status }).find('[data-testid="save-status-retry"]').exists()).toBe(false)
    }
    expect(mountStatus({ status: 'local', detail: 'guest' }).find('[data-testid="save-status-retry"]').exists()).toBe(false)
    expect(mountStatus({ status: 'local', detail: 'previous' }).find('[data-testid="save-status-retry"]').text()).toBe('Sync now')
  })

  it('keeps the live region mounted while idle so the first status is announced', () => {
    const wrapper = mountStatus({ status: 'idle' })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.get('[role="status"]').text()).toBe('')
  })

  it('is localised in mk and sq', () => {
    expect(mountStatus({ status: 'synced' }, 'mk').get('[role="status"]').text()).toBe('Зачувано на сметката')
    expect(mountStatus({ status: 'offline' }, 'sq').get('[role="status"]').text()).toContain('Jeni jashtë linje')
  })
})

describe('the three locales carry every save-status message', () => {
  it('has the same keys in mk, en and sq', () => {
    const keys = (o) => Object.keys(o.editSection.saveStatus).sort()
    expect(keys(mk)).toEqual(keys(en))
    expect(keys(sq)).toEqual(keys(en))
    for (const lang of [en, mk, sq]) {
      for (const v of Object.values(lang.editSection.saveStatus)) expect(v.trim()).not.toBe('')
    }
  })
})

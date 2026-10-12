import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h } from 'vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-701 — the success screen after publishing (paying in CPay).
 *
 * "Published" is shown only when the server confirms the payment SUCCEEDED and
 * the event is ACTIVE (`GET /v1/api/payments/{ref}/publication`) — never from
 * the redirect (which since CPay round 2 carries only `?ref=`). Until then: "confirming", polling, and
 * when it is late a manual check — never a fake success. The public link is
 * only the event's own guest link, never the private or an editor address.
 */

const getPublication = vi.fn()
const apiGet = vi.fn()
const apiPost = vi.fn()
const publicGet = vi.fn()
let signedIn = true

vi.mock('@/services/api', () => ({
  api: { get: (...a) => apiGet(...a), post: (...a) => apiPost(...a) },
  default: {},
}))
vi.mock('@/services/backendApi', () => ({ default: { get: (...a) => publicGet(...a) } }))
vi.mock('@/services/auth.service', () => ({ isAuthenticated: () => signedIn }))

const { publishOutcome, safePublicUrl, editorLocation, paymentReturnRef, CONFIRM_POLL_DELAYS } =
  await import('@/utils/publishOutcome')
const { cpayService } = await import('@/services/cpay.service')
const { usePublishConfirmation } = await import('@/composables/usePublishConfirmation')
const { onboardingStore, setEventId, setEventStatus } = await import('@/store/onboarding.store')
const PaymentResultPage = (await import('@/pages/PaymentResultPage.vue')).default
const PublishedInvitation = (await import('@/components/payment/PublishedInvitation.vue')).default

const EVENT = '7b0c9d2e-1f3a-4b5c-8d6e-9f0a1b2c3d4e'
const PUBLIC = `https://ivyevents.mk/mk/invitations/persian-wedding?eventId=${EVENT}`

const pending = { paymentStatus: 'PENDING', eventId: EVENT, eventStatus: 'PENDING', published: false, publicUrl: null, design: 'persian-wedding' }
const published = { paymentStatus: 'SUCCESS', eventId: EVENT, eventStatus: 'ACTIVE', published: true, publicUrl: PUBLIC, design: 'persian-wedding' }

function makeI18n(locale = 'en') {
  return createI18n({ legacy: false, locale, messages: { en, mk, sq } })
}

function makeRouter() {
  const Stub = { template: '<div />' }
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:lang/payment/result', name: 'PaymentResult', component: PaymentResultPage },
      { path: '/:lang/auth/login', name: 'login', component: Stub },
      { path: '/:lang/invitations/:design', name: 'weddingInvitation', component: Stub },
      { path: '/:lang/dashboard/events/overview', name: 'dashboard.overview', component: Stub },
      { path: '/:lang/dashboard/events/packages', name: 'dashboard.packages', component: Stub },
      { path: '/:lang/dashboard/events/invitation-links', name: 'dashboard.invitation-links', component: Stub },
      { path: '/:lang/dashboard/events/guests', name: 'dashboard.guests', component: Stub },
    ],
  })
}

async function mountPage(query = { ref: 'ab12cd34ef' }, locale = 'en') {
  const router = makeRouter()
  await router.push({ name: 'PaymentResult', params: { lang: locale }, query })
  await router.isReady()
  const App = defineComponent({ render: () => h(PaymentResultPage) })
  const wrapper = mount(App, { global: { plugins: [router, makeI18n(locale)] }, attachTo: document.body })
  return { wrapper, router }
}

const $ = (w, id) => w.find(`[data-testid="${id}"]`)

beforeEach(() => {
  vi.useFakeTimers()
  signedIn = true
  getPublication.mockReset()
  apiGet.mockReset()
  apiPost.mockReset()
  publicGet.mockReset()
  apiGet.mockImplementation((path) => getPublication(path))
  setEventId('')
  setEventStatus('')
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('what the server answer means', () => {
  it('published only for SUCCESS + published; waiting stays waiting; failures end it', () => {
    expect(publishOutcome(published)).toBe('published')
    expect(publishOutcome(pending)).toBe('confirming')
    // Paid, but the event has not turned ACTIVE yet — still not a success.
    expect(publishOutcome({ ...pending, paymentStatus: 'SUCCESS' })).toBe('confirming')
    expect(publishOutcome({ ...pending, paymentStatus: 'SUCCESS', eventStatus: 'DRAFT' })).toBe('confirming')
    // Event live from before, this payment still pending — not this payment's success.
    expect(publishOutcome({ ...published, paymentStatus: 'PENDING', published: false })).toBe('confirming')
    for (const s of ['FAILED', 'CANCELED', 'EXPIRED']) {
      expect(publishOutcome({ ...pending, paymentStatus: s })).toBe('failed')
    }
    // A payment that publishes no invitation (no event / gallery).
    expect(publishOutcome({ paymentStatus: 'SUCCESS', eventId: null, published: false })).toBe('paid')
    expect(publishOutcome({ paymentStatus: 'SUCCESS', eventId: EVENT, eventStatus: 'ACTIVE', published: false })).toBe('paid')
    expect(publishOutcome(null)).toBe('confirming')
  })

  it('the public link is only this event\'s guest link — never private, editor, another event or another page', () => {
    expect(safePublicUrl(PUBLIC, EVENT)).toBe(PUBLIC)
    expect(safePublicUrl(`/mk/invitations/persian-wedding?eventId=${EVENT}`, EVENT, 'https://ivyevents.mk'))
      .toBe(PUBLIC)
    for (const bad of [
      `https://ivyevents.mk/mk/invitations/persian-wedding/private?eventId=${EVENT}`,
      `https://ivyevents.mk/mk/invitations/persian-wedding?edit=true&eventId=${EVENT}`,
      `https://ivyevents.mk/mk/invitations/persian-wedding?eventId=${EVENT}&edit=true`,
      'https://ivyevents.mk/mk/invitations/persian-wedding?eventId=other',
      `https://ivyevents.mk/mk/dashboard/events/overview?eventId=${EVENT}`,
      `https://ivyevents.mk/mk/invitations/persian-wedding?eventId=${EVENT}#admin`,
      `javascript:alert(1)//mk/invitations/x?eventId=${EVENT}`,
      '', null, 42,
    ]) {
      expect(safePublicUrl(bad, EVENT)).toBe('')
    }
    expect(safePublicUrl(PUBLIC, '')).toBe('')
  })

  it('the editor address and the CPay return reference', () => {
    expect(editorLocation('mk', 'persian-wedding', EVENT))
      .toEqual({ path: '/mk/invitations/persian-wedding', query: { edit: 'true', eventId: EVENT } })
    expect(editorLocation('mk', '', EVENT)).toBe('')
    expect(paymentReturnRef({ name: 'dashboard.overview', query: { ref: 'ab12cd34ef' } })).toBe('ab12cd34ef')
    // A link from before CPay round 2 (13) still carries status=; it is ignored.
    expect(paymentReturnRef({ name: 'dashboard.overview', query: { status: 'success', ref: 'ab12cd34ef' } })).toBe('ab12cd34ef')
    expect(paymentReturnRef({ name: 'dashboard.overview', query: {} })).toBe('')
    expect(paymentReturnRef({ name: 'dashboard.overview', query: { ref: '<script>' } })).toBe('')
    expect(paymentReturnRef({ name: 'dashboard.guests', query: { ref: 'ab12cd34ef' } })).toBe('')
  })
})

describe('cpay.service', () => {
  it('starts the payment with the organizer\'s token (token client at the API root) and asks for the publication signed in', async () => {
    apiPost.mockResolvedValue({ paymentUrl: 'https://cpay', fields: {} })
    await cpayService.initPayment({ eventId: EVENT })
    const [path, body, config] = apiPost.mock.calls[0]
    expect(path).toBe('/api/cpay/init')
    expect(body).toEqual({ eventId: EVENT })
    expect(typeof config.baseURL).toBe('string')
    expect(config.baseURL.endsWith('/v1/api')).toBe(false)

    apiGet.mockResolvedValue(published)
    await cpayService.getPublication('ab12cd34ef')
    expect(apiGet).toHaveBeenLastCalledWith('/payments/ab12cd34ef/publication')

    publicGet.mockResolvedValue({ data: 'PENDING' })
    await cpayService.getPaymentStatus('ab12cd34ef')
    expect(publicGet).toHaveBeenCalledWith('/api/payments/ab12cd34ef/status')
  })
})

describe('usePublishConfirmation', () => {
  function run(answers) {
    const fetch = vi.fn()
    for (const a of answers) {
      if (a instanceof Error) fetch.mockRejectedValueOnce(a)
      else fetch.mockResolvedValueOnce(a)
    }
    let api
    mount(defineComponent({
      setup() { api = usePublishConfirmation('ab12cd34ef', { fetchPublication: fetch }); return () => null },
    }))
    return { api, fetch }
  }

  it('keeps confirming while the callback has not arrived, then turns published only on the server\'s word', async () => {
    const { api, fetch } = run([pending, { ...pending, paymentStatus: 'SUCCESS' }, published])
    api.check()
    await flushPromises()
    expect(api.phase.value).toBe('confirming')
    await vi.advanceTimersByTimeAsync(CONFIRM_POLL_DELAYS[0])
    expect(api.phase.value).toBe('confirming')
    await vi.advanceTimersByTimeAsync(CONFIRM_POLL_DELAYS[1])
    expect(api.phase.value).toBe('published')
    expect(fetch).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(60000)
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('says "late" (never success or failure) when the checks run out, and a manual check goes on', async () => {
    const answers = Array(CONFIRM_POLL_DELAYS.length + 1).fill(pending)
    const { api, fetch } = run([...answers, published])
    api.check()
    await vi.advanceTimersByTimeAsync(CONFIRM_POLL_DELAYS.reduce((a, b) => a + b, 0) + 10)
    expect(api.phase.value).toBe('slow')
    expect(fetch).toHaveBeenCalledTimes(CONFIRM_POLL_DELAYS.length + 1)
    await api.check()
    expect(api.phase.value).toBe('published')
  })

  it('a check that fails several times in a row is an error with a retry; 403 and 404 are named', async () => {
    const boom = Object.assign(new Error('Network Error'), {})
    const { api } = run([boom, boom, boom, published])
    api.check()
    await vi.advanceTimersByTimeAsync(CONFIRM_POLL_DELAYS[0] + CONFIRM_POLL_DELAYS[1] + 10)
    expect(api.phase.value).toBe('error')
    await api.check()
    expect(api.phase.value).toBe('published')

    const forbidden = run([Object.assign(new Error('no'), { status: 403 })])
    await forbidden.api.check()
    expect(forbidden.api.phase.value).toBe('forbidden')
    const missing = run([Object.assign(new Error('no'), { status: 404 })])
    await missing.api.check()
    expect(missing.api.phase.value).toBe('notFound')
  })
})

describe('PaymentResultPage', () => {
  it('back from CPay (only ?ref=) while the server still says PENDING → "confirming", no link, no success', async () => {
    getPublication.mockResolvedValue(pending)
    const { wrapper } = await mountPage()
    await flushPromises()
    expect(getPublication).toHaveBeenCalledWith('/payments/ab12cd34ef/publication')
    expect($(wrapper, 'payment-result-title').text()).toBe('Confirming publication')
    expect(wrapper.find('[role="status"]').text()).toContain('waiting for our server')
    expect($(wrapper, 'publish-success').exists()).toBe(false)
    expect($(wrapper, 'open-guest-list').exists()).toBe(false)
    expect($(wrapper, 'public-url').exists()).toBe(false)
    expect($(wrapper, 'open-invitation').exists()).toBe(false)
    wrapper.unmount()
  })

  it('when the server confirms: status, public link, Open invitation (new tab) and Continue editing', async () => {
    getPublication.mockResolvedValueOnce(pending).mockResolvedValue(published)
    const { wrapper } = await mountPage()
    await flushPromises()
    await vi.advanceTimersByTimeAsync(CONFIRM_POLL_DELAYS[0])
    await flushPromises()

    expect($(wrapper, 'payment-result-title').text()).toBe('Your invitation is published')
    expect($(wrapper, 'publish-status').text()).toContain('Status: Published')
    const field = $(wrapper, 'public-url')
    expect(field.element.value).toBe(PUBLIC)
    expect(field.attributes('readonly')).toBeDefined()
    expect(wrapper.find('label[for="published-link"]').text()).toBe('Public invitation link')
    const open = $(wrapper, 'open-invitation')
    expect(open.attributes('href')).toBe(PUBLIC)
    expect(open.attributes('target')).toBe('_blank')
    expect(open.attributes('rel')).toContain('noopener')
    expect(open.text()).toContain('(opens in a new tab)')
    expect($(wrapper, 'continue-editing').attributes('href'))
      .toBe(`/en/invitations/persian-wedding?edit=true&eventId=${EVENT}`)
    // Never an editor or private address as the public link.
    expect(wrapper.html()).not.toContain('/private')
    expect(document.activeElement).toBe($(wrapper, 'payment-result-title').element)
    expect(onboardingStore.eventId).toBe(EVENT)
    expect(onboardingStore.eventStatus).toBe('ACTIVE')
    // INV-703: where the replies appear — the guest list of exactly this event.
    expect($(wrapper, 'open-guest-list').attributes('href')).toBe(`/en/dashboard/events/guests?eventId=${EVENT}`)
    wrapper.unmount()
  })

  it('a link the client does not accept is not shown; the page points to the invitation links instead', async () => {
    getPublication.mockResolvedValue({ ...published, publicUrl: `https://ivyevents.mk/mk/invitations/persian-wedding/private?eventId=${EVENT}` })
    const { wrapper } = await mountPage()
    await flushPromises()
    expect($(wrapper, 'publish-success').exists()).toBe(true)
    expect($(wrapper, 'public-url').exists()).toBe(false)
    expect($(wrapper, 'open-invitation').exists()).toBe(false)
    expect($(wrapper, 'public-url-missing').text()).toContain('Invitation links')
    wrapper.unmount()
  })

  it('a failed payment: not published, the draft is kept, retry goes to this event\'s packages', async () => {
    getPublication.mockResolvedValue({ ...pending, paymentStatus: 'FAILED', eventStatus: 'DRAFT' })
    const { wrapper, router } = await mountPage({ status: 'failed', ref: 'ab12cd34ef' })
    await flushPromises()
    expect($(wrapper, 'payment-result-title').text()).toBe('Invitation not published')
    expect($(wrapper, 'payment-result-desc').text()).toContain("The payment didn't go through. Your invitation is saved")
    expect($(wrapper, 'payment-result-desc').text()).toContain('saved exactly as you left it')
    expect($(wrapper, 'publish-success').exists()).toBe(false)
    expect($(wrapper, 'open-guest-list').exists()).toBe(false)
    expect($(wrapper, 'failed-continue-editing').attributes('href'))
      .toBe(`/en/invitations/persian-wedding?edit=true&eventId=${EVENT}`)
    await $(wrapper, 'retry-payment').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('dashboard.packages')
    expect(onboardingStore.eventId).toBe(EVENT)
    wrapper.unmount()
  })

  it('a late confirmation shows "still waiting" with a manual check — and still no success', async () => {
    getPublication.mockResolvedValue(pending)
    const { wrapper } = await mountPage()
    await vi.advanceTimersByTimeAsync(CONFIRM_POLL_DELAYS.reduce((a, b) => a + b, 0) + 10)
    await flushPromises()
    expect($(wrapper, 'payment-result-title').text()).toBe('Still waiting for confirmation')
    expect($(wrapper, 'publish-success').exists()).toBe(false)
    expect($(wrapper, 'open-guest-list').exists()).toBe(false)
    getPublication.mockResolvedValue(published)
    await $(wrapper, 'check-again').trigger('click')
    await flushPromises()
    expect($(wrapper, 'payment-result-title').text()).toBe('Your invitation is published')
    wrapper.unmount()
  })

  it('a check that keeps failing is an error with Try again, not a payment failure', async () => {
    getPublication.mockRejectedValue(new Error('Network Error'))
    const { wrapper } = await mountPage()
    await vi.advanceTimersByTimeAsync(10000)
    await flushPromises()
    expect($(wrapper, 'payment-result-title').text()).toBe("We couldn't check the payment")
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect($(wrapper, 'check-again').text()).toBe('Try again')
    expect($(wrapper, 'retry-payment').exists()).toBe(false)
    wrapper.unmount()
  })

  it('signed out: nothing is asked, sign-in leads back here with the reference', async () => {
    signedIn = false
    const { wrapper } = await mountPage()
    await flushPromises()
    expect(getPublication).not.toHaveBeenCalled()
    expect($(wrapper, 'payment-result-title').text()).toBe('Sign in to see your invitation')
    const href = $(wrapper, 'payment-sign-in').attributes('href')
    expect(decodeURIComponent(href)).toContain('/en/payment/result?ref=ab12cd34ef')
    wrapper.unmount()
  })

  it('renders in Macedonian', async () => {
    getPublication.mockResolvedValue(published)
    const { wrapper } = await mountPage(undefined, 'mk')
    await flushPromises()
    expect($(wrapper, 'payment-result-title').text()).toBe('Вашата покана е објавена')
    expect($(wrapper, 'open-invitation').text()).toContain('Отвори ја поканата')
    expect($(wrapper, 'continue-editing').text()).toBe('Продолжи со уредување')
    wrapper.unmount()
  })
})

describe('PublishedInvitation extension points', () => {
  it('INV-702 (#share) gets the public link and INV-703 (#next) the event id', () => {
    const router = makeRouter()
    const wrapper = mount(PublishedInvitation, {
      props: { publicUrl: PUBLIC, eventId: EVENT, editTo: editorLocation('en', 'persian-wedding', EVENT) },
      slots: {
        share: '<template #share="{ publicUrl }"><span data-testid="share-slot">{{ publicUrl }}</span></template>',
        next: '<template #next="{ eventId }"><span data-testid="next-slot">{{ eventId }}</span></template>',
      },
      global: { plugins: [router, makeI18n()] },
    })
    expect($(wrapper, 'share-slot').text()).toBe(PUBLIC)
    expect($(wrapper, 'next-slot').text()).toBe(EVENT)
  })
})

describe('i18n', () => {
  it('cpay.publish has the same keys in mk, en and sq, none empty', () => {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
      typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`])
    const enKeys = keys(en.cpay.publish).sort()
    expect(keys(mk.cpay.publish).sort()).toEqual(enKeys)
    expect(keys(sq.cpay.publish).sort()).toEqual(enKeys)
    for (const locale of [en, mk, sq]) {
      for (const k of enKeys) {
        const v = k.split('.').reduce((o, part) => o[part], locale.cpay.publish)
        expect(typeof v === 'string' && v.trim().length > 0).toBe(true)
        expect(v).not.toMatch(/[|@{}]/)
      }
    }
  })
})

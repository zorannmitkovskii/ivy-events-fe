import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * INV-603 — confirming the public link and RSVP when publishing.
 *
 * Publishing is paying for the package (INV-601). The server now also refuses
 * an invitation without this event's public guest link or with an RSVP
 * deadline it cannot read, answers 409 for an event that is already published
 * (nothing new to buy — no second charge) and 403 for somebody else's event.
 * In every refusal nothing is charged and the cart and the draft stay, so
 * checkout again is a safe retry. The editor never sends a status: ACTIVE is
 * set by the payment only.
 */

const initPayment = vi.fn()
vi.mock('@/services/cpay.service', () => ({ cpayService: { initPayment: (...a) => initPayment(...a) } }))
const getById = vi.fn()
vi.mock('@/services/events.service', () => ({ eventsService: { getById: (...a) => getById(...a) } }))
vi.mock('@/services/package.service', () => ({
  packageService: {
    listByCategory: async () => [
      { id: 'p1', packageType: 'INV_PRO', name: 'Pro', price: 1500, currency: 'MKD', features: [] },
    ],
  },
}))
vi.mock('@/services/auth.service', () => ({
  getUserId: () => 'u1',
  getPackages: () => [],
  isAuthenticated: () => true,
  getUsername: () => 'ana',
  getEventId: () => null,
  hasRole: () => false,
}))
vi.mock('@/composables/useAuthUser', async () => {
  const { ref } = await import('vue')
  return { useAuthUser: () => ({ user: ref({ email: 'a@b.c' }), eventId: ref('ev-1') }) }
})
const redirect = vi.fn()
vi.mock('@/utils/redirectToCpay', () => ({ redirectToCpay: (...a) => redirect(...a) }))

const {
  serverPublishProblems, fixTarget, prePublishCheck, publishFailureKind,
  ALREADY_PUBLISHED_ERROR_CODE, NOT_READY_ERROR_CODE,
} = await import('@/utils/prePublishCheck')
const { buildEventFullPayload } = await import('@/utils/buildEventFullPayload')
const { ApiError } = await import('@/services/apiError')
const DashboardPackagesPage = (await import('@/pages/dashboard/DashboardPackagesPage.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

describe('the server\'s new publish blockers', () => {
  it('a missing or wrong public link and an unreadable RSVP deadline become blockers with their own text', () => {
    const notes = serverPublishProblems({ invitationUrl: 'missing', rsvpDeadline: 'invalid', location: 'missing' })
    expect(notes.map((n) => [n.section, n.field, n.params.messageKey])).toEqual([
      ['info', 'location', 'onboarding.eventBasics.errors.location'],
      ['rsvp', 'deadline', 'editSection.prePublish.problems.rsvpDeadlineInvalid'],
      ['link', 'invitationUrl', 'editSection.prePublish.problems.invitationUrlMissing'],
    ])
    expect(prePublishCheck(notes).blockers).toHaveLength(3)
    expect(serverPublishProblems({ invitationUrl: 'invalid' })[0].params.messageKey)
      .toBe('editSection.prePublish.problems.invitationUrlInvalid')
    // The deadline leads to its field; the link has no field (it is made on save).
    expect(fixTarget(notes[1])).toBe('rsvpDeadline')
    expect(fixTarget(notes[2])).toBe('')
  })

  it('each refusal is told apart: not ready, already published, not yours, anything else', () => {
    expect(publishFailureKind(new ApiError({ status: 422, errorCode: NOT_READY_ERROR_CODE }))).toBe('notReady')
    expect(publishFailureKind(new ApiError({ status: 409, errorCode: ALREADY_PUBLISHED_ERROR_CODE }))).toBe('alreadyPublished')
    expect(publishFailureKind(new ApiError({ status: 403, errorCode: 'AUTHZ_ACCESS_DENIED' }))).toBe('forbidden')
    expect(publishFailureKind(new ApiError({ status: 500, errorCode: 'INTERNAL_SERVER_ERROR' }))).toBe('failed')
    expect(publishFailureKind(new Error('Network Error'))).toBe('failed')
  })
})

describe('Packages checkout: safe retry and a clear answer', () => {
  async function mountPage(locale = 'en') {
    i18n.global.locale.value = locale
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/:lang/dashboard/events/packages', component: DashboardPackagesPage },
        { path: '/:lang/invitations/:design', component: { template: '<div />' } },
      ],
    })
    await router.push(`/${locale}/dashboard/events/packages`)
    await router.isReady()
    const w = mount(DashboardPackagesPage, { global: { plugins: [i18n, router] }, attachTo: document.body })
    await flushPromises()
    await w.get('.add-cart-btn').trigger('click')
    return { w, router }
  }

  async function checkout(w) {
    await w.get('.cart-checkout-btn').trigger('click')
    await flushPromises()
  }

  beforeEach(() => {
    initPayment.mockReset()
    getById.mockReset()
    redirect.mockReset()
  })

  it('already published: a calm status, no payment page, the cart kept', async () => {
    initPayment.mockRejectedValue(new ApiError({
      status: 409, errorCode: ALREADY_PUBLISHED_ERROR_CODE, detail: 'The event is already published',
    }))
    const { w } = await mountPage()
    await checkout(w)

    expect(redirect).not.toHaveBeenCalled()
    const notice = w.get('[data-testid="publish-already"]')
    expect(notice.attributes('role')).toBe('status')
    expect(notice.text()).toContain('already published')
    expect(notice.text()).toContain('Nothing has been charged')
    expect(w.find('.cart-error').exists()).toBe(false)
    expect(w.findAll('.cart-item')).toHaveLength(1)
    w.unmount()
  })

  it('not the caller\'s event: a localized refusal, no retry hint', async () => {
    initPayment.mockRejectedValue(new ApiError({
      status: 403, errorCode: 'AUTHZ_ACCESS_DENIED', detail: 'Корисникот нема пристап до овој настан',
    }))
    const { w } = await mountPage('mk')
    await checkout(w)

    expect(redirect).not.toHaveBeenCalled()
    const error = w.get('.cart-error')
    expect(error.attributes('role')).toBe('alert')
    expect(error.text()).toBe(mk.editSection.prePublish.forbidden)
    expect(w.find('[data-testid="checkout-retry-hint"]').exists()).toBe(false)
    w.unmount()
  })

  it('a server or network failure says nothing was charged; the retry is one new request with the same cart', async () => {
    initPayment.mockRejectedValueOnce(new Error('Network Error'))
    const { w } = await mountPage('sq')
    await checkout(w)

    expect(w.get('.cart-error').text()).toBe('Network Error')
    expect(w.get('[data-testid="checkout-retry-hint"]').text()).toBe(sq.editSection.prePublish.retryHint)
    expect(w.findAll('.cart-item')).toHaveLength(1)
    expect(w.get('.cart-checkout-btn').attributes('disabled')).toBeUndefined()

    initPayment.mockResolvedValueOnce({ data: { paymentUrl: 'https://pay', fields: { Details2: 'x' } } })
    await checkout(w)
    expect(initPayment).toHaveBeenCalledTimes(2)
    expect(initPayment.mock.calls[1][0]).toEqual(initPayment.mock.calls[0][0])
    expect(initPayment.mock.calls[1][0]).not.toHaveProperty('status')
    expect(redirect).toHaveBeenCalledTimes(1)
    expect(w.find('[data-testid="checkout-retry-hint"]').exists()).toBe(false)
    w.unmount()
  })

  it('a missing public link is listed without a "Fix" button built from a wrong address', async () => {
    initPayment.mockRejectedValue(new ApiError({
      status: 422, errorCode: NOT_READY_ERROR_CODE,
      validationErrors: { invitationUrl: 'invalid', rsvpDeadline: 'invalid' },
    }))
    getById.mockResolvedValue({
      timezone: 'Europe/Skopje',
      invitation: { invitationUrl: 'https://ivy.example/en/invitations/coastal-breeze?eventId=ev-1' },
    })
    const { w } = await mountPage()
    await checkout(w)

    const items = w.findAll('[data-testid="publish-blocker"]')
    expect(items.map((i) => i.attributes('data-field'))).toEqual(['deadline', 'invitationUrl'])
    expect(items[0].text()).toContain('The RSVP deadline can\'t be read.')
    expect(items[0].find('[data-testid="publish-blocker-fix"]').exists()).toBe(true)
    expect(items[1].text()).toContain('is not this event\'s guest link')
    expect(items[1].find('[data-testid="publish-blocker-fix"]').exists()).toBe(false)
    w.unmount()
  })
})

describe('the editor never asks for a status', () => {
  it('neither the create nor the save payload carries status (ACTIVE is set by the payment only)', () => {
    const base = {
      config: { brideName: 'Ана', groomName: 'Марко', weddingDateTime: '2027-06-12T17:00:00', venue: 'Охрид' },
      sectionOrder: [], sectionVisibility: {}, sectionLayouts: {},
    }
    expect(buildEventFullPayload(base)).not.toHaveProperty('status')
    expect(buildEventFullPayload({ ...base, eventLoaded: false })).not.toHaveProperty('status')
  })
})

describe('i18n: the INV-603 texts exist in all three languages', () => {
  it.each(['problems.invitationUrlMissing', 'problems.invitationUrlInvalid', 'problems.rsvpDeadlineInvalid',
    'alreadyPublished', 'forbidden', 'retryHint'])('editSection.prePublish.%s', (path) => {
    const get = (o) => path.split('.').reduce((v, k) => v?.[k], o.editSection.prePublish)
    for (const lang of [en, mk, sq]) expect(typeof get(lang)).toBe('string')
    expect(get(mk)).not.toBe(get(en))
    expect(get(sq)).not.toBe(get(en))
  })
})

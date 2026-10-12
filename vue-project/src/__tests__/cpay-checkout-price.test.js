import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createRouter, createMemoryHistory } from 'vue-router'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * CPay fixes 1 and 7 on the packages page.
 *
 * The server now prices the payment itself: the page sends the coupon it
 * applied (`discountCode`) and, when the amount it showed is not what the
 * server would charge, gets 409 CONFLICT_PRICE_CHANGED with the server's
 * amount — it says so in the viewer's language and reloads packages and cart.
 * A payment of the event started minutes ago is 409 CONFLICT_PAYMENT_IN_PROGRESS
 * with the time from which a new one may start.
 */

const initPayment = vi.fn()
vi.mock('@/services/cpay.service', () => ({ cpayService: { initPayment: (...a) => initPayment(...a) } }))
vi.mock('@/services/events.service', () => ({ eventsService: { getById: vi.fn() } }))
let packages = []
const listByCategory = vi.fn(async () => packages.map((p) => ({ ...p })))
vi.mock('@/services/package.service', () => ({
  packageService: { listByCategory: (...a) => listByCategory(...a) },
}))
const validate = vi.fn()
vi.mock('@/services/backendApi', () => ({ default: { post: (...a) => validate(...a), get: vi.fn() } }))
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
  publishFailureKind, serverPrice, retryAfterTime,
  PRICE_CHANGED_ERROR_CODE, PAYMENT_IN_PROGRESS_ERROR_CODE, DISCOUNT_INVALID_ERROR_CODE,
} = await import('@/utils/prePublishCheck')
const { ApiError } = await import('@/services/apiError')
const DashboardPackagesPage = (await import('@/pages/dashboard/DashboardPackagesPage.vue')).default

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk, sq } })

async function mountPage(locale = 'en') {
  i18n.global.locale.value = locale
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:lang/dashboard/events/packages', component: DashboardPackagesPage }],
  })
  await router.push(`/${locale}/dashboard/events/packages`)
  await router.isReady()
  const w = mount(DashboardPackagesPage, { global: { plugins: [i18n, router] }, attachTo: document.body })
  await flushPromises()
  return w
}

async function applyCoupon(w, code, percent) {
  validate.mockResolvedValue({ data: { valid: true, discountPercent: percent, promotionName: 'Welcome' } })
  await w.get('.discount-input').setValue(code)
  await w.get('.discount-btn').trigger('click')
  await flushPromises()
}

async function checkout(w) {
  await w.get('.cart-checkout-btn').trigger('click')
  await flushPromises()
}

beforeEach(() => {
  packages = [{ id: 'p1', packageType: 'INV_PREMIUM', name: 'Premium', price: 8999, currentPrice: 8999, currency: 'MKD', features: [] }]
  initPayment.mockReset()
  initPayment.mockResolvedValue({ data: { paymentUrl: 'https://cpay.example', fields: { Details2: 'abc' } } })
  validate.mockReset()
  redirect.mockReset()
  listByCategory.mockClear()
})

describe('CPay fix 1 — the coupon goes to the server', () => {
  it('sends the applied code with the discounted amount — also for an item added before the code', async () => {
    const w = await mountPage()
    await w.get('.add-cart-btn').trigger('click')
    await applyCoupon(w, ' welcome20 ', 20)

    // 8999 × 0.8 = 7199.2 → 7199, the cart follows the coupon applied now.
    expect(w.get('.cart-total-amount').text()).toBe('7199 MKD')
    await checkout(w)

    expect(initPayment).toHaveBeenCalledTimes(1)
    const payload = initPayment.mock.calls[0][0]
    expect(payload.discountCode).toBe('welcome20')
    expect(payload.amount).toBe(7199)
    expect(payload.packageTypes).toEqual(['INV_PREMIUM'])
    // CPay round 2 (4): the payer is the token — no userId, no e-mail in the body.
    expect(payload).not.toHaveProperty('userId')
    expect(payload).not.toHaveProperty('email')
    expect(redirect).toHaveBeenCalled()
    w.unmount()
  })

  it('without a valid code no discountCode is sent', async () => {
    validate.mockResolvedValue({ data: { valid: false, message: 'Invalid discount code' } })
    const w = await mountPage()
    await w.get('.discount-input').setValue('NOPE')
    await w.get('.discount-btn').trigger('click')
    await flushPromises()
    await w.get('.add-cart-btn').trigger('click')
    await checkout(w)

    const payload = initPayment.mock.calls[0][0]
    expect(payload).not.toHaveProperty('discountCode')
    expect(payload.amount).toBe(8999)
    w.unmount()
  })

  it('409 PRICE_CHANGED: says the new amount (en), reloads packages and cart, no payment page', async () => {
    const w = await mountPage()
    await w.get('.add-cart-btn').trigger('click')
    packages = [{ ...packages[0], price: 9999, currentPrice: 9499 }]
    initPayment.mockRejectedValue(new ApiError({
      status: 409, errorCode: PRICE_CHANGED_ERROR_CODE, detail: 'The price is now 9499.00 MKD',
      validationErrors: { amount: '9499.00', currency: 'MKD' },
    }))
    const calls = listByCategory.mock.calls.length

    await checkout(w)

    expect(redirect).not.toHaveBeenCalled()
    const alert = w.get('.cart-error')
    expect(alert.attributes('role')).toBe('alert')
    expect(alert.text()).toContain('The price has changed')
    expect(alert.text()).toContain('9499 MKD')
    expect(listByCategory.mock.calls.length).toBeGreaterThan(calls)
    expect(w.get('.cart-total-amount').text()).toBe('9499 MKD')
    expect(w.findAll('.cart-item')).toHaveLength(1)
    w.unmount()
  })

  it('409 PRICE_CHANGED in Macedonian and Albanian', async () => {
    initPayment.mockRejectedValue(new ApiError({
      status: 409, errorCode: PRICE_CHANGED_ERROR_CODE, validationErrors: { amount: '8999.00', currency: 'MKD' },
    }))
    for (const [locale, text] of [['mk', 'Цената е променета'], ['sq', 'Çmimi ka ndryshuar']]) {
      const w = await mountPage(locale)
      await w.get('.add-cart-btn').trigger('click')
      await checkout(w)
      expect(w.get('.cart-error').text()).toContain(text)
      expect(w.get('.cart-error').text()).toContain('8999 MKD')
      w.unmount()
    }
  })

  it('422 DISCOUNT invalid: the code is removed, full prices again, a localized message', async () => {
    const w = await mountPage('mk')
    await w.get('.add-cart-btn').trigger('click')
    await applyCoupon(w, 'OLD', 20)
    initPayment.mockRejectedValue(new ApiError({ status: 422, errorCode: DISCOUNT_INVALID_ERROR_CODE }))

    await checkout(w)

    expect(w.get('.cart-error').text()).toContain('Кодот за попуст повеќе не важи')
    expect(w.find('.discount-success').exists()).toBe(false)
    expect(w.get('.cart-total-amount').text()).toBe('8999 MKD')
    w.unmount()
  })
})

describe('CPay fix 7 — a payment already in progress', () => {
  it('409 PAYMENT_IN_PROGRESS: "try again after HH:mm" in the viewer\'s time (mk), no payment page', async () => {
    const retryAfter = '2026-10-11T10:20:00Z'
    initPayment.mockRejectedValue(new ApiError({
      status: 409, errorCode: PAYMENT_IN_PROGRESS_ERROR_CODE, validationErrors: { retryAfter },
    }))
    const w = await mountPage('mk')
    await w.get('.add-cart-btn').trigger('click')
    await checkout(w)

    const expected = new Intl.DateTimeFormat('mk', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .format(new Date(retryAfter))
    expect(expected).toMatch(/^\d{2}:\d{2}$/)
    const alert = w.get('.cart-error')
    expect(alert.text()).toContain('Плаќањето е во тек')
    expect(alert.text()).toContain(`по ${expected}`)
    expect(redirect).not.toHaveBeenCalled()
    expect(w.findAll('.cart-item')).toHaveLength(1)
    w.unmount()
  })

  it('without a time the message still says to try again later (en, sq)', async () => {
    initPayment.mockRejectedValue(new ApiError({ status: 409, errorCode: PAYMENT_IN_PROGRESS_ERROR_CODE }))
    for (const [locale, text] of [['en', 'try again in a few minutes'], ['sq', 'Pagesa është në vazhdim']]) {
      const w = await mountPage(locale)
      await w.get('.add-cart-btn').trigger('click')
      await checkout(w)
      expect(w.get('.cart-error').text()).toContain(text)
      w.unmount()
    }
  })
})

describe('helpers and translations', () => {
  it('publishFailureKind tells the new refusals apart; serverPrice and retryAfterTime read them', () => {
    expect(publishFailureKind(new ApiError({ status: 409, errorCode: PRICE_CHANGED_ERROR_CODE }))).toBe('priceChanged')
    expect(publishFailureKind(new ApiError({ status: 409, errorCode: PAYMENT_IN_PROGRESS_ERROR_CODE }))).toBe('paymentInProgress')
    expect(publishFailureKind(new ApiError({ status: 422, errorCode: DISCOUNT_INVALID_ERROR_CODE }))).toBe('discountInvalid')
    expect(serverPrice({ validationErrors: { amount: '1500.00', currency: 'EUR' } })).toEqual({ amount: 1500, currency: 'EUR' })
    expect(serverPrice({ validationErrors: { amount: 'x' } })).toBeNull()
    expect(serverPrice({})).toBeNull()
    expect(retryAfterTime({ validationErrors: { retryAfter: 'not a date' } }, 'en')).toBe('')
    expect(retryAfterTime({}, 'en')).toBe('')
    expect(retryAfterTime({ validationErrors: { retryAfter: '2026-10-11T10:20:00Z' } }, 'en')).toMatch(/^\d{2}:\d{2}$/)
  })

  it('packages.checkoutIssue exists in mk, en and sq with the same keys and placeholders', () => {
    const keys = (l) => Object.keys(l.packages.checkoutIssue).sort()
    expect(keys(mk)).toEqual(keys(en))
    expect(keys(sq)).toEqual(keys(en))
    for (const l of [mk, en, sq]) {
      expect(l.packages.checkoutIssue.priceChanged).toContain('{amount}')
      expect(l.packages.checkoutIssue.inProgress).toContain('{time}')
    }
  })
})

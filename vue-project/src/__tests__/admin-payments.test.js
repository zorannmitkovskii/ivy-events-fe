import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminPaymentsPage from '@/pages/adminDashboard/AdminPaymentsPage.vue'
import { ApiError } from '@/services/apiError'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * The payments list is an ordinary table.
 *
 * <p>It used to sit inside `.tbl-round` — the design's round seating-plan
 * table, `aspect-ratio: 1; border-radius: 50%` — so every payment was squeezed
 * into a circle. What it pins: a card around a plain table, one row per attempt.
 *
 * <p>CPay round 2 (5): "Awaiting confirmation" — CPay payments the bank never
 * confirmed, with why, and the admin's decision (mark paid with the merchant
 * portal reference, or failed), each with a note, in a confirmation dialog.
 */

const { listMock, awaitingMock, markPaidMock, markFailedMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  awaitingMock: vi.fn(),
  markPaidMock: vi.fn(),
  markFailedMock: vi.fn(),
}))

const { copyTextMock } = vi.hoisted(() => ({ copyTextMock: vi.fn() }))
vi.mock('@/utils/copyText', () => ({ copyText: copyTextMock }))

vi.mock('@/services/payments.service', () => ({
  paymentsService: {
    list: listMock,
    awaitingConfirmation: awaitingMock,
    markPaid: markPaidMock,
    markFailed: markFailedMock,
  }
}))

const makeI18n = (locale = 'en') => createI18n({ legacy: false, locale, messages: { en, mk, sq } })

const payment = (id, status) => ({
  id,
  status,
  providerOrderRef: `ORD-${id}`,
  customerEmail: `${id}@ivy.test`,
  packageType: 'PREMIUM',
  amount: 1200,
  currency: 'MKD',
  createdAt: '2026-09-01T10:00:00Z'
})

const waiting = (ref, extra = {}) => ({
  id: `id-${ref}`,
  reference: ref,
  amount: 4999,
  currency: 'MKD',
  packageTypes: ['INV_PRO'],
  eventId: 'ev-1',
  eventName: 'Свадба Ана и Марко',
  userId: 'user-1',
  customerEmail: 'ana@ivy.test',
  status: 'PENDING',
  createdAt: '2026-10-11T08:00:00Z',
  ageMinutes: 135,
  reason: 'NO_BANK_RESPONSE',
  reasonDetail: null,
  ...extra,
})

const RouterLinkStub = { props: ['to'], template: '<a class="router-link" :data-to="JSON.stringify(to)"><slot /></a>' }

function mountPage(locale = 'en') {
  return mount(AdminPaymentsPage, {
    attachTo: document.body,
    global: {
      plugins: [makeI18n(locale)],
      stubs: { PageHead: true, teleport: true, 'router-link': RouterLinkStub },
    },
  })
}

async function openAwaiting(wrapper) {
  await wrapper.get('[data-testid="filter-awaiting"]').trigger('click')
  await flushPromises()
}

beforeEach(() => {
  listMock.mockReset()
  awaitingMock.mockReset()
  markPaidMock.mockReset()
  markFailedMock.mockReset()
  copyTextMock.mockReset()
  listMock.mockResolvedValue({ data: { content: [], totalElements: 0 } })
})

describe('the payments list', () => {
  it('renders every attempt as a row of a plain table inside a card', async () => {
    listMock.mockResolvedValue({
      data: { content: [payment('a', 'SUCCESS'), payment('b', 'FAILED')], totalElements: 2 }
    })

    const wrapper = mountPage()
    await flushPromises()

    expect(wrapper.find('.tbl-round').exists()).toBe(false)
    expect(wrapper.find('.card > table.tbl').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
    wrapper.unmount()
  })
})

describe('CPay round 2 (5): awaiting confirmation', () => {
  it('lists unconfirmed CPay payments with reference, amount, packages, event link, customer, age and reason', async () => {
    awaitingMock.mockResolvedValue({ data: { content: [
      waiting('ab12cd34ef'),
      waiting('ff00ee11dd', { reason: 'CPAY_MISMATCH', reasonDetail: 'AmountToPay', ageMinutes: 3000, status: 'EXPIRED' }),
      waiting('aa99bb88cc', { reason: 'NEEDS_CONFIRMATION', eventId: null, eventName: null, ageMinutes: 7 }),
    ], totalElements: 3 } })
    const wrapper = mountPage()
    await flushPromises()
    await openAwaiting(wrapper)

    expect(awaitingMock).toHaveBeenCalledWith({ page: 0, size: 25 })
    expect(wrapper.get('[data-testid="filter-awaiting"]').attributes('aria-pressed')).toBe('true')
    const first = wrapper.get('[data-testid="awaiting-row-ab12cd34ef"]')
    expect(first.text()).toContain('ab12cd34ef')
    expect(first.text()).toContain('INV_PRO')
    expect(first.text()).toContain('ana@ivy.test')
    expect(first.text()).toContain('2 h')
    expect(first.text()).toContain('No answer from the bank')
    const link = first.get('.router-link')
    expect(JSON.parse(link.attributes('data-to'))).toEqual({ name: 'admin.events', query: { q: 'Свадба Ана и Марко' } })
    expect(link.text()).toBe('Свадба Ана и Марко')

    const mismatch = wrapper.get('[data-testid="awaiting-row-ff00ee11dd"]')
    expect(mismatch.text()).toContain("does not match the payment (AmountToPay)")
    expect(mismatch.text()).toContain('2 d')
    expect(mismatch.text()).toContain('Expired')
    const noEvent = wrapper.get('[data-testid="awaiting-row-aa99bb88cc"]')
    expect(noEvent.text()).toContain('No event')
    expect(noEvent.text()).toContain('without a confirmed transaction')
    expect(noEvent.text()).toContain('7 min')

    expect(wrapper.get('[data-testid="mark-paid-ab12cd34ef"]').attributes('aria-label'))
      .toBe('Mark payment ab12cd34ef as paid and activate')
    wrapper.unmount()
  })

  it('mark paid: the reference and the note are required; then it is sent once, the list reloads and the outcome is announced', async () => {
    awaitingMock.mockResolvedValueOnce({ data: { content: [waiting('ab12cd34ef')], totalElements: 1 } })
      .mockResolvedValue({ data: { content: [], totalElements: 0 } })
    let resolve
    markPaidMock.mockImplementation(() => new Promise((r) => { resolve = r }))
    const wrapper = mountPage()
    await flushPromises()
    await openAwaiting(wrapper)

    await wrapper.get('[data-testid="mark-paid-ab12cd34ef"]').trigger('click')
    await flushPromises()
    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.text()).toContain('merchant portal')
    expect(wrapper.get('label[for="decision-provider-ref"]').text()).toContain('CPay reference')
    expect(wrapper.get('label[for="decision-note"]').text()).toBe('Note')

    await wrapper.get('[data-testid="decision-confirm"]').trigger('click')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(markPaidMock).not.toHaveBeenCalled()
    expect(wrapper.get('#decision-provider-ref').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#decision-note').attributes('aria-invalid')).toBe('true')
    expect(document.activeElement?.id).toBe('decision-provider-ref')

    await wrapper.get('#decision-provider-ref').setValue('  CP-778899 ')
    await wrapper.get('#decision-note').setValue('Видено во порталот')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit') // a second click while the first is on its way
    await flushPromises()
    expect(markPaidMock).toHaveBeenCalledTimes(1)
    expect(markPaidMock).toHaveBeenCalledWith('id-ab12cd34ef', { providerReference: 'CP-778899', note: 'Видено во порталот' })
    expect(wrapper.get('[data-testid="decision-confirm"]').attributes('disabled')).toBeDefined()

    resolve({ data: { status: 'SUCCESS' } })
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(awaitingMock).toHaveBeenCalledTimes(2)
    const notice = wrapper.get('[data-testid="awaiting-notice"]')
    expect(notice.attributes('role')).toBe('status')
    expect(notice.text()).toBe('Payment ab12cd34ef is marked as paid; the packages are being activated.')
    expect(document.activeElement).toBe(notice.element)
    wrapper.unmount()
  })

  it('409 already settled (double click, another admin): no error in the dialog — it closes, says so and reloads', async () => {
    awaitingMock.mockResolvedValue({ data: { content: [waiting('ab12cd34ef')], totalElements: 1 } })
    markPaidMock.mockRejectedValue(new ApiError({ status: 409, errorCode: 'CONFLICT_PAYMENT_ALREADY_SETTLED', detail: 'no longer' }))
    const wrapper = mountPage()
    await flushPromises()
    await openAwaiting(wrapper)

    await wrapper.get('[data-testid="mark-paid-ab12cd34ef"]').trigger('click')
    await wrapper.get('#decision-provider-ref').setValue('CP-1')
    await wrapper.get('#decision-note').setValue('x')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="awaiting-notice"]').text()).toContain('no longer waiting')
    expect(awaitingMock).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('another error stays in the dialog as an alert, and the admin can retry', async () => {
    awaitingMock.mockResolvedValue({ data: { content: [waiting('ab12cd34ef')], totalElements: 1 } })
    markFailedMock.mockRejectedValueOnce(new ApiError({ status: 500, errorCode: 'INTERNAL_SERVER_ERROR', detail: 'Server down' }))
      .mockResolvedValueOnce({ data: { status: 'FAILED' } })
    const wrapper = mountPage()
    await flushPromises()
    await openAwaiting(wrapper)

    await wrapper.get('[data-testid="mark-failed-ab12cd34ef"]').trigger('click')
    expect(wrapper.find('#decision-provider-ref').exists()).toBe(false)
    await wrapper.get('#decision-note').setValue('Корисникот откажа')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[data-testid="decision-error"]').attributes('role')).toBe('alert')
    expect(wrapper.get('[data-testid="decision-error"]').text()).toBe('Server down')

    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(markFailedMock).toHaveBeenLastCalledWith('id-ab12cd34ef', { note: 'Корисникот откажа' })
    expect(wrapper.get('[data-testid="awaiting-notice"]').text()).toBe('Payment ab12cd34ef is marked as failed.')
    wrapper.unmount()
  })

  it('in Macedonian: the filter, the reason and the action', async () => {
    awaitingMock.mockResolvedValue({ data: { content: [waiting('ab12cd34ef')], totalElements: 1 } })
    const wrapper = mountPage('mk')
    await flushPromises()
    await openAwaiting(wrapper)

    expect(wrapper.get('[data-testid="filter-awaiting"]').text()).toBe('Чекаат потврда')
    expect(wrapper.text()).toContain('Нема повратен одговор од банка')
    expect(wrapper.get('[data-testid="mark-paid-ab12cd34ef"]').text()).toBe('Означи како платено и активирај')
    wrapper.unmount()
  })

  it('every adminPayments key exists in mk, en and sq', () => {
    const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
      v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`])
    const enKeys = keys(en.adminPayments).sort()
    expect(keys(mk.adminPayments).sort()).toEqual(enKeys)
    expect(keys(sq.adminPayments).sort()).toEqual(enKeys)
    expect(enKeys).toContain('awaiting.reasons.CPAY_MISMATCH')
    expect(enKeys).toContain('awaiting.reasons.CPAY_REF_REUSED')
    expect(enKeys).toContain('awaiting.refReused')
    expect(enKeys).toContain('cpayRef')
  })
})

describe('CPay reconciliation: CPay reference, period, copy / CSV', () => {
  const paid = (id, extra = {}) => ({
    ...payment(id, 'SUCCESS'),
    providerTransactionRef: `TX${id}`,
    paidAt: '2026-10-05T09:15:00',
    ...extra,
  })

  it('the list shows the CPay transaction reference and when it was paid, in labelled columns', async () => {
    listMock.mockResolvedValue({ data: { content: [paid('a'), payment('b', 'PENDING')], totalElements: 2 } })
    const wrapper = mountPage()
    await flushPromises()

    const headers = wrapper.findAll('[data-testid="payments-table"] th').map((th) => th.text())
    expect(headers).toEqual(expect.arrayContaining(['Reference (Details2)', 'CPay reference', 'Paid', 'Amount']))
    wrapper.findAll('[data-testid="payments-table"] th').forEach((th) => expect(th.attributes('scope')).toBe('col'))
    const row = wrapper.get('[data-testid="payment-row-a"]')
    expect(row.get('[data-testid="cpay-ref"]').text()).toBe('TXa')
    expect(row.text()).toContain('ORD-a')
    expect(row.text()).toContain('a@ivy.test')
    expect(wrapper.get('[data-testid="payment-row-b"] [data-testid="cpay-ref"]').text()).toBe('—')
    wrapper.unmount()
  })

  it('SUCCESS + a period → the list is asked for exactly that; a period that ends before it starts is an alert and is not sent', async () => {
    const wrapper = mountPage()
    await flushPromises()

    await wrapper.findAll('.filters-row button').find((b) => b.text() === 'Succeeded').trigger('click')
    await flushPromises()
    expect(listMock).toHaveBeenLastCalledWith({ status: 'SUCCESS', page: 0, size: 25 })

    expect(wrapper.get('label[for="payments-from"]').text()).toBe('From')
    expect(wrapper.get('label[for="payments-to"]').text()).toBe('To')
    await wrapper.get('#payments-from').setValue('2026-10-05')
    await wrapper.get('#payments-from').trigger('change')
    await wrapper.get('#payments-to').setValue('2026-10-11')
    await wrapper.get('#payments-to').trigger('change')
    await flushPromises()
    expect(listMock).toHaveBeenLastCalledWith({ status: 'SUCCESS', from: '2026-10-05', to: '2026-10-11', page: 0, size: 25 })

    const calls = listMock.mock.calls.length
    await wrapper.get('#payments-from').setValue('2026-10-12')
    await wrapper.get('#payments-from').trigger('change')
    await flushPromises()
    expect(listMock.mock.calls.length).toBe(calls)
    expect(wrapper.get('[data-testid="period-error"]').attributes('role')).toBe('alert')
    expect(wrapper.get('#payments-from').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('#payments-from').attributes('aria-describedby')).toContain('payments-period-error')

    await wrapper.get('[data-testid="period-clear"]').trigger('click')
    await flushPromises()
    expect(listMock).toHaveBeenLastCalledWith({ status: 'SUCCESS', page: 0, size: 25 })
    expect(wrapper.find('[data-testid="period-error"]').exists()).toBe(false)
    expect(document.activeElement?.id).toBe('payments-from')
    wrapper.unmount()
  })

  it('"Copy list" copies every filtered payment (all pages), only reference, CPay reference, amount, currency, paidAt', async () => {
    listMock.mockImplementation(({ page, size }) => {
      if (size === 25) return Promise.resolve({ data: { content: [paid('a')], totalElements: 101, totalPages: 5 } })
      const content = page === 0 ? Array.from({ length: 100 }, (_, i) => paid(`p${i}`)) : [paid('last', { amount: 4999.5 })]
      return Promise.resolve({ data: { content, totalElements: 101, totalPages: 2 } })
    })
    copyTextMock.mockResolvedValue(true)
    const wrapper = mountPage()
    await flushPromises()
    await wrapper.get('#payments-from').setValue('2026-10-05')
    await wrapper.get('#payments-from').trigger('change')
    await flushPromises()

    await wrapper.get('[data-testid="copy-list"]').trigger('click')
    await flushPromises()

    expect(listMock).toHaveBeenCalledWith({ status: undefined, from: '2026-10-05', page: 0, size: 100 })
    expect(listMock).toHaveBeenCalledWith({ status: undefined, from: '2026-10-05', page: 1, size: 100 })
    const text = copyTextMock.mock.calls[0][0]
    const lines = text.split('\n')
    expect(lines[0]).toBe('reference\tcPayPaymentRef\tamount\tcurrency\tpaidAt')
    expect(lines).toHaveLength(102)
    expect(lines[101]).toBe('ORD-last\tTXlast\t4999.5\tMKD\t2026-10-05T09:15:00')
    expect(text).not.toContain('@ivy.test')
    const notice = wrapper.get('[data-testid="awaiting-notice"]')
    expect(notice.attributes('role')).toBe('status')
    expect(notice.text()).toBe('Copied 101 payments (reference, CPay reference, amount, currency, paid).')
    wrapper.unmount()
  })

  it('"Download CSV" offers a CSV file of the filtered payments; a refused copy says to use it', async () => {
    listMock.mockResolvedValue({ data: { content: [paid('a')], totalElements: 1, totalPages: 1 } })
    const blobs = []
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = vi.fn((blob) => { blobs.push(blob); return 'blob:test' })
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      const wrapper = mountPage('mk')
      await flushPromises()
      await wrapper.findAll('.filters-row button').find((b) => b.text() === 'Успешно').trigger('click')
      await flushPromises()

      expect(wrapper.get('[data-testid="export-csv"]').text()).toBe('Преземи CSV')
      await wrapper.get('[data-testid="export-csv"]').trigger('click')
      await flushPromises()

      expect(click).toHaveBeenCalledTimes(1)
      const csv = await blobs[0].text()
      expect(csv.replace(/^﻿/, '')).toBe('reference,cPayPaymentRef,amount,currency,paidAt\r\nORD-a,TXa,1200,MKD,2026-10-05T09:15:00\r\n')
      expect(click.mock.contexts[0].download).toBe('cpay-payments-success.csv')
      expect(wrapper.get('[data-testid="awaiting-notice"]').text()).toBe('Преземен е CSV со 1 плаќања.')

      copyTextMock.mockResolvedValue(false)
      await wrapper.get('[data-testid="copy-list"]').trigger('click')
      await flushPromises()
      expect(wrapper.get('[data-testid="awaiting-notice"]').text()).toContain('Преземи CSV')
      wrapper.unmount()
    } finally {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
      click.mockRestore()
    }
  })

  it('export buttons are disabled when nothing matches', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.get('[data-testid="copy-list"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="export-csv"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

describe('Unique cPayPaymentRef', () => {
  it('the awaiting list explains CPAY_REF_REUSED (en / mk / sq)', async () => {
    const cases = [['en', 'already used for another payment'], ['mk', 'веќе е искористена'], ['sq', 'është përdorur tashmë']]
    for (const [locale, text] of cases) {
      awaitingMock.mockResolvedValue({
        data: { content: [waiting('ab12cd34ef', { reason: 'CPAY_REF_REUSED', reasonDetail: 'paymentId=p-1' })], totalElements: 1 },
      })
      const wrapper = mountPage(locale)
      await flushPromises()
      await openAwaiting(wrapper)
      const row = wrapper.get('[data-testid="awaiting-row-ab12cd34ef"]')
      expect(row.text()).toContain(text)
      expect(row.text()).toContain('paymentId=p-1')
      wrapper.unmount()
    }
  })

  it('mark paid with a reference another payment has → 409 REF_REUSED: the dialog stays with an alert, focus on the reference, the list reloads', async () => {
    awaitingMock.mockResolvedValue({ data: { content: [waiting('ab12cd34ef')], totalElements: 1 } })
    markPaidMock.mockRejectedValue(new ApiError({
      status: 409,
      errorCode: 'CONFLICT_CPAY_REF_REUSED',
      detail: 'reused',
      validationErrors: { providerReference: 'reused', paymentId: 'other-payment-id' },
    }))
    const wrapper = mountPage()
    await flushPromises()
    await openAwaiting(wrapper)

    await wrapper.get('[data-testid="mark-paid-ab12cd34ef"]').trigger('click')
    await wrapper.get('#decision-provider-ref').setValue('R1234567')
    await wrapper.get('#decision-note').setValue('портал')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    const alert = wrapper.get('[data-testid="decision-error"]')
    expect(alert.attributes('role')).toBe('alert')
    expect(alert.text()).toContain('already belongs to another payment (other-payment-id)')
    expect(document.activeElement?.id).toBe('decision-provider-ref')
    expect(wrapper.get('[data-testid="decision-confirm"]').attributes('disabled')).toBeUndefined()
    expect(awaitingMock).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="awaiting-notice"]').text()).toBe('')
    wrapper.unmount()
  })
})

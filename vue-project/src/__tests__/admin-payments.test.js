import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminPaymentsPage from '@/pages/adminDashboard/AdminPaymentsPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The payments list is an ordinary table.
 *
 * <p>It used to sit inside `.tbl-round` — the design's round seating-plan
 * table, `aspect-ratio: 1; border-radius: 50%` — so every payment was squeezed
 * into a circle. What it pins: a card around a plain table, one row per attempt.
 */

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }))

vi.mock('@/services/payments.service', () => ({
  paymentsService: { list: listMock }
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

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

describe('the payments list', () => {
  it('renders every attempt as a row of a plain table inside a card', async () => {
    listMock.mockResolvedValue({
      data: { content: [payment('a', 'SUCCESS'), payment('b', 'FAILED')], totalElements: 2 }
    })

    const wrapper = mount(AdminPaymentsPage, {
      global: { plugins: [i18n], stubs: { PageHead: true } }
    })
    await flushPromises()

    expect(wrapper.find('.tbl-round').exists()).toBe(false)
    expect(wrapper.find('.card > table.tbl').exists()).toBe(true)
    expect(wrapper.findAll('tbody tr')).toHaveLength(2)
  })
})

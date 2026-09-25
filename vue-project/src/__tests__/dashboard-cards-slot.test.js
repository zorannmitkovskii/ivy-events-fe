import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import DashboardOverview from '@/components/dashboard/DashboardOverview.vue'
import en from '@/i18n/locales/en.json'

/**
 * The dashboard's `cards` slot (IVY-1104): a screen adds its own cards beside
 * the shared ones, and they are told the range the figures were loaded for —
 * the applied one, not what is still being typed.
 */

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
  RouterLink: { props: ['to'], template: '<a><slot /></a>' },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const PAYLOAD = {
  data: {
    totals: {
      eventCount: 3, guestCount: 40, childCount: 0, invitedCount: 30,
      confirmedCount: 20, respondedCount: 25, responseRate: 83, overdueTaskCount: 0,
    },
    statusBreakdown: { DRAFT: 1, PENDING: 0, ACTIVE: 2 },
    upcoming: { next30: 1, next60: 2, next90: 3 },
    monthly: [{ month: '2026-08', count: 3 }],
    attention: { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: 30, limit: 25, items: [] },
    definitions: {},
  },
}

describe('the cards slot', () => {
  it('renders among the cards and receives the applied range', async () => {
    const wrapper = mount(DashboardOverview, {
      props: { title: 'Overview', subtitle: 'Numbers', loader: vi.fn().mockResolvedValue(PAYLOAD), eventLink: () => '' },
      slots: { cards: `<template #cards="{ filters }"><i class="probe">{{ filters.from }}|{{ filters.to }}</i></template>` },
      global: { plugins: [i18n] },
    })
    await flushPromises()

    expect(wrapper.find('.cards .probe').text()).toBe('|')

    const [from, to] = wrapper.findAll('input[type="date"]')
    await from.setValue('2031-03-01')
    await to.setValue('2031-03-31')
    expect(wrapper.find('.cards .probe').text()).toBe('|')

    await wrapper.find('form.filters').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.cards .probe').text()).toBe('2031-03-01|2031-03-31')
  })
})

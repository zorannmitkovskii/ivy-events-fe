import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyBudgetPanel from '@/components/agency/AgencyBudgetPanel.vue'
import { __resetAgencyPreferences } from '@/composables/useAgencyPreferences'
import { formatMoney } from '@/utils/agencyFormat.js'
import en from '@/i18n/locales/en.json'

/**
 * Amounts on the agency screens are drawn in the currency the agency chose in
 * its settings, and in denars until it chooses one.
 */

const mocks = vi.hoisted(() => ({ agencySettings: vi.fn() }))

vi.mock('@/services/crm.service', () => ({ crmService: { agencySettings: mocks.agencySettings } }))

const BUDGET = { overBudgetEvents: 0, events: [{ eventId: 'e1', name: 'Марија & Филип', planned: 500000, spent: 125000 }] }

async function mountPanel() {
  const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
  const wrapper = mount(AgencyBudgetPanel, { props: { budget: BUDGET }, global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('agency currency', () => {
  beforeEach(() => {
    __resetAgencyPreferences()
    mocks.agencySettings.mockReset()
  })

  it('draws amounts in euros when the agency chose EUR', async () => {
    mocks.agencySettings.mockResolvedValue({ data: { currency: 'EUR', language: 'en', timezone: 'Europe/Skopje' } })

    const text = (await mountPanel()).text()

    expect(text).toContain('€')
    expect(text).not.toMatch(/ден|MKD/)
  })

  it('stays in denars when the agency has not chosen', async () => {
    mocks.agencySettings.mockResolvedValue({ data: null })

    expect((await mountPanel()).text()).toMatch(/ден|MKD/)
  })

  it('stays in denars when the settings cannot be read', async () => {
    mocks.agencySettings.mockRejectedValue(new Error('offline'))

    expect((await mountPanel()).text()).toMatch(/ден|MKD/)
  })

  it('formats with the currency it is given, denars by default', () => {
    expect(formatMoney(1200, 'EUR', 'en')).toContain('€')
    expect(formatMoney(1200)).toMatch(/ден|MKD/)
  })
})

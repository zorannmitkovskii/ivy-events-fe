import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencyPipelinePage from '@/pages/dashboard/AgencyPipelinePage.vue'
import { __resetAgencyPreferences } from '@/composables/useAgencyPreferences'
import en from '@/i18n/locales/en.json'

/** A lead's fee is drawn in the currency the agency set, not always in denars. */

const { settingsMock } = vi.hoisted(() => ({ settingsMock: vi.fn() }))

vi.mock('@/services/crm.service', () => ({
  crmService: {
    pipeline: () => Promise.resolve({ data: [{ id: 'l-1', name: 'Свадба', stage: 'PROPOSAL', expectedValue: 1500 }] }),
    agencySettings: settingsMock,
  },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

async function feeText() {
  const wrapper = mount(AgencyPipelinePage, { global: { plugins: [i18n], stubs: { PageHead: true } } })
  await flushPromises()
  return wrapper.find('.fee').text()
}

beforeEach(() => {
  __resetAgencyPreferences()
  settingsMock.mockReset()
})

describe('the pipeline fee', () => {
  it('uses the agency currency', async () => {
    settingsMock.mockResolvedValue({ data: { currency: 'EUR' } })

    expect(await feeText()).toContain('€1,500')
  })

  it('falls back to denars when the settings cannot be read', async () => {
    settingsMock.mockRejectedValue(new Error('offline'))

    expect(await feeText()).toMatch(/MKD|ден/)
  })
})

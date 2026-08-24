import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AgencySettingsPage from '@/pages/dashboard/AgencySettingsPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency's settings page (IVY-1202).
 *
 * <p>The at-risk window used to be a form inside the dashboard, under the list
 * it controls. It lives here now, and the two things worth pinning came with
 * it: an unset window must read as inherited rather than as somebody's choice
 * of 30, and saving must stop calling it inherited.
 */

const { windowMock, setWindowMock } = vi.hoisted(() => ({
  windowMock: vi.fn(),
  setWindowMock: vi.fn()
}))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    agencyRiskWindow: windowMock,
    setAgencyRiskWindow: setWindowMock
  }
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' } }),
  RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' }
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

beforeEach(() => {
  windowMock.mockReset().mockResolvedValue({ data: { riskWindowDays: 30, isDefault: true } })
  setWindowMock.mockReset().mockResolvedValue({ data: { riskWindowDays: 60, isDefault: false } })
})

async function render() {
  const wrapper = mount(AgencySettingsPage, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('the at-risk window', () => {
  it('says the value is inherited when the agency never chose one', async () => {
    const wrapper = await render()

    expect(wrapper.find('input[type="number"]').element.value).toBe('30')
    expect(wrapper.text()).toContain('Inherited from the platform default')
  })

  it('stops calling it inherited once saved', async () => {
    const wrapper = await render()

    await wrapper.find('input[type="number"]').setValue(60)
    await wrapper.find('.risk-form').trigger('submit')
    await flushPromises()

    expect(setWindowMock).toHaveBeenCalledWith(60)
    expect(wrapper.text()).not.toContain('Inherited from the platform default')
    expect(wrapper.text()).toContain('Saved')
  })

  it('shows a failed save rather than pretending it worked', async () => {
    setWindowMock.mockImplementation(() => Promise.reject(new Error('Access is denied')))
    const wrapper = await render()

    await wrapper.find('input[type="number"]').setValue(60)
    await wrapper.find('.risk-form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('links back to the dashboard it configures', async () => {
    const wrapper = await render()
    expect(wrapper.find('.back').attributes('href')).toBe('/en/org/dashboard')
  })
})

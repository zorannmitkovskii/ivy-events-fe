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

const { windowMock, setWindowMock, prefsMock, savePrefsMock } = vi.hoisted(() => ({
  windowMock: vi.fn(),
  setWindowMock: vi.fn(),
  prefsMock: vi.fn(),
  savePrefsMock: vi.fn()
}))

const roles = new Set(['AGENCY'])

vi.mock('@/services/auth.service', () => ({ hasRole: (role) => roles.has(role) }))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    agencyRiskWindow: windowMock,
    setAgencyRiskWindow: setWindowMock
  }
}))

vi.mock('@/services/crm.service', () => ({
  crmService: {
    branding: vi.fn().mockResolvedValue({ data: null }),
    plan: vi.fn().mockResolvedValue({ data: null }),
    saveBranding: vi.fn(),
    agencySettings: prefsMock,
    saveAgencySettings: savePrefsMock,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' } }),
  RouterLink: { props: ['to'], template: '<a :href="String(to)"><slot /></a>' }
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const PREFS = {
  timezone: 'Europe/Skopje', currency: 'MKD', language: 'mk',
  notifyOverdueTasks: true, notifyEventDeadlines: true, notifyRsvpReminders: false, notifyVendorConfirmations: true,
  isDefault: false,
}

beforeEach(() => {
  roles.clear()
  roles.add('AGENCY')
  prefsMock.mockReset().mockResolvedValue({ data: PREFS })
  savePrefsMock.mockReset()
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
    expect(wrapper.find('.back').attributes('href')).toBe('/en/agency/dashboard')
  })
})

describe('the working defaults and notifications', () => {
  it('loads what the agency saved into both tabs', async () => {
    const wrapper = await render()

    expect(wrapper.find('.prefs-form input[list]').element.value).toBe('Europe/Skopje')
    expect(wrapper.findAll('.prefs-form select').at(0).element.value).toBe('MKD')
    const switches = wrapper.findAll('.switch-row input')
    expect(switches.map((box) => box.element.checked)).toEqual([true, true, false, true])
  })

  it('saves the whole record, trimmed, from either tab', async () => {
    savePrefsMock.mockResolvedValue({ data: { ...PREFS, currency: 'EUR' } })
    const wrapper = await render()

    await wrapper.find('.prefs-form input[list]').setValue(' Europe/Berlin ')
    await wrapper.findAll('.prefs-form select').at(0).setValue('EUR')
    await wrapper.findAll('.switch-row input').at(2).setValue(true)
    await wrapper.find('.prefs-form').trigger('submit')
    await flushPromises()

    expect(savePrefsMock).toHaveBeenCalledWith(expect.objectContaining({
      timezone: 'Europe/Berlin', currency: 'EUR', language: 'mk', notifyRsvpReminders: true,
    }))
    expect(wrapper.text()).toContain('Settings saved.')
  })

  it('shows the server refusal instead of pretending it saved', async () => {
    savePrefsMock.mockRejectedValue({ detail: 'timezone is not a known time zone: Mars/Olympus' })
    const wrapper = await render()

    await wrapper.find('.prefs-form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.prefs-form + .error, [role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Settings saved.')
  })

  it('lets a member read them but not change them', async () => {
    roles.clear()
    roles.add('AGENCY_MEMBER')
    const wrapper = await render()

    expect(wrapper.find('.prefs-form input[list]').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('.switch-row input').every((box) => box.attributes('disabled') !== undefined)).toBe(true)
    expect(wrapper.text()).toContain('Only the agency owner can change these settings.')
    expect(wrapper.find('.prefs-form button[type="submit"]').exists()).toBe(false)
  })
})

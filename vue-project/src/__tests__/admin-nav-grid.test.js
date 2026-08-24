import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminOverviewPage from '@/pages/adminDashboard/AdminOverviewPage.vue'
import AdminSettingsPage from '@/pages/adminDashboard/AdminSettingsPage.vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'

/**
 * The admin quick-navigation grid and the settings page it points at (IVY-1103).
 *
 * <p>The property worth pinning is that every card goes somewhere real. A tile
 * leading to a blank screen teaches the reader to distrust the whole grid, so
 * the destinations are asserted by URL rather than by label.
 */

const { adminMock, riskWindow, setRiskWindow, organizers } = vi.hoisted(() => ({
  adminMock: vi.fn(), riskWindow: vi.fn(), setRiskWindow: vi.fn(), organizers: vi.fn(),
}))

vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    admin: adminMock,
    agency: vi.fn(),
    riskWindow: (...a) => riskWindow(...a),
    setRiskWindow: (...a) => setRiskWindow(...a),
  },
}))

vi.mock('@/services/organizers.service', () => ({
  organizersService: { list: (...a) => organizers(...a) },
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
  RouterLink: {
    props: ['to'],
    template: '<a :href="typeof to === \'string\' ? to : to.hash"><slot /></a>',
  },
}))

const PAYLOAD = {
  data: {
    totals: {
      eventCount: 76, guestCount: 100, childCount: 0, invitedCount: 10,
      confirmedCount: 5, respondedCount: 8, responseRate: 80, overdueTaskCount: 0,
    },
    statusBreakdown: { DRAFT: 2, PENDING: 0, ACTIVATED: 76 },
    upcoming: { next30: 1, next60: 2, next90: 3 },
    monthly: [{ month: '2026-08', count: 3 }],
    attention: { total: 0, overdueCount: 0, atRiskCount: 0, riskWindowDays: null, limit: 25, items: [] },
    definitions: {},
  },
}

beforeEach(() => {
  adminMock.mockReset().mockResolvedValue(PAYLOAD)
  riskWindow.mockReset().mockResolvedValue({ data: { riskWindowDays: 45, isDefault: false } })
  setRiskWindow.mockReset().mockResolvedValue({ data: { riskWindowDays: 60, isDefault: false } })
  organizers.mockReset().mockResolvedValue({ data: { rows: [{ orgId: 'org-1' }, { orgId: 'org-1' }, { orgId: 'org-2' }] } })
})

async function render(component, locale = 'en') {
  const i18n = createI18n({ legacy: false, locale, messages: { en, mk } })
  const wrapper = mount(component, { global: { plugins: [i18n] } })
  await flushPromises()
  return wrapper
}

describe('the grid', () => {
  it('offers five cards, each pointing at a destination that exists', async () => {
    const wrapper = await render(AdminOverviewPage)
    const hrefs = wrapper.findAll('.nav-card').map((card) => card.attributes('href'))

    expect(hrefs).toEqual([
      '/en/admin/events',
      '/en/admin/organizers',
      '/en/admin/vendor-queue',
      '#charts',
      '/en/admin/settings',
    ])
  })

  it('draws icons from utils/icons.js rather than emoji', async () => {
    const wrapper = await render(AdminOverviewPage)

    expect(wrapper.findAll('.nav-card .icon svg').length).toBe(5)
  })

  it('translates every card title when the locale changes', async () => {
    const english = await render(AdminOverviewPage)
    const macedonian = await render(AdminOverviewPage, 'mk')

    const titles = (w) => w.findAll('.nav-card .label').map((l) => l.text())
    expect(titles(english)).toEqual(['Events', 'Organizers', 'Professionals', 'Reports', 'Settings'])
    expect(titles(macedonian)).toEqual(['Настани', 'Организатори', 'Професионалци', 'Извештаи', 'Подесувања'])
  })

  it('shows the active-events badge from the same response the cards use', async () => {
    const wrapper = await render(AdminOverviewPage)

    expect(adminMock).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.nav-card .badge').text()).toContain('76')
  })

  it('renders no badge at zero — "Events 0" reads as a problem', async () => {
    adminMock.mockResolvedValueOnce({
      data: { ...PAYLOAD.data, statusBreakdown: { DRAFT: 2, PENDING: 0, ACTIVATED: 0 } },
    })
    const wrapper = await render(AdminOverviewPage)

    expect(wrapper.find('.nav-card .badge').exists()).toBe(false)
  })

  it('names the badge for a screen reader instead of leaving a bare number', async () => {
    const wrapper = await render(AdminOverviewPage)

    expect(wrapper.find('.nav-card .badge .sr-only').text()).toBe('active events')
  })

  it('draws no badge at all before the data arrives', async () => {
    let resolve
    adminMock.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, mk } })
    const wrapper = mount(AdminOverviewPage, { global: { plugins: [i18n] } })

    expect(wrapper.find('.badge').exists()).toBe(false)

    resolve(PAYLOAD)
    await flushPromises()
    expect(wrapper.find('.badge').exists()).toBe(true)
  })
})

describe('the settings page', () => {
  it('links to the four configuration screens, and to no category page that does not exist', async () => {
    const wrapper = await render(AdminSettingsPage)
    const hrefs = wrapper.findAll('.config-link').map((link) => link.attributes('href'))

    expect(hrefs).toEqual([
      '/en/admin/email-templates',
      '/en/admin/invitation-templates',
      '/en/admin/packages',
      '/en/admin/email-send',
    ])
  })

  it('suggests the organizations that actually have people in them, without repeating one', async () => {
    const wrapper = await render(AdminSettingsPage)
    const options = wrapper.findAll('#known-organizations option').map((o) => o.attributes('value'))

    expect(options).toEqual(['org-1', 'org-2'])
  })

  it('still works when the directory is unavailable — suggestions are a convenience', async () => {
    organizers.mockRejectedValueOnce(new Error('Service Unavailable'))
    const wrapper = await render(AdminSettingsPage)

    expect(wrapper.find('input[list="known-organizations"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('reads an organization\'s window and saves a new one', async () => {
    const wrapper = await render(AdminSettingsPage)

    await wrapper.find('input[list="known-organizations"]').setValue('org-1')
    await wrapper.findAll('button')[0].trigger('click')
    await flushPromises()

    expect(riskWindow).toHaveBeenCalledWith('org-1')
    expect(wrapper.find('input[type="number"]').element.value).toBe('45')

    await wrapper.find('input[type="number"]').setValue(60)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(setRiskWindow).toHaveBeenCalledWith('org-1', 60)
    expect(wrapper.find('[role="status"]').text()).toContain('Saved')
  })

  it('states a refused save rather than looking like it worked', async () => {
    setRiskWindow.mockRejectedValueOnce(new Error('Out of range'))
    const wrapper = await render(AdminSettingsPage)

    await wrapper.find('input[list="known-organizations"]').setValue('org-1')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('Out of range')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
})

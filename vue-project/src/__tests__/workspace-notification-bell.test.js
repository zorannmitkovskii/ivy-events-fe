import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import WorkspaceNotificationBell from '@/components/dashboard/shell/WorkspaceNotificationBell.vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/**
 * The agency and vendor consoles' bell (audit item 8). The event bell polls
 * one event and was silent here; this one reads what the platform addressed
 * to the person, their agency or their vendor.
 */

const service = vi.hoisted(() => ({
  page: vi.fn(),
  unreadCount: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}))

vi.mock('@/services/workspaceInbox.service', async (original) => ({
  ...(await original()),
  workspaceInboxService: service,
}))

const NOW = new Date().toISOString()
const ITEMS = [
  { id: 'n1', template: 'VENDOR_INQUIRY_RECEIVED', params: { organizerName: 'Ivana' }, createdAt: NOW, read: false },
  { id: 'n2', template: 'AGENCY_TASKS_OVERDUE', params: { count: 3 }, createdAt: NOW, read: false },
  { id: 'n3', template: 'SOMETHING_NEW', params: {}, createdAt: NOW, read: true },
]

function render(locale = 'en') {
  const i18n = createI18n({ legacy: false, locale, messages: { en, mk, sq } })
  return mount(WorkspaceNotificationBell, { global: { plugins: [i18n] }, attachTo: document.body })
}

async function openPanel(wrapper) {
  await wrapper.find('button').trigger('click')
  await flushPromises()
}

beforeEach(() => {
  vi.clearAllMocks()
  service.unreadCount.mockResolvedValue({ success: true, data: { count: 2 } })
  service.page.mockResolvedValue({ success: true, data: { items: ITEMS.map((item) => ({ ...item })), total: 3, unread: 2 } })
  service.markRead.mockResolvedValue(undefined)
  service.markAllRead.mockResolvedValue(undefined)
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('the workspace bell', () => {
  it('shows the unread dot without any event selected', async () => {
    const wrapper = render()
    await flushPromises()

    expect(service.unreadCount).toHaveBeenCalled()
    expect(wrapper.find('.dot').exists()).toBe(true)
  })

  it('titles each notice from its template, with its facts filled in', async () => {
    const wrapper = render()
    await openPanel(wrapper)

    expect(wrapper.findAll('.wbell-list p').map((node) => node.text()))
      .toEqual(['New inquiry from Ivana', 'Overdue tasks: 3', 'New notification'])
  })

  it("speaks the viewer's language", async () => {
    const wrapper = render('mk')
    await openPanel(wrapper)

    expect(wrapper.find('.wbell-list p').text()).toBe('Ново барање од Ivana')
  })

  it('marks one read on click, and only once', async () => {
    const wrapper = render()
    await openPanel(wrapper)

    await wrapper.findAll('.wbell-list li')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('.wbell-list li')[0].trigger('click')
    await flushPromises()

    expect(service.markRead).toHaveBeenCalledTimes(1)
    expect(service.markRead).toHaveBeenCalledWith('n1')
    expect(wrapper.findAll('.wbell-unread')).toHaveLength(1)
  })

  it('marks all read and drops the dot', async () => {
    const wrapper = render()
    await openPanel(wrapper)

    await wrapper.find('.wbell-head button').trigger('click')
    await flushPromises()

    expect(service.markAllRead).toHaveBeenCalled()
    expect(wrapper.findAll('.wbell-unread')).toHaveLength(0)
    expect(wrapper.find('.dot').exists()).toBe(false)
  })

  it('has every template titled in all three languages', () => {
    const templates = Object.keys(en.workspaceInbox.templates)
    expect(Object.keys(mk.workspaceInbox.templates)).toEqual(templates)
    expect(Object.keys(sq.workspaceInbox.templates)).toEqual(templates)
  })
})

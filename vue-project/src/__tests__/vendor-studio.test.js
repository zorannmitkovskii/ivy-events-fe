import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import VendorHomePage from '@/pages/vendorDashboard/VendorHomePage.vue'
import VendorInboxPage from '@/pages/vendorDashboard/VendorInboxPage.vue'
import PublicInquiryForm from '@/components/vendor/PublicInquiryForm.vue'
import VendorMicrosite from '@/components/vendor/VendorMicrosite.vue'
import en from '@/i18n/locales/en.json'

/**
 * The vendor studio (2026 vendor design): the home, the inbox pipeline, the
 * public inquiry form and the microsite's new sections.
 */

const service = vi.hoisted(() => ({
  home: vi.fn(),
  inbox: vi.fn(),
  metrics: vi.fn(),
  thread: vi.fn(),
  reply: vi.fn(),
  setWorkflow: vi.fn(),
  sendPublicInquiry: vi.fn(),
}))

vi.mock('@/services/vendorWorkspace.service', () => ({
  vendorWorkspaceService: service,
  unwrap: (response) => response?.data ?? response ?? null,
}))
vi.mock('@/services/inquiries.service', () => ({ inquiriesService: { respond: vi.fn() } }))
vi.mock('@/services/publicCatalog.service', () => ({
  publicCatalogService: { vendorTypes: vi.fn().mockResolvedValue({ data: [] }), eventCategories: vi.fn().mockResolvedValue({ data: [] }) },
}))
vi.mock('vue-router', async () => ({
  ...(await vi.importActual('vue-router')),
  useRoute: () => ({ params: { lang: 'en' }, query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const stubs = { RouterLink: { props: ['to'], template: '<a class="router-link"><slot /></a>' } }
const mountWith = (component, props = {}) => mount(component, { props, global: { plugins: [i18n], stubs } })

const HOME = {
  vendor: { id: 'v-1', name: 'Studio Lumière', type: 'PHOTOGRAPHY', slug: 'studio-lumiere', city: 'Skopje', approvalStatus: 'APPROVED' },
  kpis: { newInquiries: 1, awaitingReply: 2, upcomingEngagements: 2, micrositePublished: false },
  activities: [
    { kind: 'INQUIRY_NEW', inquiryId: 'i-1', name: 'Ivana Petrova', date: '2026-10-03' },
    { kind: 'MICROSITE_DRAFT' },
  ],
  readiness: { percent: 75, steps: [{ step: 'BASICS', done: true, missing: [] }, { step: 'PORTFOLIO', done: false, missing: ['cover'] }] },
  upcoming: [{ bookingId: 'b-1', title: 'North Summit', startsAt: '2026-10-17T09:00:00Z', status: 'HELD' }],
}

const inquiry = (overrides) => ({
  id: 'i-1', organizerName: 'Ivana Petrova', contactEmail: 'ivana@example.com', eventType: 'Wedding',
  eventDate: '2026-10-03T12:00:00Z', location: 'Skopje', guestCount: 120, requirements: 'Are you free?',
  status: 'SENT', workflowStatus: 'NEW', source: 'MICROSITE', createdAt: '2026-09-24T10:00:00Z', ...overrides,
})

beforeEach(() => {
  Object.values(service).forEach((fn) => fn.mockReset())
  service.metrics.mockResolvedValue({ data: { received: 2, byWorkflow: { NEW: 1, IN_CONVERSATION: 1 }, bySource: { MICROSITE: 1, IVY: 1 }, medianMinutes: 90 } })
  service.thread.mockResolvedValue({ data: [] })
})

describe('the vendor home', () => {
  it('leads with the inquiries and says what is keeping the page from bringing more', async () => {
    service.home.mockResolvedValue({ data: HOME })
    const wrapper = mountWith(VendorHomePage)
    await flushPromises()

    expect(wrapper.text()).toContain('Reply to Ivana Petrova')
    expect(wrapper.text()).toContain('Publish your public page')
    expect(wrapper.text()).toContain('75%')
    expect(wrapper.text()).toContain('Draft')
  })
})

describe('the inbox', () => {
  it('shows each inquiry with its pipeline status and source, and asks the server to filter', async () => {
    service.inbox.mockResolvedValue({ data: [inquiry({}), inquiry({ id: 'i-2', organizerName: 'North Summit', source: 'IVY', workflowStatus: 'IN_CONVERSATION' })] })
    const wrapper = mountWith(VendorInboxPage)
    await flushPromises()

    const rows = wrapper.findAll('.request')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Microsite')
    expect(rows[1].text()).toContain('In conversation')

    await wrapper.findAll('select').at(0).setValue('NEW')
    await flushPromises()
    expect(service.inbox).toHaveBeenLastCalledWith(expect.objectContaining({ workflow: 'NEW' }))
  })

  it('sends a reply and reloads, so the new status is the server\'s', async () => {
    service.inbox.mockResolvedValue({ data: [inquiry({})] })
    service.reply.mockResolvedValue({ data: {} })
    const wrapper = mountWith(VendorInboxPage)
    await flushPromises()

    await wrapper.find('textarea').setValue('Yes, we are free.')
    await wrapper.find('form.reply').trigger('submit')
    await flushPromises()

    expect(service.reply).toHaveBeenCalledWith('i-1', 'Yes, we are free.')
    expect(service.inbox).toHaveBeenCalledTimes(2)
  })

  it('moves an inquiry by hand', async () => {
    service.inbox.mockResolvedValue({ data: [inquiry({})] })
    service.setWorkflow.mockResolvedValue({ data: inquiry({ workflowStatus: 'BOOKED' }) })
    const wrapper = mountWith(VendorInboxPage)
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text() === 'Mark: booked').trigger('click')
    await flushPromises()

    expect(service.setWorkflow).toHaveBeenCalledWith('i-1', 'BOOKED')
    expect(wrapper.find('.request').text()).toContain('Booked')
  })

  it('offers accept and decline only on an Ivy inquiry still waiting for them', async () => {
    service.inbox.mockResolvedValue({ data: [inquiry({ source: 'IVY' })] })
    const wrapper = mountWith(VendorInboxPage)
    await flushPromises()
    expect(wrapper.text()).toContain('Accept')

    service.inbox.mockResolvedValue({ data: [inquiry({ source: 'MICROSITE' })] })
    const microsite = mountWith(VendorInboxPage)
    await flushPromises()
    expect(microsite.text()).not.toContain('Accept')
  })
})

describe('the public inquiry form', () => {
  const fill = async (wrapper, overrides = {}) => {
    const values = { name: 'Ana', email: 'ana@example.com', date: '2099-10-03', city: 'Ohrid', message: 'A wedding for 80.', ...overrides }
    const inputs = wrapper.findAll('input')
    await inputs.at(0).setValue(values.name)
    await inputs.at(1).setValue(values.email)
    await inputs.at(2).setValue(values.date)
    await inputs.at(3).setValue(values.city)
    await wrapper.find('textarea').setValue(values.message)
    await wrapper.find('.consent input').setValue(true)
  }

  it('sends to the vendor by slug and thanks the visitor', async () => {
    service.sendPublicInquiry.mockResolvedValue({ data: { received: true } })
    const wrapper = mountWith(PublicInquiryForm, { slug: 'studio-lumiere' })
    await fill(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(service.sendPublicInquiry).toHaveBeenCalledWith('studio-lumiere', expect.objectContaining({
      name: 'Ana', email: 'ana@example.com', city: 'Ohrid', consent: true, website: '',
    }))
    expect(wrapper.text()).toContain('Thank you!')
  })

  it('names a bad email before any request', async () => {
    const wrapper = mountWith(PublicInquiryForm, { slug: 'studio-lumiere' })
    await fill(wrapper, { email: 'not-an-email' })

    await wrapper.find('form').trigger('submit')

    expect(service.sendPublicInquiry).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Enter a valid email.')
  })

  it('never sends from the vendor\'s own preview', async () => {
    const wrapper = mountWith(PublicInquiryForm, { slug: 'studio-lumiere', disabled: true })
    await fill(wrapper)

    await wrapper.find('form').trigger('submit')

    expect(service.sendPublicInquiry).not.toHaveBeenCalled()
  })
})

describe('the microsite sections', () => {
  const vendor = { name: 'Studio Lumière', type: 'PHOTOGRAPHY', city: 'Skopje' }
  const media = [{ id: 'm-1', kind: 'IMAGE', url: '/a.jpg', title: 'Evening' }]
  const details = { tagline: 'Stories told with light.' }
  const content = {
    hero: { title: 'Studio Lumière', text: 'Stories told with light.' },
    services: [{ name: 'Weddings' }, { name: 'Conferences' }],
    gallery: [{ mediaId: 'm-1', caption: 'Evening' }],
    faq: [{ question: 'How early?', answer: 'As early as you can.' }],
  }

  it('draws services, FAQ and the contact form when switched on', () => {
    const wrapper = mountWith(VendorMicrosite, {
      vendor, media, details, content, theme: 'EDITORIAL', slug: 'studio-lumiere', sections: {},
    })

    expect(wrapper.findAll('.service-row')).toHaveLength(2)
    expect(wrapper.text()).toContain('How early?')
    expect(wrapper.text()).toContain('Stories told with light.')
    expect(wrapper.find('#ms-contact form').exists()).toBe(true)
  })

  it('hides what the vendor switched off, but never the form', () => {
    const wrapper = mountWith(VendorMicrosite, {
      vendor, media, details, content, theme: 'EDITORIAL', slug: 'studio-lumiere',
      sections: { gallery: false, services: false, faq: false },
    })

    expect(wrapper.find('.folio').exists()).toBe(false)
    expect(wrapper.find('.services').exists()).toBe(false)
    expect(wrapper.find('.faq').exists()).toBe(false)
    expect(wrapper.find('#ms-contact form').exists()).toBe(true)
  })
})

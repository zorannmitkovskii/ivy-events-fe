import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createMemoryHistory, createRouter } from 'vue-router'
import AgencyMicrosite from '@/components/agency/microsite/AgencyMicrosite.vue'
import AgencyInquiryForm from '@/components/agency/microsite/AgencyInquiryForm.vue'
import en from '@/i18n/locales/en.json'

/**
 * The agency's public site: one content document, four layouts
 * (design/Ivy_Events_Agency_Microsite_Designs.html), and a form that lands
 * in the agency's pipeline.
 */

const sendInquiry = vi.fn()
vi.mock('@/services/agencySite.service', () => ({
  agencySiteService: { sendInquiry: (...args) => sendInquiry(...args) },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }] })

const site = (overrides = {}) => ({
  slug: 'ivena',
  name: 'Ivena Agency',
  model: 'CLASSIC',
  city: 'Skopje',
  email: 'hello@ivena.mk',
  imageUrls: { 'uploads/agency/o/hero.jpg': 'https://img.test/hero.jpg' },
  tags: [{ slug: 'konferencii', name: 'Conferences' }],
  content: {
    hero: { eyebrow: 'Event planning', title: 'Events with', titleAccent: 'a clear plan.', text: 'From the first call.',
      ctaLabel: 'Talk to us', secondaryLabel: 'See the approach', caption: 'Idea · Plan', imageKey: 'uploads/agency/o/hero.jpg' },
    keywords: ['Private events', 'Conferences'],
    services: { eyebrow: 'Services', title: 'From concept to detail.' },
    serviceItems: [{ label: '01 / Plan', symbol: '◇', name: 'Concept', description: 'Goal and budget.' }],
    projects: { title: 'Different formats.' },
    statement: { eyebrow: 'Approach', title: 'The plan makes room.' },
    chapters: [{ eyebrow: 'Chapter 01', title: 'We start with the goal.', text: 'Guests and context.' }],
    process: { title: 'Three clear steps.' },
    steps: [{ title: 'Talk', description: 'What you plan.' }, { title: 'Proposal', description: 'Scope.' }],
    formats: { title: 'Different needs.' },
    formatItems: [{ title: 'Conferences', description: 'Agenda and speakers.' }],
    contact: { eyebrow: 'New request', title: 'Tell us what you plan.' },
  },
  projects: [
    { id: 'p1', title: 'Annual conference', city: 'Skopje', eventType: 'Conference', media: [{ id: 'm1', url: 'https://img.test/p1.jpg', caption: 'Stage' }] },
    { id: 'p2', title: 'Summer party', city: 'Ohrid', eventType: 'Corporate', media: [] },
  ],
  ...overrides,
})

function render(props = {}) {
  return mount(AgencyMicrosite, { props: { site: site(), lang: 'en', ...props }, global: { plugins: [i18n, router] } })
}

beforeEach(() => {
  sendInquiry.mockReset()
  document.head.innerHTML = ''
})

describe('the four layouts', () => {
  it.each([
    ['CLASSIC', 'am-classic', '.am-service-grid'],
    ['PORTFOLIO', 'am-portfolio', '.am-tiles'],
    ['EDITORIAL', 'am-editorial', '.am-chapter'],
    ['CORPORATE', 'am-corporate', '.am-format-grid'],
  ])('%s draws its own sections', (model, rootClass, signature) => {
    const wrapper = render({ site: site({ model }) })

    expect(wrapper.classes()).toContain('agency-site')
    expect(wrapper.classes()).toContain(rootClass)
    expect(wrapper.find(signature).exists()).toBe(true)
    expect(wrapper.find('.am-request-form').exists()).toBe(true)
  })

  it('falls back to the classic layout for a model it does not know', () => {
    expect(render({ site: site({ model: 'NEON' }) }).classes()).toContain('am-classic')
  })

  it('sets the accent of the title apart, as the design does', () => {
    const accent = render().find('.am-hero h1 em')

    expect(accent.text()).toBe('a clear plan.')
  })

  it('shows the uploaded hero photo and tints a project that has none', () => {
    const wrapper = render()

    expect(wrapper.find('.am-hero-image').attributes('style')).toContain('https://img.test/hero.jpg')
    const cases = wrapper.findAll('.am-case-grid .am-photo')
    expect(cases[1].classes().some((c) => c.startsWith('am-tint-'))).toBe(true)
  })

  it('lists the projects with what and where', () => {
    expect(render().find('.am-case-grid').text()).toContain('Conference · Skopje')
  })

  it('leaves out a section the agency left empty', () => {
    const content = { ...site().content, serviceItems: [] }
    const wrapper = render({ site: site({ content }) })

    expect(wrapper.find('#am-services').exists()).toBe(false)
  })

  it('links every tag to its topic page', () => {
    const link = render().find('.am-tags a')

    expect(link.attributes('href')).toBe('/en/tags/konferencii')
    expect(link.text()).toBe('Conferences')
  })

  it('loads the design fonts once, on this page only', async () => {
    render()
    render()
    await flushPromises()

    expect(document.head.querySelectorAll('#agency-site-fonts')).toHaveLength(1)
  })
})

describe('the request form', () => {
  function fill(wrapper) {
    wrapper.find('input[name="name"]').setValue('Ana Petrova')
    wrapper.find('input[name="email"]').setValue('ana@example.com')
    wrapper.find('select[name="type"]').setValue('Conference')
    wrapper.find('input[name="date"]').setValue('12 October')
    wrapper.find('input[name="city"]').setValue('Skopje')
    wrapper.find('textarea[name="message"]').setValue('Annual partner conference.')
    wrapper.find('input[name="consent"]').setValue(true)
  }

  const form = (props = {}) => mount(AgencyInquiryForm, { props: { slug: 'ivena', ...props }, global: { plugins: [i18n] } })

  it('sends the design fields to the agency and thanks the visitor', async () => {
    sendInquiry.mockResolvedValue({ received: true })
    const wrapper = form()
    fill(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(sendInquiry).toHaveBeenCalledWith('ivena', expect.objectContaining({
      name: 'Ana Petrova', email: 'ana@example.com', type: 'Conference', date: '12 October',
      city: 'Skopje', consent: true, website: '',
    }))
    expect(wrapper.find('.am-form-success').exists()).toBe(true)
  })

  it('asks for the required fields before sending anything', async () => {
    const wrapper = form()

    await wrapper.find('form').trigger('submit')

    expect(sendInquiry).not.toHaveBeenCalled()
    expect(wrapper.find('.am-error').exists()).toBe(true)
  })

  it('sends nothing from the editor preview', async () => {
    const wrapper = form({ preview: true })
    fill(wrapper)

    await wrapper.find('form').trigger('submit')

    expect(sendInquiry).not.toHaveBeenCalled()
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('says why when the server refuses', async () => {
    sendInquiry.mockRejectedValue({ status: 429, message: 'Too many requests.' })
    const wrapper = form()
    fill(wrapper)

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.am-error').exists()).toBe(true)
    expect(wrapper.find('.am-form-success').exists()).toBe(false)
  })
})

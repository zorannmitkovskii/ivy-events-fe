import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import VendorMicrosite from '@/components/vendor/VendorMicrosite.vue'
import en from '@/i18n/locales/en.json'

/**
 * The supplier's public page: four models from the 2026 microsite design.
 *
 * <p>Each model is its own layout now, so what the tests hold down is that
 * each draws the sections its design has, from the content the server sends,
 * and that the shared parts — the form, the topics, the footer — are in all
 * four. A heading the vendor left empty is the page's own default, never blank.
 */

vi.mock('@/services/vendorWorkspace.service', () => ({ vendorWorkspaceService: { sendPublicInquiry: vi.fn() } }))
vi.mock('@/services/publicCatalog.service', () => ({
  publicCatalogService: { eventCategories: vi.fn().mockResolvedValue({ data: [] }) },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const THEMES = { CLASSIC: 'classic', GALLERY: 'gallery', STAGE: 'scene', EDITORIAL: 'textual' }

const VENDOR = {
  name: 'Studio Lumière',
  type: 'PHOTOGRAPHY',
  city: 'Skopje',
  website: 'https://lumiere.mk',
  instagramUrl: 'https://instagram.com/studiolumiere',
}

const MEDIA = [
  { id: 'm-1', kind: 'IMAGE', url: '/1.jpg', title: 'People' },
  { id: 'm-2', kind: 'IMAGE', url: '/2.jpg', title: 'Party' },
  { id: 'm-3', kind: 'IMAGE', url: '/3.jpg', title: 'Details' },
  { id: 'm-4', kind: 'IMAGE', url: '/4.jpg', title: 'Stage' },
  { id: 'v-1', kind: 'VIDEO', url: 'https://youtu.be/x', title: 'Showreel' },
]

const CONTENT = {
  hero: { title: 'Moments that', titleAccent: 'last.', text: 'Documentary photography.', caption: 'Your event, your story.', mediaId: 'm-1' },
  eventTypes: ['Weddings', 'Private events'],
  services: [{ label: 'Personal', name: 'Weddings', description: 'The whole day.' }, { name: 'Corporate' }],
  gallery: [{ mediaId: 'm-2', caption: 'Party' }, { mediaId: 'm-3', caption: 'Details' }, { mediaId: 'm-4' }],
  quote: { text: 'Good photos carry the atmosphere.', attribution: 'Studio · Skopje' },
  approach: { title: 'Every event has a plan.', text: 'We watch what happens in between.' },
  chapters: [
    { eyebrow: 'Chapter 01 / People', title: 'Everyone who makes the day.', mediaId: 'm-2' },
    { title: 'Details give context.', mediaId: 'm-3' },
  ],
  faq: [{ question: 'Do you travel?', answer: 'Yes.' }],
}

function render(props = {}) {
  return mount(VendorMicrosite, {
    props: { vendor: VENDOR, media: MEDIA, content: CONTENT, slug: 'studio-lumiere', ...props },
    global: { plugins: [i18n] },
  })
}

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

afterEach(() => {
  document.getElementById('ivy-microsite-fonts')?.remove()
})

describe('the model', () => {
  it('draws the design model for each stored theme', () => {
    for (const [theme, model] of Object.entries(THEMES)) {
      expect(render({ theme }).find('.vms').attributes('data-model'), theme).toBe(model)
    }
  })

  it('falls back to the classic model for a theme it does not know', () => {
    expect(render({ theme: 'NEON' }).find('.vms').attributes('data-model')).toBe('classic')
  })

  it('keeps the form, the recordings and the footer in all four', () => {
    for (const theme of Object.keys(THEMES)) {
      const wrapper = render({ theme })

      expect(wrapper.find('#ms-contact form').exists(), theme).toBe(true)
      expect(wrapper.find('.ms-extras').text(), theme).toContain('Showreel')
      expect(wrapper.find('.site-foot').text(), theme).toContain('@studiolumiere')
    }
  })

  it('loads the design fonts once, on the microsite only', () => {
    render()
    render({ theme: 'GALLERY' })

    expect(document.querySelectorAll('#ivy-microsite-fonts')).toHaveLength(1)
  })
})

describe('classic', () => {
  it('draws the headline with its accent, the band, the services and three pictures', () => {
    const wrapper = render({ theme: 'CLASSIC' })

    expect(wrapper.find('.hero-copy h1').text()).toBe('Moments that last.')
    expect(wrapper.find('.hero-copy h1 em').text()).toBe('last.')
    expect(wrapper.find('.floating').text()).toContain('Your event, your story.')
    expect(wrapper.find('.statement').text()).toContain('Weddings')
    expect(wrapper.findAll('.service')).toHaveLength(2)
    expect(wrapper.find('.service .number').text()).toBe('01 / Personal')
    expect(wrapper.findAll('.gallery-three .photo')).toHaveLength(3)
    expect(wrapper.find('.quote').text()).toContain('Good photos carry the atmosphere.')
  })

  it('draws the page default where the vendor left a heading empty', () => {
    const wrapper = render({ theme: 'CLASSIC' })

    expect(wrapper.find('#ms-services h2').text()).toBe(en.vendorMicrosite.common.servicesTitle)
    expect(wrapper.find('#ms-contact h2').text()).toBe(en.vendorMicrosite.common.contactTitle)
  })

  it('leaves out a quote and a band nobody wrote', () => {
    const wrapper = render({ theme: 'CLASSIC', content: { hero: { title: 'Studio' } } })

    expect(wrapper.find('.quote').exists()).toBe(false)
    expect(wrapper.find('.statement').exists()).toBe(false)
    expect(wrapper.find('.hero-image').classes()).toContain('empty')
  })
})

describe('gallery', () => {
  it('draws every chosen picture in the mosaic, numbered', () => {
    const wrapper = render({ theme: 'GALLERY' })
    const tiles = wrapper.findAll('.mosaic .photo')

    expect(tiles).toHaveLength(3)
    expect(tiles[0].text()).toBe('Party · 01')
    expect(wrapper.find('.gallery-info').text()).toContain('01 — 03')
  })

  it('opens a picture in the lightbox', async () => {
    const wrapper = render({ theme: 'GALLERY' })

    await wrapper.findAll('.mosaic .photo')[1].trigger('click')

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
    expect(wrapper.find('dialog p').text()).toBe('Details · 02')
  })

  it('lists the services by name only, as the design does', () => {
    const items = render({ theme: 'GALLERY' }).findAll('.offer li')

    expect(items.map((item) => item.text())).toEqual(['01 Weddings', '02 Corporate'])
  })
})

describe('scene', () => {
  it('alternates the chapters and numbers the process', () => {
    const wrapper = render({ theme: 'STAGE' })
    const chapters = wrapper.findAll('.chapter')

    expect(chapters).toHaveLength(2)
    expect(chapters[1].classes()).toContain('reverse')
    expect(chapters[1].find('.eyebrow').text()).toBe('Chapter 02')
    expect(wrapper.find('.intro h2').text()).toBe('Every event has a plan.')
  })

  it('shows the standard three steps when the vendor wrote none', () => {
    const steps = render({ theme: 'STAGE' }).findAll('.step h3')

    expect(steps.map((step) => step.text())).toEqual([
      en.vendorMicrosite.common.steps.request.title,
      en.vendorMicrosite.common.steps.offer.title,
      en.vendorMicrosite.common.steps.agreement.title,
    ])
  })
})

describe('textual', () => {
  it('draws two folio pictures, the approach, the service rows and the questions', () => {
    const wrapper = render({ theme: 'EDITORIAL' })

    expect(wrapper.findAll('.folio .photo')).toHaveLength(2)
    expect(wrapper.find('.folio .caption').text()).toBe('01 / Party')
    expect(wrapper.find('.big-note h2').text()).toBe('Every event has a plan.')
    expect(wrapper.findAll('.service-row')).toHaveLength(2)
    expect(wrapper.find('details summary').text()).toBe('Do you travel?')
  })
})

describe('the sections the vendor switches', () => {
  it('turning the gallery off hides the pictures in every model that has them', () => {
    const off = { gallery: false }

    expect(render({ theme: 'CLASSIC', sections: off }).find('.gallery-three').exists()).toBe(false)
    expect(render({ theme: 'GALLERY', sections: off }).find('.mosaic').exists()).toBe(false)
    expect(render({ theme: 'EDITORIAL', sections: off }).find('.folio').exists()).toBe(false)
  })
})

describe('what connects the vendor to the rest of Ivy', () => {
  it('links their topics and the articles that share them', () => {
    const vendor = {
      ...VENDOR,
      tags: [{ slug: 'weddings', name: 'Weddings' }],
      relatedPosts: [{ slug: 'ten-ideas', title: 'Ten ideas' }],
    }
    const extras = render({ vendor }).find('.ms-extras')

    expect(extras.find('.ms-chips a').attributes('href')).toBe('/en/tags/weddings')
    expect(extras.find('.ms-list a').attributes('href')).toBe('/en/blog/ten-ideas')
  })

  it('draws nothing when there is nothing to connect', () => {
    expect(render({ media: MEDIA.slice(0, 4) }).find('.ms-extras').exists()).toBe(false)
  })
})

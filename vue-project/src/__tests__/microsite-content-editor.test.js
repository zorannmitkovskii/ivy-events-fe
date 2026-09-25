import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import MicrositeContentEditor from '@/components/vendor/microsite/MicrositeContentEditor.vue'
import en from '@/i18n/locales/en.json'

/**
 * The microsite's content tab: the sections the chosen model draws, and the
 * whole wording sent back on save.
 */

const service = vi.hoisted(() => ({
  microsite: vi.fn(),
  saveMicrositeContent: vi.fn(),
  saveMicrositeSettings: vi.fn(),
  setTheme: vi.fn(),
  publish: vi.fn(),
}))

vi.mock('@/services/vendorWorkspace.service', () => ({
  vendorWorkspaceService: service,
  unwrap: (response) => response?.data ?? response ?? null,
}))
vi.mock('@/services/vendorPortal.service', () => ({
  vendorPortalService: { listMedia: vi.fn().mockResolvedValue([{ id: 'm-1', kind: 'IMAGE', url: '/1.jpg', title: 'People' }]) },
}))
vi.mock('@/composables/useVendorProfile', async () => {
  const { ref } = await vi.importActual('vue')
  return { useVendorProfile: () => ({ profile: ref({ name: 'Studio Lumière', approvalStatus: 'APPROVED' }), load: vi.fn(), reset: vi.fn() }) }
})

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })
const MEDIA = [
  { id: 'm-1', kind: 'IMAGE', url: '/1.jpg', title: 'People' },
  { id: 'm-2', kind: 'IMAGE', url: '/2.jpg', title: 'Party' },
  { id: 'v-1', kind: 'VIDEO', url: 'https://youtu.be/x' },
]

const render = (props = {}) => mount(MicrositeContentEditor, {
  props: { content: {}, theme: 'CLASSIC', media: MEDIA, vendorName: 'Studio Lumière', ...props },
  global: { plugins: [i18n] },
})

const legends = (wrapper) => wrapper.findAll('legend').map((legend) => legend.text())
const section = en.vendorMicrosite.editor.section

describe('the sections asked for', () => {
  it('follow the chosen model', () => {
    expect(legends(render({ theme: 'CLASSIC' }))).toEqual(
      [section.hero, section.eventTypes, section.services, section.gallery, section.quote, section.contact])
    expect(legends(render({ theme: 'GALLERY' }))).toEqual([section.hero, section.services, section.gallery, section.contact])
    expect(legends(render({ theme: 'STAGE' }))).toEqual([section.hero, section.intro, section.chapters, section.steps, section.contact])
    expect(legends(render({ theme: 'EDITORIAL' }))).toEqual(
      [section.hero, section.approach, section.services, section.gallery, section.faq, section.contact])
  })

  it('offers only pictures from the portfolio, never a recording', () => {
    expect(render().findAll('.picker .thumb')).toHaveLength(2)
  })
})

describe('saving', () => {
  it('sends the whole wording, with the pictures chosen in order', async () => {
    const wrapper = render({ content: { hero: { title: 'Moments that' }, eventTypes: ['Weddings'] } })

    await wrapper.find('input[placeholder="Studio Lumière"]').setValue('Moments that last')
    await wrapper.findAll('.picker .thumb')[1].trigger('click')
    await wrapper.findAll('.picker .thumb')[0].trigger('click')
    await wrapper.find('form').trigger('submit')

    const [sent] = wrapper.emitted('save')[0]
    expect(sent.hero.title).toBe('Moments that last')
    expect(sent.hero.mediaId).toBeNull()
    expect(sent.eventTypes).toEqual(['Weddings'])
    expect(sent.gallery.map((item) => item.mediaId)).toEqual(['m-2', 'm-1'])
  })

  it('adds, reorders and removes list rows', async () => {
    const wrapper = render({ theme: 'STAGE', content: { steps: [{ title: 'Request' }, { title: 'Offer' }] } })
    const steps = () => wrapper.findAll('fieldset')[3]

    await steps().findAll('.row')[1].find('button').trigger('click')
    await steps().find('.add').trigger('click')
    await steps().findAll('.row')[0].find('.remove').trigger('click')
    await wrapper.find('form').trigger('submit')

    const [sent] = wrapper.emitted('save')[0]
    expect(sent.steps.map((step) => step.title)).toEqual(['Request', null])
  })
})

describe('the microsite page', () => {
  it('saves the content tab through the portal and redraws from the answer', async () => {
    const { default: VendorMicrositePage } = await import('@/pages/vendorDashboard/VendorMicrositePage.vue')
    service.microsite.mockResolvedValue({ data: { theme: 'STAGE', sections: {}, content: { hero: { title: 'Saved' } } } })
    service.saveMicrositeContent.mockResolvedValue({ data: { theme: 'STAGE', sections: {}, content: { hero: { title: 'Again' } } } })

    const wrapper = mount(VendorMicrositePage, {
      global: { plugins: [i18n], stubs: { RouterLink: { template: '<a><slot /></a>' }, PageHead: { template: '<div><slot name="actions" /></div>' } } },
    })
    await flushPromises()
    await wrapper.findAll('[role="tab"]')[1].trigger('click')
    await wrapper.find('.content-editor').trigger('submit')
    await flushPromises()

    expect(service.saveMicrositeContent).toHaveBeenCalledWith(expect.objectContaining({ hero: expect.objectContaining({ title: 'Saved' }) }))
    expect(wrapper.find('.content-editor input[placeholder="Studio Lumière"]').element.value).toBe('Again')
  })
})

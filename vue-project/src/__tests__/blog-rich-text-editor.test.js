import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import RichTextEditor from '@/components/admin/blog/RichTextEditor.vue'
import en from '@/i18n/locales/en.json'

/**
 * The blog body editor (IVY-906).
 *
 * <p>The toolbar is the contract with the backend safelist: every tool here
 * produces a tag the server keeps, and nothing else is offered.
 */

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

describe('RichTextEditor', () => {
  it('offers exactly the tools whose output the server keeps', async () => {
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: '', label: 'Body' },
      global: { plugins: [i18n] },
    })
    await flushPromises()

    const labels = wrapper.findAll('.rte-bar button').map((button) => button.attributes('aria-label'))
    expect(labels).toEqual([
      en.adminBlog.editor.h2,
      en.adminBlog.editor.h3,
      en.adminBlog.editor.bold,
      en.adminBlog.editor.italic,
      en.adminBlog.editor.bulletList,
      en.adminBlog.editor.orderedList,
      en.adminBlog.editor.blockquote,
      en.adminBlog.editor.link,
      en.adminBlog.editor.callout,
      en.adminBlog.editor.checklist,
      en.adminBlog.editor.pullquote,
      en.adminBlog.editor.figure,
      en.adminBlog.editor.gallery,
    ])
    wrapper.unmount()
  })

  it('shows the saved body it is given', async () => {
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: '<h2>Сала</h2><p><strong>Прво</strong> гостите</p>', label: 'Body' },
      global: { plugins: [i18n] },
    })
    await flushPromises()

    const document = wrapper.find('.ProseMirror')
    expect(document.find('h2').text()).toBe('Сала')
    expect(document.find('strong').text()).toBe('Прво')
    wrapper.unmount()
  })

  it('opens a saved tip, checklist, pull quote and photo strip as the same blocks (round trip)', async () => {
    const saved = '<aside class="callout"><p><strong>Совет</strong></p><p>текст</p></aside>'
      + '<ul class="checklist"><li><p>прва</p></li></ul>'
      + '<blockquote class="pullquote"><p>цитат</p></blockquote>'
      + '<figure class="gallery"><img src="https://cdn.ivy.mk/a.jpg" alt="а"><img src="https://cdn.ivy.mk/b.jpg" alt="б"><figcaption>две</figcaption></figure>'
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: saved, label: 'Body', 'onUpdate:modelValue': () => {} },
      global: { plugins: [i18n] },
    })
    await flushPromises()

    // An edit makes the editor write the document back out: what it writes
    // is what gets saved.
    await wrapper.findAll('.rte-bar button').find((b) => b.attributes('aria-label') === en.adminBlog.editor.pullquote)
      .trigger('click')
    const html = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(html).toContain('<p><strong>Совет</strong></p><p>текст</p></aside>')
    expect(html).toContain('<ul class="checklist"><li><p>прва</p></li></ul>')
    expect(html).toContain('<blockquote class="pullquote"><p>цитат</p></blockquote>')
    expect(html).toContain('<figure class="gallery"><img src="https://cdn.ivy.mk/a.jpg" alt="а"><img src="https://cdn.ivy.mk/b.jpg" alt="б"><figcaption>две</figcaption></figure>')
    wrapper.unmount()
  })

  it('inserts a tip with starter text the editor then overwrites', async () => {
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: '<p>почеток</p>', label: 'Body', 'onUpdate:modelValue': () => {} },
      global: { plugins: [i18n] },
    })
    await flushPromises()

    await wrapper.findAll('.rte-bar button').find((b) => b.attributes('aria-label') === en.adminBlog.editor.callout)
      .trigger('click')
    await flushPromises()

    const emitted = wrapper.emitted('update:modelValue').at(-1)[0]
    expect(emitted).toContain('<aside class="callout">')
    expect(emitted).toContain(en.adminBlog.editor.calloutTitle)
    wrapper.unmount()
  })

  it('offers the photo form only when asked, and inserts nothing without a photo', async () => {
    const wrapper = mount(RichTextEditor, {
      props: { modelValue: '', label: 'Body' },
      global: { plugins: [i18n] },
    })
    await flushPromises()
    expect(wrapper.find('.rte-media').exists()).toBe(false)

    await wrapper.findAll('.rte-bar button').find((b) => b.attributes('aria-label') === en.adminBlog.editor.gallery)
      .trigger('click')

    const form = wrapper.find('.rte-media')
    expect(form.exists()).toBe(true)
    expect(form.find('input[type="file"]').attributes('multiple')).toBeDefined()
    expect(form.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

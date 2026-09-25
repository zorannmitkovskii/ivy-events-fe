import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import CoverImageField from '@/components/admin/blog/CoverImageField.vue'
import en from '@/i18n/locales/en.json'

/** A blog post's cover image field (IVY-906). */

const { uploadImage } = vi.hoisted(() => ({ uploadImage: vi.fn() }))

vi.mock('@/services/content.service', () => ({
  contentService: { uploadImage },
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

beforeEach(() => uploadImage.mockReset())

function render() {
  return mount(CoverImageField, {
    props: { imageKey: '', imageUrl: '' },
    global: { plugins: [i18n] },
  })
}

async function choose(wrapper, file) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}

describe('CoverImageField', () => {
  it('refuses a PDF without uploading it', async () => {
    const wrapper = render()

    await choose(wrapper, new File(['%PDF'], 'brochure.pdf', { type: 'application/pdf' }))

    expect(uploadImage).not.toHaveBeenCalled()
    expect(wrapper.find('[role="alert"]').text()).toBe(en.adminBlog.cover.wrongType)
  })

  it('uploads a PNG and hands back the key to save and the URL to show', async () => {
    uploadImage.mockResolvedValue({ data: { key: 'uploads/blog/a.png', url: 'http://be/public/images/uploads/blog/a.png' } })
    const wrapper = render()

    await choose(wrapper, new File(['png'], 'cover.png', { type: 'image/png' }))

    expect(uploadImage).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('update:imageKey')?.at(-1)).toEqual(['uploads/blog/a.png'])
    expect(wrapper.emitted('update:imageUrl')?.at(-1)).toEqual(['http://be/public/images/uploads/blog/a.png'])
  })
})

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import TagInput from '@/components/admin/blog/TagInput.vue'
import en from '@/i18n/locales/en.json'

/** The tag chips in the blog editor (IVY-906). */

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

function render(tags = []) {
  const wrapper = mount(TagInput, {
    props: {
      modelValue: tags,
      inputId: 'tags',
      'onUpdate:modelValue': (next) => wrapper.setProps({ modelValue: next }),
    },
    global: { plugins: [i18n] },
  })
  return wrapper
}

describe('TagInput', () => {
  it('turns what was typed into normalized chips on Enter', async () => {
    const wrapper = render()

    await wrapper.find('input').setValue('Свадба, Мала Сала')
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.props('modelValue')).toEqual(['свадба', 'мала сала'])
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('takes the last chip back with Backspace in an empty field', async () => {
    const wrapper = render(['сала', 'свадба'])

    await wrapper.find('input').trigger('keydown', { key: 'Backspace' })

    expect(wrapper.props('modelValue')).toEqual(['сала'])
  })

  it('says why a tag was refused and keeps the text to fix', async () => {
    const wrapper = render()

    await wrapper.find('input').setValue('а'.repeat(40))
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.find('[role="alert"]').text()).toContain('28')
    expect(wrapper.find('input').element.value).toHaveLength(40)
    expect(wrapper.props('modelValue')).toEqual([])
  })
})

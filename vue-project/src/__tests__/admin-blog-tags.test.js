import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import AdminBlogTagsPage from '@/pages/adminDashboard/blog/AdminBlogTagsPage.vue'
import en from '@/i18n/locales/en.json'

/**
 * The Tags page (IVY-909): a name per language per tag, saved as one object,
 * and deleting from every post only after saying how many.
 */

const service = vi.hoisted(() => ({ tags: vi.fn(), renameTag: vi.fn(), removeTag: vi.fn() }))

vi.mock('@/services/content.service', () => ({ contentService: service }))

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { lang: 'en' } }),
}))

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const sala = () => ({
  id: 't-1', slug: 'сала', names: { mk: 'сала' }, postCount: 3, missingLocales: ['en', 'sq'],
})

const band = () => ({
  id: 't-2', slug: 'бенд', names: { mk: 'бенд', en: 'band', sq: 'grup' }, postCount: 0, missingLocales: [],
})

async function render(list = [sala(), band()]) {
  service.tags.mockResolvedValue({ data: list })
  const wrapper = mount(AdminBlogTagsPage, {
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: { props: ['to'], template: '<a><slot /></a>' },
        PageHead: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

const row = (wrapper, slug) => wrapper.find(`tr[data-slug="${slug}"]`)
const nameInputs = (wrapper, slug) => row(wrapper, slug).findAll('input[type="text"]')
const button = (scope, text) => scope.findAll('button').find((candidate) => candidate.text() === text)

beforeEach(() => {
  for (const mock of Object.values(service)) mock.mockReset()
})

describe('the tags page', () => {
  it('shows each tag with a name per language and marks the missing ones', async () => {
    const wrapper = await render()
    const inputs = nameInputs(wrapper, 'сала')

    expect(inputs.map((input) => input.element.value)).toEqual(['сала', '', ''])
    expect(inputs.map((input) => input.classes('missing'))).toEqual([false, true, true])
    expect(row(wrapper, 'сала').text()).toContain('3 posts')
  })

  it('saves a tag\'s names as one object and shows what the server kept', async () => {
    const wrapper = await render()
    service.renameTag.mockResolvedValue({
      data: { ...sala(), names: { mk: 'сала', en: 'venue' }, missingLocales: ['sq'] },
    })
    const save = button(row(wrapper, 'сала'), 'Save')
    expect(save.attributes('disabled')).toBeDefined()

    await nameInputs(wrapper, 'сала')[1].setValue('venue')
    await save.trigger('click')
    await flushPromises()

    expect(service.renameTag).toHaveBeenCalledWith('t-1', { mk: 'сала', en: 'venue', sq: '' })
    expect(wrapper.find('[role="status"]').text()).toBe('Saved “сала”.')
    expect(nameInputs(wrapper, 'сала')[1].classes('missing')).toBe(false)
    expect(button(row(wrapper, 'сала'), 'Save').attributes('disabled')).toBeDefined()
  })

  it('filters to tags missing a translation, and by any of their names', async () => {
    const wrapper = await render()

    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(wrapper.findAll('tbody tr').map((tr) => tr.attributes('data-slug'))).toEqual(['сала'])

    await wrapper.find('input[type="checkbox"]').setValue(false)
    await wrapper.find('input[type="search"]').setValue('grup')
    expect(wrapper.findAll('tbody tr').map((tr) => tr.attributes('data-slug'))).toEqual(['бенд'])
  })

  it('deletes only on the second click, which says how many posts lose the tag', async () => {
    const wrapper = await render()
    service.removeTag.mockResolvedValue({ data: null })

    await button(row(wrapper, 'сала'), 'Delete').trigger('click')
    expect(service.removeTag).not.toHaveBeenCalled()

    await button(row(wrapper, 'сала'), 'Delete from 3 posts').trigger('click')
    await flushPromises()

    expect(service.removeTag).toHaveBeenCalledWith('t-1')
    expect(row(wrapper, 'сала').exists()).toBe(false)
    expect(wrapper.find('[role="status"]').text()).toBe('Deleted “сала”.')
  })

  it('says a failed save out loud and keeps what was typed', async () => {
    const wrapper = await render()
    service.renameTag.mockRejectedValue(new Error('Unknown language'))

    await nameInputs(wrapper, 'сала')[2].setValue('sallë')
    await button(row(wrapper, 'сала'), 'Save').trigger('click')
    await flushPromises()

    expect(wrapper.find('.action-error').exists()).toBe(true)
    expect(nameInputs(wrapper, 'сала')[2].element.value).toBe('sallë')
  })

  it('explains where tags come from when there are none', async () => {
    const wrapper = await render([])

    expect(wrapper.text()).toContain('They are created when you add a tag to a post.')
  })
})

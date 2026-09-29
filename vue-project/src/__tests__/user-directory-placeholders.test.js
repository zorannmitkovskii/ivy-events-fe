import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import UserDirectory from '@/components/users/UserDirectory.vue'
import en from '@/i18n/locales/en.json'
import mk from '@/i18n/locales/mk.json'
import sq from '@/i18n/locales/sq.json'

/** The create dialog's example values are the page's language, not a hard-coded "John Doe". */

vi.mock('@/services/userService', () => ({
  getAllAdminUsers: () => Promise.resolve({ content: [], totalElements: 0 }),
  getAdminUser: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  deleteUser: vi.fn(),
}))
vi.mock('@/services/events.service', () => ({ eventsService: { getAll: () => Promise.resolve([]) } }))

async function placeholdersIn(locale) {
  const i18n = createI18n({ legacy: false, locale, messages: { en, mk, sq } })
  const wrapper = mount(UserDirectory, { props: { title: 'Users' }, global: { plugins: [i18n] } })
  await flushPromises()
  await wrapper.find('.btn-create').trigger('click')
  return wrapper.findAll('.dialog .form-input').slice(0, 3).map((input) => input.attributes('placeholder'))
}

describe('the user dialog placeholders', () => {
  it.each([
    ['en', ['Jane', 'Smith', 'jane@example.com']],
    ['mk', ['Марија', 'Петровска', 'marija@primer.mk']],
    ['sq', ['Arta', 'Krasniqi', 'arta@shembull.com']],
  ])('are translated in %s', async (locale, expected) => {
    expect(await placeholdersIn(locale)).toEqual(expected)
  })

  it('no longer shows the hard-coded English example in Macedonian', async () => {
    expect(await placeholdersIn('mk')).not.toContain('John')
  })
})

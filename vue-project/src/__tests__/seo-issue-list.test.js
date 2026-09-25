import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import SeoIssueList from '@/components/admin/blog/SeoIssueList.vue'
import { wordCount } from '@/utils/blogHtml'
import en from '@/i18n/locales/en.json'

/**
 * SEO findings in the blog editor (IVY-907).
 *
 * <p>The server sends a Macedonian sentence and the numbers in it; the list
 * says it in the editor's language, errors before advice.
 */

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } })

const render = (issues, props = {}) => mount(SeoIssueList, { props: { issues, ...props }, global: { plugins: [i18n] } })

const warning = { code: 'NO_TAGS', severity: 'WARNING', field: 'tags', params: {}, message: 'Нема тагови.' }
const error = { code: 'TITLE_TOO_LONG', severity: 'ERROR', field: 'title', params: { length: 75, max: 60 }, message: 'Насловот е 75 знаци.' }

describe('SeoIssueList', () => {
  it('lists errors before advice, whatever order they came in', () => {
    const items = render([warning, error]).findAll('li')

    expect(items.map((item) => item.classes())).toEqual([expect.arrayContaining(['error']), expect.arrayContaining(['warning'])])
  })

  it('says each finding in the editor\'s language with its numbers', () => {
    expect(render([error]).text()).toContain('The title is 75 characters — Google shows about 60')
  })

  it('falls back to the server\'s sentence for a finding it has no words for', () => {
    const unknown = { code: 'SOMETHING_NEW', severity: 'WARNING', field: 'body', params: {}, message: 'Нешто ново.' }

    expect(render([unknown]).text()).toContain('Нешто ново.')
  })

  it('renders nothing when there is nothing to fix, and no severity label in its compact form', () => {
    expect(render([]).find('ul').exists()).toBe(false)
    expect(render([error], { compact: true }).find('.severity').exists()).toBe(false)
  })
})

describe('wordCount', () => {
  it('counts words the way the server does — markup and lone symbols are not words', () => {
    expect(wordCount('<h2>Сала</h2><p><strong>две</strong> зборови — 🙂</p>')).toBe(3)
    expect(wordCount('')).toBe(0)
  })
})

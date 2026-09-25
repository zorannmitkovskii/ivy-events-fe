import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { defineComponent, h, nextTick, reactive } from 'vue'
import { seoModeFor, useSeo } from '@/composables/useSeo'
import { applySeo } from '@/composables/useDocumentSeo'

/**
 * Route-level SEO: one writer for the head, and a search engine told which
 * pages are its business.
 *
 * Signed-in screens have no SEO copy and fall back to the site name quietly —
 * asking vue-i18n for a missing key warned on every navigation.
 */

const route = reactive({ name: 'home', path: '/mk', fullPath: '/mk', matched: [] })

vi.mock('vue-router', () => ({ useRoute: () => route }))

const messages = {
  mk: { seo: { home: { title: 'Почетна', description: 'Опис' }, default: { description: 'Стандарден опис' } } },
  en: { seo: { home: { title: 'Home', description: 'About' }, default: { description: 'Default description' } } },
}

let i18n

function render() {
  i18n = createI18n({ legacy: false, locale: 'mk', fallbackLocale: 'en', messages })
  const Host = defineComponent({ setup() { useSeo(); return () => h('div') } })
  return mount(Host, { global: { plugins: [i18n] } })
}

function goTo(name, path, meta = {}) {
  Object.assign(route, { name, path, fullPath: path, matched: [{ meta }] })
}

const content = (selector) => document.head.querySelector(selector)?.getAttribute('content') ?? null
const hreflangs = () => [...document.head.querySelectorAll('link[rel="alternate"]')].map((link) => link.getAttribute('hreflang'))

beforeEach(() => {
  document.head.innerHTML = ''
  document.title = ''
  goTo('home', '/mk')
})

afterEach(() => vi.restoreAllMocks())

describe('seoModeFor', () => {
  it('treats signed-in and auth routes as private without being told', () => {
    expect(seoModeFor({ matched: [{ meta: { requiresAuth: true } }, { meta: {} }] })).toBe('private')
    expect(seoModeFor({ matched: [{ meta: { guestOnly: true } }] })).toBe('private')
  })

  it('honours an explicit mode, server first', () => {
    expect(seoModeFor({ matched: [{ meta: { seo: 'private' } }] })).toBe('private')
    expect(seoModeFor({ matched: [{ meta: { seo: 'server' } }] })).toBe('server')
  })

  it('calls everything else public', () => {
    expect(seoModeFor({ matched: [{ meta: {} }] })).toBe('public')
    expect(seoModeFor({})).toBe('public')
  })
})

describe('a public page', () => {
  it('uses its own copy, a website og:type and an address per language', () => {
    render()

    expect(document.title).toBe('Почетна | Ivy Events')
    expect(content('meta[name="description"]')).toBe('Опис')
    expect(content('meta[property="og:type"]')).toBe('website')
    expect(content('meta[property="og:locale"]')).toBe('mk_MK')
    expect(content('meta[name="twitter:title"]')).toBe('Почетна | Ivy Events')
    expect(content('meta[name="robots"]')).toBeNull()
    expect(hreflangs()).toEqual(['mk', 'en', 'sq', 'x-default'])
  })
})

describe('a private page', () => {
  it('is noindex, with no hreflang and no breadcrumb', () => {
    goTo('agency.dashboard', '/mk/agency/dashboard', { requiresAuth: true })
    render()

    expect(document.title).toBe('Ivy Events')
    expect(content('meta[name="robots"]')).toBe('noindex, follow')
    expect(hreflangs()).toEqual([])
    expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull()
  })

  it('does not warn about the SEO copy it does not have', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    goTo('agency.dashboard', '/mk/agency/dashboard', { requiresAuth: true })
    render()

    expect(warn.mock.calls.flat().join(' ')).not.toContain('seo.agency.dashboard')
  })

  it('does not ask for seo.undefined on a route with no name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    goTo(undefined, '/mk/x')
    render()

    expect(warn.mock.calls.flat().join(' ')).not.toContain('seo.undefined')
  })

  it('becomes indexable again on the next public page', async () => {
    goTo('agency.dashboard', '/mk/agency/dashboard', { requiresAuth: true })
    render()
    goTo('home', '/mk')
    await nextTick()

    expect(content('meta[name="robots"]')).toBeNull()
  })
})

describe('a page that sets its own tags', () => {
  it('keeps them when only the language changes', async () => {
    goTo('BlogPost', '/mk/blog/deset-idei', { seo: 'server' })
    render()
    applySeo({ title: 'Десет идеи', alternates: [{ locale: 'mk', url: 'u' }, { locale: 'en', url: 'v' }] })

    goTo('BlogPost', '/en/blog/deset-idei', { seo: 'server' })
    i18n.global.locale.value = 'en'
    await nextTick()

    expect(document.title).toBe('Десет идеи')
    expect(hreflangs()).toEqual(['mk', 'en'])
  })

  it('starts from a neutral baseline on arrival, so a failed fetch leaves no stale tags', async () => {
    goTo('agency.dashboard', '/mk/agency/dashboard', { requiresAuth: true })
    render()
    goTo('BlogPost', '/mk/blog/deset-idei', { seo: 'server' })
    await nextTick()

    expect(document.title).toBe('Ivy Events')
    expect(content('meta[name="robots"]')).toBeNull()
  })
})

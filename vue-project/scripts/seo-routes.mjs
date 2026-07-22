/**
 * Canonical registry of public routes to prerender.
 *
 * Each entry defines:
 *   - path        : the language-independent path (empty string for landing)
 *   - titleKey    : i18n key that provides `{TITLE} | Ivy Events` per locale
 *   - descKey     : i18n key for the meta description
 *   - hero        : { h1Key, subKey } — content injected into the body pre-hydration
 *   - jsonLdType  : which schema.org type to emit (built by prerender.mjs)
 *   - noindex     : optional; if true, emit `<meta name="robots" content="noindex">`
 *
 * Adding a new public route = one entry here + the matching seo.<name> keys in
 * src/i18n/locales/{mk,en,sq}.json. No other file needs to change — prerender.mjs
 * iterates this list and writes {dist}/{lang}/{path}/index.html for each.
 */

export const LANGUAGES = ['mk', 'en', 'sq'];
export const DEFAULT_LANG = 'mk';
export const BASE_URL = 'https://ivyevents.mk';

export const ROUTES = [
  // Landing — the highest-value route for GEO citation.
  {
    path: '',
    titleKey: 'seo.home.title',
    descKey: 'seo.home.description',
    hero: { h1Key: 'home.hero.titleAccent1', subKey: 'home.hero.subtitle' },
    jsonLdTypes: ['Organization', 'WebSite'],
    priority: 1.0,
  },

  // Marketing pages
  {
    path: '/features',
    titleKey: 'seo.features.title',
    descKey: 'seo.features.description',
    hero: { h1Key: 'home.features.titleBefore', subKey: 'home.features.subtitle' },
    priority: 0.8,
  },
  {
    path: '/features/rsvp',
    titleKey: 'seo.features-rsvp.title',
    descKey: 'seo.features-rsvp.description',
    hero: { h1Key: 'seo.features-rsvp.title', subKey: 'seo.features-rsvp.description' },
    priority: 0.7,
  },
  {
    path: '/features/invitations',
    titleKey: 'seo.features-invitations.title',
    descKey: 'seo.features-invitations.description',
    hero: { h1Key: 'seo.features-invitations.title', subKey: 'seo.features-invitations.description' },
    priority: 0.7,
  },
  {
    path: '/pricing',
    titleKey: 'seo.pricing.title',
    descKey: 'seo.pricing.description',
    hero: { h1Key: 'packages.title', subKey: 'packages.subtitle' },
    priority: 0.8,
  },
  {
    path: '/packages',
    titleKey: 'seo.pricing.title',
    descKey: 'seo.pricing.description',
    hero: { h1Key: 'packages.title', subKey: 'packages.subtitle' },
    priority: 0.7,
  },
  {
    path: '/about',
    titleKey: 'seo.about.title',
    descKey: 'seo.about.description',
    hero: { h1Key: 'seo.about.title', subKey: 'seo.about.description' },
    priority: 0.5,
  },
  {
    path: '/contact',
    titleKey: 'seo.contact.title',
    descKey: 'seo.contact.description',
    hero: { h1Key: 'seo.contact.title', subKey: 'seo.contact.description' },
    priority: 0.5,
  },
  {
    path: '/faq',
    titleKey: 'seo.faq.title',
    descKey: 'seo.faq.description',
    hero: { h1Key: 'seo.faq.title', subKey: 'seo.faq.description' },
    jsonLdTypes: ['FAQPage'],
    priority: 0.5,
  },
  {
    path: '/terms',
    titleKey: 'seo.terms.title',
    descKey: 'seo.terms.description',
    hero: { h1Key: 'seo.terms.title', subKey: 'seo.terms.description' },
    priority: 0.3,
  },
  {
    path: '/event-invitations',
    titleKey: 'seo.event-invitations.title',
    descKey: 'seo.event-invitations.description',
    hero: { h1Key: 'seo.event-invitations.title', subKey: 'seo.event-invitations.description' },
    priority: 0.8,
  },

  // Six category landing pages
  ...['weddings', 'kids-birthdays', 'adult-birthdays', 'business', 'baby', 'holiday']
    .map(slug => ({
      path: `/category/${slug}`,
      titleKey: `seo.category-${slug}.title`,
      descKey: `seo.category-${slug}.description`,
      hero: { h1Key: `seo.category-${slug}.title`, subKey: `seo.category-${slug}.description` },
      jsonLdTypes: ['Service'],
      jsonLdMeta: { categorySlug: slug },
      priority: 0.7,
    })),

  // Six invitation-template preview pages
  ...['coastal-breeze', 'parisian-wedding', 'persian-wedding', 'elegant-chateau', 'modern-collage', 'editorial']
    .map(slug => ({
      path: `/invitations/${slug}`,
      titleKey: `seo.template-${slug}.title`,
      descKey: `seo.template-${slug}.description`,
      hero: { h1Key: `seo.template-${slug}.title`, subKey: `seo.template-${slug}.description` },
      priority: 0.6,
    })),
];

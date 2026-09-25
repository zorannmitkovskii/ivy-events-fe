import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { applySeo } from '@/composables/useDocumentSeo';

export const SITE_NAME = 'Ivy Events';
const BASE_URL = (import.meta.env.VITE_PUBLIC_BASE_URL || 'https://ivyevents.mk').replace(/\/$/, '');
const DEFAULT_IMAGE = `${BASE_URL}/logo.svg`;
const LANGS = ['mk', 'en', 'sq'];
const DEFAULT_LANG = 'mk';
const LANG_PREFIX = /^\/(mk|en|sq)(?=\/|$)/;

/**
 * What kind of page a route is, as far as a search engine is concerned.
 *
 * - `server`: the page asks the API for its own tags (a blog post, a vendor).
 *   Only a neutral baseline is written on arrival; the page overwrites it.
 * - `private`: signed-in screens, auth forms and anything opened with a
 *   guest's token. Titled, but `noindex` and without hreflang — an address
 *   nobody can open without an account is not a search result.
 * - `public`: everything else.
 *
 * Read from every matched record, so a child inherits its shell's meta.
 */
export function seoModeFor(route) {
  const metas = (route.matched || []).map((record) => record.meta || {});
  if (metas.some((meta) => meta.seo === 'server')) return 'server';
  if (metas.some((meta) => meta.seo === 'private' || meta.requiresAuth || meta.guestOnly)) return 'private';
  return 'public';
}

/**
 * The one writer of the document head for route-level SEO.
 *
 * Tags go through `applySeo`, the same code the server-driven pages use, so
 * both kinds of page set and clear the same tags the same way. Before this,
 * two implementations wrote the head: this one wiped the blog's hreflang and
 * replaced its title on every language switch.
 */
export function useSeo() {
  const route = useRoute();
  const { t, te, locale } = useI18n();

  /*
    Only public pages carry SEO copy. `te` checks first, quietly, in the page's
    language and in the English fallback — asking `t` for a missing key made
    vue-i18n warn on every navigation, and a nameless route asked for
    `seo.undefined`.
  */
  const hasKey = (key) => te(key) || te(key, 'en');
  const copy = (field) => {
    const key = `seo.${String(route.name)}.${field}`;
    return route.name && hasKey(key) ? t(key) : null;
  };

  let lastRouteName;

  function update() {
    const mode = seoModeFor(route);
    const entering = route.name !== lastRouteName;
    lastRouteName = route.name;
    document.documentElement.lang = locale.value;

    // A server page reused across a language switch keeps what it set.
    if (mode === 'server' && !entering) return;

    const ownTitle = copy('title');
    const title = ownTitle ? `${ownTitle} | ${SITE_NAME}` : SITE_NAME;
    const isPublic = mode === 'public';

    applySeo({
      title,
      description: copy('description') ?? t('seo.default.description'),
      canonicalUrl: `${BASE_URL}${route.path}`,
      imageUrl: DEFAULT_IMAGE,
      type: 'website',
      locale: locale.value,
      noindex: mode === 'private',
      alternates: isPublic ? alternatesFor(route.path) : [],
      structuredData: isPublic ? breadcrumbFor(route.path, title, locale.value) : null,
    });
  }

  watch([() => route.fullPath, locale], update, { immediate: true });
}

/** One address per language, plus the Macedonian one as x-default. */
function alternatesFor(path) {
  const rest = path.replace(LANG_PREFIX, '');
  return [
    ...LANGS.map((lang) => ({ locale: lang, url: `${BASE_URL}/${lang}${rest}` })),
    { locale: 'x-default', url: `${BASE_URL}/${DEFAULT_LANG}${rest}` },
  ];
}

function breadcrumbFor(path, title, lang) {
  const segments = path.split('/').filter(Boolean);
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/${lang}` }];

  let accumulated = `/${segments[0] || lang}`;
  for (let i = 1; i < segments.length; i++) {
    accumulated += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    items.push({
      '@type': 'ListItem',
      position: i + 1,
      name: isLast ? title : segments[i].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${BASE_URL}${accumulated}`,
    });
  }

  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

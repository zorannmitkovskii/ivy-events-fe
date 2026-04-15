import { watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const SITE_NAME = 'Ivy Events';
const BASE_URL = 'https://ivyevents.mk';
const DEFAULT_IMAGE = `${BASE_URL}/logo.svg`;

/**
 * Sets document <title>, meta description, Open Graph, Twitter Card,
 * canonical URL, and hreflang tags reactively based on the current route.
 */
export function useSeo() {
  const route = useRoute();
  const { t, locale } = useI18n();

  const langs = ['mk', 'en', 'sq'];

  const routeMeta = computed(() => {
    const name = route.name;
    const titleKey = `seo.${name}.title`;
    const descKey = `seo.${name}.description`;

    const title = t(titleKey) !== titleKey ? t(titleKey) : SITE_NAME;
    const description = t(descKey) !== descKey ? t(descKey) : t('seo.default.description');

    return { title, description };
  });

  const pageTitle = computed(() => {
    const { title } = routeMeta.value;
    return title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;
  });

  const canonicalUrl = computed(() => {
    const path = route.path;
    return `${BASE_URL}${path}`;
  });

  function setMeta(name, content) {
    if (!content) return;
    const attr = name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name';
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  function setLink(rel, href, attrs = {}) {
    const selector = Object.entries(attrs).reduce(
      (s, [k, v]) => `${s}[${k}="${v}"]`, `link[rel="${rel}"]`
    );
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  function removeHreflang() {
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  }

  function updateHead() {
    const { description } = routeMeta.value;
    const title = pageTitle.value;
    const url = canonicalUrl.value;

    // Title
    document.title = title;

    // Lang
    document.documentElement.lang = locale.value;

    // Basic meta
    setMeta('description', description);

    // Open Graph
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:url', url);
    setMeta('og:type', 'website');
    setMeta('og:site_name', SITE_NAME);
    setMeta('og:image', DEFAULT_IMAGE);
    setMeta('og:locale', locale.value);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', DEFAULT_IMAGE);

    // Canonical
    setLink('canonical', url);

    // Hreflang
    removeHreflang();
    const pathWithoutLang = route.path.replace(/^\/(mk|en|sq)/, '');
    langs.forEach(lang => {
      const href = `${BASE_URL}/${lang}${pathWithoutLang}`;
      setLink('alternate', href, { hreflang: lang });
    });
    setLink('alternate', `${BASE_URL}/mk${pathWithoutLang}`, { hreflang: 'x-default' });

    // BreadcrumbList JSON-LD
    updateBreadcrumbJsonLd(url, title);
  }

  function updateBreadcrumbJsonLd(url, title) {
    const id = 'seo-breadcrumb-jsonld';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('script');
      el.id = id;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }

    const segments = route.path.split('/').filter(Boolean);
    const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/${locale.value}` }];

    let accumulated = `/${segments[0] || locale.value}`;
    for (let i = 1; i < segments.length; i++) {
      accumulated += `/${segments[i]}`;
      items.push({
        '@type': 'ListItem',
        position: i + 1,
        name: i === segments.length - 1 ? title : segments[i].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        item: `${BASE_URL}${accumulated}`,
      });
    }

    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    });
  }

  watch([() => route.fullPath, locale], updateHead, { immediate: true });
}

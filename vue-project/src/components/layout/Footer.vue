<template>
  <footer class="footer">
    <div class="wrap">
      <div class="cols">
        <div>
          <router-link :to="`/${lang}`" class="brand" :aria-label="$t('header.logo')">
            <span class="ivy-logo foot-logo" role="img" :aria-label="$t('header.logo')"></span>
          </router-link>

          <p>{{ $t('footer.brand.tagline') }}</p>

          <div class="social">
            <a
              v-for="s in socials"
              :key="s.labelKey"
              :href="s.href"
              target="_blank"
              rel="noopener"
              :aria-label="$t(s.labelKey)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" v-html="s.svg"></svg>
            </a>
          </div>
        </div>

        <div v-for="col in columns" :key="col.titleKey">
          <h4>{{ $t(col.titleKey) }}</h4>
          <ul>
            <li v-for="link in col.links" :key="link.labelKey || link.text">
              <a v-if="link.href" :href="link.href">{{ link.text || $t(link.labelKey) }}</a>
              <router-link v-else-if="link.to" :to="link.to">{{ $t(link.labelKey) }}</router-link>
              <span v-else>{{ link.text || $t(link.labelKey) }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="bottom">
        <span>© {{ year }} Ivy Events</span>
        <span>
          <router-link :to="`/${lang}/terms`">{{ $t('footer.links.terms') }}</router-link>
          <router-link :to="`/${lang}/faq`">{{ $t('footer.links.faq') }}</router-link>
          <ThemeToggle class="theme-slot" />
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
const year = new Date().getFullYear()

const CONTACT_EMAIL = 'hello@ivyevents.mk'

/*
  Four columns, as the redesign has it: the brand, then product, resources and
  contact. The previous footer had three and put the vendor directory under
  "product"; it stays there, for the same reason it is in the header — it was
  linked from nowhere once already.
*/
const columns = computed(() => [
  {
    titleKey: 'footer.columns.product',
    links: [
      { labelKey: 'footer.links.designs', to: `/${lang.value}/designs` },
      { labelKey: 'footer.links.vendors', to: `/${lang.value}/vendors` },
      { labelKey: 'footer.links.pricing', to: `/${lang.value}/packages` },
    ],
  },
  {
    titleKey: 'footer.columns.resources',
    links: [
      { labelKey: 'footer.links.blog', to: `/${lang.value}/blog` },
      { labelKey: 'footer.links.faq', to: `/${lang.value}/faq` },
      { labelKey: 'footer.links.about', to: `/${lang.value}/about` },
      { labelKey: 'footer.links.feedback', to: `/${lang.value}/feedback` },
    ],
  },
  {
    titleKey: 'footer.columns.contact',
    links: [
      // Not a translation, and vue-i18n reads a bare `@` in a message as the
      // start of a linked key — so the address lives here, where it is one
      // constant rather than three identical strings that fail to compile.
      { text: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
      { labelKey: 'footer.contact.city' },
      { labelKey: 'footer.contact.hours' },
    ],
  },
])

/*
  Inline SVG rather than Font Awesome classes: `fab fa-instagram` renders as
  nothing at all unless Font Awesome is loaded. These are the design's own
  paths and they take `currentColor`, which is what makes the hover state — a
  white ground and a dark mark — a single rule in `site.css`.
*/
const socials = [
  {
    labelKey: 'comingSoon.social.instagram',
    href: 'https://www.instagram.com/ivyevents.mk/',
    svg: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.4" cy="6.7" r="1.1" fill="currentColor"/>',
  },
  {
    labelKey: 'comingSoon.social.facebook',
    href: 'https://www.facebook.com/profile.php?id=61584269536071',
    svg: '<path fill="currentColor" d="M14 21v-8h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7H18V3.8c-.4-.1-1.5-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.7V10H8v3h2.8v8H14Z"/>',
  },
]
</script>

<style scoped>
/* Structure and colour are the design's, in `ivy/site.css`. Only the logo
   sizing is local, because the mockup drew the brand as text and this is an
   asset — inverse, because the footer ground is `--ivy-deep` in both themes. */
.foot-logo {
  --logo-h: 28px;
  color: #fff;
}

/* `.footer .bottom a { margin-left: 18px }` is what spaces that row, and the
   toggle is a button. Matching the rule rather than widening it keeps the
   design's selector honest. */
.theme-slot {
  margin-left: 18px;
}
</style>

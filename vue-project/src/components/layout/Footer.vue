<template>
  <footer class="sitefooter">
    <div class="footerInner">
      <div class="footerMain">
        <router-link :to="`/${lang}`" class="brand">
          <span class="ivy-logo ivy-logo--inverse foot-logo" role="img" aria-label="Ivy Events"></span>
        </router-link>

        <p class="footerStatement">{{ $t('footer.brand.tagline') }}</p>

        <nav class="footerNav" :aria-label="$t('footer.columns.product')">
          <span>{{ $t('footer.columns.product') }}</span>
          <router-link v-for="link in productLinks" :key="link.labelKey" :to="link.to">
            {{ $t(link.labelKey) }}
          </router-link>
        </nav>

        <nav class="footerNav" :aria-label="$t('footer.columns.company')">
          <span>{{ $t('footer.columns.company') }}</span>
          <router-link v-for="link in companyLinks" :key="link.labelKey" :to="link.to">
            {{ $t(link.labelKey) }}
          </router-link>
        </nav>

        <div class="footerSocial">
          <span>{{ $t('footer.columns.connect') }}</span>
          <div class="footerLinks">
            <a
              v-for="s in socials"
              :key="s.labelKey"
              class="socialIcon"
              :href="s.href"
              target="_blank"
              rel="noopener"
              :aria-label="$t(s.labelKey)"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" v-html="s.svg"></svg>
            </a>
          </div>
        </div>
      </div>

      <div class="footerBottom">
        <small>© {{ year }} Ivy Events · MK / EN</small>
        <div>
          <router-link v-for="link in legalLinks" :key="link.labelKey" :to="link.to">
            {{ $t(link.labelKey) }}
          </router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");
const year = new Date().getFullYear();

const productLinks = computed(() => [
  { labelKey: "footer.links.pricing", to: `/${lang.value}/packages` },
  { labelKey: "footer.links.designs", to: `/${lang.value}/event-invitations` },
  // Linked from nowhere until IVY-1401, in a footer whose whole job is to make
  // the site's corners reachable.
  { labelKey: "footer.links.vendors", to: `/${lang.value}/vendors` },
  { labelKey: "footer.links.blog", to: `/${lang.value}/blog` },
  { labelKey: "footer.links.faq", to: `/${lang.value}/faq` },
]);

const companyLinks = computed(() => [
  { labelKey: "footer.links.about", to: `/${lang.value}/about` },
  { labelKey: "footer.links.contact", to: `/${lang.value}/contact` },
  { labelKey: "footer.links.feedback", to: `/${lang.value}/feedback` },
]);

/*
  The design's bottom row is Приватност · Услови. There is no privacy route —
  `footer.links.privacy` has a label in all three locales and nothing behind
  it — so linking it would put a 404 in the footer of every page. FAQ takes
  the slot until the policy page exists.
*/
const legalLinks = computed(() => [
  { labelKey: "footer.links.terms", to: `/${lang.value}/terms` },
  { labelKey: "footer.links.faq", to: `/${lang.value}/faq` },
]);

/*
  Inline SVG rather than the Font Awesome classes that used to be here.

  `fab fa-instagram` renders as nothing at all unless Font Awesome is loaded,
  and it is not — the app ships Bootstrap Icons. So both marks were empty
  boxes. These are the design's own paths, and they take `currentColor`, which
  is what makes the hover state (gold ground, dark mark) a single rule.
*/
const socials = [
  {
    labelKey: "comingSoon.social.instagram",
    href: "https://www.instagram.com/ivyevents.mk/",
    svg: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle class="fill" cx="17.4" cy="6.7" r="1.1"/>',
  },
  {
    labelKey: "comingSoon.social.facebook",
    href: "https://www.facebook.com/profile.php?id=61584269536071",
    svg: '<path d="M14 21v-8h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7H18V3.8c-.4-.1-1.5-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.7V10H8v3h2.8v8H14Z"/>',
  },
];
</script>

<style scoped>
/* Everything structural — `.sitefooter`, `.footerMain`, `.footerNav`,
   `.socialIcon` — is the design's, in `ivy/site.css`, including the
   five-column grid this footer needs. Only the logo sizing is local, because
   the design drew the brand as text and this is an asset. */
.foot-logo {
  --logo-h: 28px;
}
</style>

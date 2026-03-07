<template>
  <footer class="footer">
    <div class="foot-grid">
      <!-- Brand -->
      <div class="foot-brand">
        <div class="foot-brand-name">
          <img src="/logoInv.svg" alt="IvyEvents" class="foot-logo" />
        </div>
        <p class="foot-tagline">{{ $t('footer.brand.tagline') }}</p>
      </div>

      <!-- Columns -->
      <div class="foot-col">
        <h4>{{ $t('footer.columns.product') }}</h4>
        <ul>
          <li v-for="link in productLinks" :key="link.labelKey">
            <router-link :to="link.to">{{ $t(link.labelKey) }}</router-link>
          </li>
        </ul>
      </div>

      <div class="foot-col">
        <h4>{{ $t('footer.columns.company') }}</h4>
        <ul>
          <li v-for="link in companyLinks" :key="link.labelKey">
            <router-link :to="link.to">{{ $t(link.labelKey) }}</router-link>
          </li>
        </ul>
      </div>

      <div class="foot-col">
        <h4>{{ $t('footer.columns.support') }}</h4>
        <ul>
          <li v-for="link in supportLinks" :key="link.labelKey">
            <router-link :to="link.to">{{ $t(link.labelKey) }}</router-link>
          </li>
        </ul>
      </div>
    </div>

    <div class="foot-bot">
      <span>© {{ new Date().getFullYear() }} IvyEvents. {{ $t('footer.copyright') }}</span>
      <div class="soc">
        <a v-for="(s, i) in socials" :key="i" :href="s.href" target="_blank" rel="noopener" :aria-label="$t(s.labelKey)">
          <i :class="s.icon"></i>
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const productLinks = computed(() => [
  { labelKey: "footer.links.pricing", to: `/${lang.value}/packages` },
  { labelKey: "footer.links.designs", to: `/${lang.value}/event-invitations` },
  { labelKey: "footer.links.faq", to: `/${lang.value}/faq` },
]);

const companyLinks = computed(() => [
  { labelKey: "footer.links.about", to: `/${lang.value}/about` },
  { labelKey: "footer.links.contact", to: `/${lang.value}/contact` },
]);

const supportLinks = computed(() => [
  { labelKey: "footer.links.terms", to: `/${lang.value}/terms` },
  { labelKey: "footer.links.feedback", to: `/${lang.value}/feedback` },
]);

const socials = [
  { labelKey: 'comingSoon.social.facebook', href: "https://www.facebook.com/profile.php?id=61584269536071", icon: "fab fa-facebook-f" },
  { labelKey: 'comingSoon.social.instagram', href: "https://www.instagram.com/ivyevents.mk/", icon: "fab fa-instagram" },
];
</script>

<style scoped>
.footer {
  background: #111D18;
  padding: 64px 52px 30px;
}

.foot-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr 1fr 1fr;
  gap: 52px;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 48px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 28px;
}

.foot-logo {
  height: 28px;
  width: auto;
  display: block;
  margin-bottom: 10px;
}

.foot-tagline {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.42);
  line-height: 1.75;
  max-width: 230px;
  font-weight: 300;
  margin: 0;
}

.foot-col h4 {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 16px;
}

.foot-col ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.foot-col li { margin-bottom: 8px; }

.foot-col a {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.42);
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 300;
}

.foot-col a:hover {
  color: var(--brand-light);
}

.foot-bot {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

.soc {
  display: flex;
  gap: 8px;
}

.soc a {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
  text-decoration: none;
  transition: all 0.25s;
}

.soc a:hover {
  border-color: var(--brand-light);
  color: var(--brand-light);
}

@media (max-width: 900px) {
  .footer { padding: 48px 24px 24px; }
  .foot-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
}

@media (max-width: 520px) {
  .foot-grid { grid-template-columns: 1fr; }
  .foot-bot { flex-direction: column; gap: 12px; text-align: center; }
}
</style>

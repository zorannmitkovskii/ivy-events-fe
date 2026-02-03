<template>
  <footer class="footer">
    <div class="footer__container">
      <!-- Brand -->
      <div class="footer-brand">
        <h3 class="footer-brand__logo">{{$t('footer.brand.logo')}}</h3>
        <p class="footer-brand__desc">
          {{$t('footer.brand.tagline')}}
        </p>
      </div>

      <!-- Columns -->
      <FooterColumn :titleKey="'footer.columns.product'" :links="productLinks" />
      <FooterColumn :titleKey="'footer.columns.company'" :links="companyLinks" />
      <FooterColumn :titleKey="'footer.columns.support'" :links="supportLinks" />

      <!-- Social -->
      <div class="footer-col">
        <h4 class="footer-col__title">{{$t('footer.columns.connect')}}</h4>

        <div class="footer-social">
          <SocialIconLink
            v-for="(s, i) in socials"
            :key="i"
            :href="s.href"
            :icon="s.icon"
            :labelKey="s.labelKey"
          />
        </div>
      </div>
    </div>

    <div class="footer__bottom">
      <p class="footer__copyright">
        © {{ new Date().getFullYear() }} IvyEvents. {{$t('footer.copyright')}}
      </p>
    </div>
  </footer>
</template>

<script setup>

import FooterColumn from "@/components/footer/FooterColumn.vue";
import SocialIconLink from "@/components/footer/SocialIconLink.vue";

const productLinks = [
  { labelKey: "footer.links.templates", to: "/templates" },
  { labelKey: "footer.links.features", to: "/#features" },
  { labelKey: "footer.links.pricing", to: "/#pricing" },
  { labelKey: "footer.links.faq", to: "/#faq" }
];

const companyLinks = [
  { labelKey: "footer.links.about", to: "/about" },
  { labelKey: "footer.links.blog", to: "/blog" },
  { labelKey: "footer.links.careers", to: "/careers" },
  { labelKey: "footer.links.contact", to: "/contact" }
];

const supportLinks = [
  { labelKey: "footer.links.help", to: "/help" },
  { labelKey: "footer.links.terms", to: "/terms" },
  { labelKey: "footer.links.privacy", to: "/privacy" },
  { labelKey: "footer.links.security", to: "/security" }
];

const socials = [
  { labelKey: 'comingSoon.social.facebook', href: "https://facebook.com", icon: "fab fa-facebook-f" },
  { labelKey: 'comingSoon.social.instagram', href: "https://instagram.com", icon: "fab fa-instagram" }
];
</script>

<style scoped>
.footer {
  background: var(--brand-main);
  color: var(--bg-white);
}

.footer__container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 44px 20px;

  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr 1fr;
  gap: 42px;
  align-items: start;
}

.footer-brand__logo {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 12px;
}

.footer-brand__desc {
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  line-height: 1.7;
  max-width: 320px;
  margin: 0;
}

.footer-social {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.footer__bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding: 14px 20px;
  justify-content: center;
}

.footer__copyright {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}

/* Responsive */
@media (max-width: 980px) {
  .footer__container {
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }
}

@media (max-width: 560px) {
  .footer__container {
    grid-template-columns: 1fr;
  }
}
</style>

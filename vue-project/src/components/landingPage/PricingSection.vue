<template>
  <section class="pricing" id="pricing">
    <div class="pricing__container">
      <!-- Invitation Packages -->
      <header class="pricing__header">
        <h2 class="pricing__title">{{$t('pricing.section.title')}}</h2>
        <p class="pricing__subtitle">
          {{$t('pricing.section.subtitle')}}
        </p>
      </header>

      <div class="pricing__grid">
        <PricingCard
            v-for="(plan, i) in plans"
            :key="i"
            v-bind="plan"
        />
      </div>

      <!-- Gallery Packages -->
      <header class="pricing__header pricing__header--gallery">
        <h2 class="pricing__title">{{$t('pricing.gallery.title')}}</h2>
        <p class="pricing__subtitle">
          {{$t('pricing.gallery.subtitle')}}
        </p>
      </header>

      <div class="pricing__grid pricing__grid--gallery">
        <PricingCard
            v-for="(plan, i) in galleryPlans"
            :key="'gallery-' + i"
            v-bind="plan"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import PricingCard from "@/components/cards/PricingCard.vue";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const signupRoute = computed(() => ({ name: 'signup', params: { lang: lang.value } }));

const plans = computed(() => [
  {
    nameKey: 'pricing.plans.free.name',
    price: "$0",
    descKey: 'pricing.plans.free.description',
    features: [
      { labelKey: 'pricing.plans.free.features.upTo50Guests', included: true },
      { labelKey: 'pricing.plans.free.features.oneEvent', included: true },
      { labelKey: 'pricing.plans.free.features.basicTemplates', included: true },
      { labelKey: 'pricing.plans.free.features.rsvpTracking', included: true },
      { labelKey: 'pricing.plans.free.features.emailInvites', included: true },
      { labelKey: 'pricing.plans.free.features.customBranding', included: false },
      { labelKey: 'pricing.plans.free.features.prioritySupport', included: false }
    ],
    ctaLabelKey: 'pricing.cta.getStarted',
    ctaTo: signupRoute.value,
    ctaVariant: "outline"
  },
  {
    nameKey: 'pricing.plans.pro.name',
    price: "$29",
    descKey: 'pricing.plans.pro.description',
    featured: true,
    badgeLabel: '',
    features: [
      { labelKey: 'pricing.plans.pro.features.upTo300Guests', included: true },
      { labelKey: 'pricing.plans.pro.features.fiveEvents', included: true },
      { labelKey: 'pricing.plans.pro.features.premiumTemplates', included: true },
      { labelKey: 'pricing.plans.pro.features.advancedRsvp', included: true },
      { labelKey: 'pricing.plans.pro.features.emailSmsInvites', included: true },
      { labelKey: 'pricing.plans.pro.features.customBranding', included: true },
      { labelKey: 'pricing.plans.pro.features.prioritySupport', included: false }
    ],
    ctaLabelKey: 'pricing.cta.getStarted',
    ctaTo: signupRoute.value,
    ctaVariant: "main"
  },
  {
    nameKey: 'pricing.plans.wedding.name',
    price: "$79",
    descKey: 'pricing.plans.wedding.description',
    features: [
      { labelKey: 'pricing.plans.wedding.features.unlimitedGuests', included: true },
      { labelKey: 'pricing.plans.wedding.features.unlimitedEvents', included: true },
      { labelKey: 'pricing.plans.wedding.features.allPremiumTemplates', included: true },
      { labelKey: 'pricing.plans.wedding.features.advancedAnalytics', included: true },
      { labelKey: 'pricing.plans.wedding.features.allInvitationMethods', included: true },
      { labelKey: 'pricing.plans.wedding.features.customBranding', included: true },
      { labelKey: 'pricing.plans.wedding.features.prioritySupport', included: true }
    ],
    ctaLabelKey: 'pricing.cta.getStarted',
    ctaTo: signupRoute.value,
    ctaVariant: "gold"
  }
]);

const galleryPlans = computed(() => [
  {
    nameKey: 'pricing.gallery.plans.basic.name',
    price: "$9",
    descKey: 'pricing.gallery.plans.basic.description',
    features: [
      { labelKey: 'pricing.gallery.plans.basic.features.storage', included: true },
      { labelKey: 'pricing.gallery.plans.basic.features.photos', included: true },
      { labelKey: 'pricing.gallery.plans.basic.features.guestUpload', included: true },
      { labelKey: 'pricing.gallery.plans.basic.features.download', included: true },
      { labelKey: 'pricing.gallery.plans.basic.features.access', included: true }
    ],
    ctaLabelKey: 'pricing.cta.getStarted',
    ctaTo: signupRoute.value,
    ctaVariant: "outline"
  },
  {
    nameKey: 'pricing.gallery.plans.premium.name',
    price: "$29",
    descKey: 'pricing.gallery.plans.premium.description',
    featured: true,
    badgeLabel: '',
    features: [
      { labelKey: 'pricing.gallery.plans.premium.features.storage', included: true },
      { labelKey: 'pricing.gallery.plans.premium.features.photos', included: true },
      { labelKey: 'pricing.gallery.plans.premium.features.guestUpload', included: true },
      { labelKey: 'pricing.gallery.plans.premium.features.download', included: true },
      { labelKey: 'pricing.gallery.plans.premium.features.access', included: true },
      { labelKey: 'pricing.gallery.plans.premium.features.hd', included: true },
      { labelKey: 'pricing.gallery.plans.premium.features.video', included: true }
    ],
    ctaLabelKey: 'pricing.cta.getStarted',
    ctaTo: signupRoute.value,
    ctaVariant: "main"
  }
]);
</script>

<style scoped>
.pricing {
  background: var(--bg-main);
  padding: 76px 20px;
}

.pricing__container {
  max-width: var(--container-max);
  margin: 0 auto;
}

.pricing__header {
  text-align: center;
  margin-bottom: 34px;
}

.pricing__header--gallery {
  margin-top: 72px;
}

.pricing__title {
  font-family: var(--font-family), serif;
  font-size: 42px;
  font-weight: 500;
  margin: 0 0 10px;
  color: var(--neutral-900);
}

.pricing__subtitle {
  margin: 0;
  color: var(--neutral-700);
  font-size: 16px;
}

.pricing__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 26px;
  align-items: stretch;
}

.pricing__grid--gallery {
  grid-template-columns: repeat(2, 1fr);
  max-width: 760px;
  margin: 0 auto;
}

@media (max-width: 980px) {
  .pricing__grid {
    grid-template-columns: 1fr;
    max-width: 560px;
    margin: 0 auto;
  }

  .pricing__grid--gallery {
    grid-template-columns: 1fr;
    max-width: 560px;
  }

  .pricing__title {
    font-size: 32px;
  }
}
</style>

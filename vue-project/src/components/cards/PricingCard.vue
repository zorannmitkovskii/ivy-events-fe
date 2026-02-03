<template>
  <article class="card" :class="{ 'card--featured': featured }">
    <PricingBadge v-if="featured">
      <template v-if="badgeLabel">{{ badgeLabel }}</template>
    </PricingBadge>

    <h3 class="card__name">{{ nameKey ? $t(nameKey) : name }}</h3>

    <div class="card__price">
      <span class="card__priceValue">{{ price }}</span>
      <span class="card__per">{{$t('pricing.perMonth')}}</span>
    </div>

    <p class="card__desc">{{ descKey ? $t(descKey) : description }}</p>

    <ul class="card__features">
      <PricingFeature
        v-for="(f, i) in features"
        :key="i"
        :included="f.included"
      >
        {{ f.labelKey ? $t(f.labelKey) : f.label }}
      </PricingFeature>
    </ul>

    <div class="card__cta">
      <ButtonMain :to="ctaTo" :variant="ctaVariant">
        {{ ctaLabelKey ? $t(ctaLabelKey) : ctaLabel }}
      </ButtonMain>
    </div>
  </article>
</template>

<script setup>

import ButtonMain from "@/components/generic/ButtonMain.vue";
import PricingFeature from "@/components/cards/PricingFeature.vue";
import { t } from "@/i18n";

defineProps({
  name: { type: String, default: "" },
  nameKey: { type: String, default: "" },
  price: { type: String, required: true }, // "$0", "$29", "$79"
  description: { type: String, default: "" },
  descKey: { type: String, default: "" },
  features: { type: Array, required: true }, // [{label|labelKey,included}]
  featured: { type: Boolean, default: false },
  badgeLabel: { type: String, default: () => t('pricing.badge.mostPopular') },

  ctaLabel: { type: String, default: () => t('pricing.cta.getStarted') },
  ctaLabelKey: { type: String, default: "" },
  ctaTo: { type: [String, Object], default: "/register" },
  ctaVariant: { type: String, default: "outline" } // outline/main/gold
});
</script>

<style scoped>
.card {
  position: relative;
  background: var(--bg-white);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 18px;
  padding: 26px 24px;
  box-shadow: var(--shadow-md);
}

.card__name {
  margin: 6px 0 18px;
  font-size: 18px;
  font-weight: 700;
  color: var(--neutral-900);
}

.card__price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 18px;
}

.card__priceValue {
  font-size: 46px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--neutral-900);
}

.card__per {
  font-size: 14px;
  color: var(--neutral-700);
}

.card__desc {
  margin: 0 0 18px;
  font-size: 14px;
  color: var(--neutral-700);
}

.card__features {
  list-style: none;
  padding: 0;
  margin: 0 0 18px;
}

.card__cta {
  margin-top: 8px;
  display: flex;
}

/* Featured (middle) */
.card--featured {
  border: 2px solid var(--brand-gold);
  box-shadow: var(--shadow-lg);
  transform: translateY(-6px);
}

@media (max-width: 980px) {
  .card--featured {
    transform: none;
  }
}
</style>

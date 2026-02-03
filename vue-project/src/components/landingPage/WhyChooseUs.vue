<template>
  <section class="why-section" :id="id">
    <div class="container">
      <SectionHeader
          :title="$t('home.whyChoose.title')"
          :subtitle="$t('home.whyChoose.subtitle')"
      />

      <BenefitsGrid :items="benefits" />
    </div>
  </section>
</template>

<script setup>

import BenefitsGrid from "@/components/grids/BenefitsGrid.vue";
import SectionHeader from "@/components/ui/SectionHeader.vue";
import { t } from '@/i18n'

defineProps({
  id: { type: String, default: "why" }
});

const benefits = [
  {
    iconClass: "fas fa-layer-group",
    title: t('home.whyChoose.items.allInOne.title'),
    description: t('home.whyChoose.items.allInOne.description'),
    highlight: true
  },
  {
    iconClass: "fas fa-ad",
    title: t('home.whyChoose.items.noAds.title'),
    description: t('home.whyChoose.items.noAds.description')
  },
  {
    iconClass: "fas fa-infinity",
    title: t('home.whyChoose.items.unlimitedGuests.title'),
    description: t('home.whyChoose.items.unlimitedGuests.description')
  },
  {
    iconClass: "fas fa-heart",
    title: t('home.whyChoose.items.designedForEvents.title'),
    description: t('home.whyChoose.items.designedForEvents.description')
  }
];
</script>

<style scoped>
.why-section {
  padding: 6rem 0;
  background: var(--bg-white);
}

.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 0 24px;
}

.section-header {
  text-align: center;
  margin-bottom: 36px;
}

.section-title {
  margin: 0 0 10px;
  font-family: var(--font-family), serif;
  font-size: 44px;
  font-weight: 500;
  color: var(--neutral-900);
}

.section-subtitle {
  margin: 0;
  color: var(--neutral-700);
  font-size: 14px;
}
</style>

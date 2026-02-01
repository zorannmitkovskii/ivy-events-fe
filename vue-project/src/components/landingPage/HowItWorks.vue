<template>
  <section class="how-section">
    <div class="container">
      <SectionHeader
        :title="$t('home.howItWorks.title')"
        :subtitle="$t('home.howItWorks.subtitle')"
      />

      <StepsGrid :items="steps" />
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import StepsGrid from "@/components/grids/StepsGrid.vue";
import { t } from '@/i18n'

const steps = [
  {
    iconClass: "fas fa-palette",
    title: t('home.howItWorks.steps.chooseTemplate.title'),
    description: t('home.howItWorks.steps.chooseTemplate.description')
  },
  {
    iconClass: "fas fa-pen-to-square",
    title: t('home.howItWorks.steps.customizeEvent.title'),
    description: t('home.howItWorks.steps.customizeEvent.description')
  },
  {
    iconClass: "fas fa-paper-plane",
    title: t('home.howItWorks.steps.sendInvitations.title'),
    description: t('home.howItWorks.steps.sendInvitations.description')
  },
  {
    iconClass: "fas fa-chart-line",
    title: t('home.howItWorks.steps.trackRsvps.title'),
    description: t('home.howItWorks.steps.trackRsvps.description')
  }
];
</script>

<style scoped>
.how-section {
  padding: 6rem 0;
  background: var(--bg-white);
}

/* If you already have global container, remove this */
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>

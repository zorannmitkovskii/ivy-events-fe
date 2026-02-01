<template>
  <section class="features-section" :id="id">
    <div class="container">
      <SectionHeader
        :title="$t('home.features.title')"
        :subtitle="$t('home.features.subtitle')"
      />

      <FeatureGrid :items="features" />
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import FeatureGrid from "@/components/cards/FeatureGrid.vue";
import { t } from '@/i18n'

defineProps({
  id: { type: String, default: "features" }
});

const features = [
  {
    icon: "🎨",
    chipClass: "chip-pink",
    title: t('home.features.items.beautifulDesigns.title'),
    description: t('home.features.items.beautifulDesigns.description')
  },
  {
    icon: "👥",
    chipClass: "chip-green",
    title: t('home.features.items.rsvpManagement.title'),
    description: t('home.features.items.rsvpManagement.description')
  },
  {
    icon: "🔔",
    chipClass: "chip-blue",
    title: t('home.features.items.automatedReminders.title'),
    description: t('home.features.items.automatedReminders.description')
  },
  {
    icon: "📱",
    chipClass: "chip-purple",
    title: t('home.features.items.mobileFriendly.title'),
    description: t('home.features.items.mobileFriendly.description')
  },
  {
    icon: "📅",
    chipClass: "chip-gold",
    title: t('home.features.items.eventDetails.title'),
    description: t('home.features.items.eventDetails.description')
  },
  {
    icon: "📈",
    chipClass: "chip-peach",
    title: t('home.features.items.analytics.title'),
    description: t('home.features.items.analytics.description')
  }
];
</script>

<style scoped>
.features-section {
  padding: 6rem 0;
  background: var(--bg-main);
}

/* If you already have a global container class, remove this */
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>

<template>
  <section class="features-section" :id="id">
    <div class="container">
      <SectionHeader
        title="Features for Every Stage of Event Management"
        subtitle="Everything you need to plan, manage, and celebrate"
      />

      <FeatureGrid :items="features" />
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import FeatureGrid from "@/components/cards/FeatureGrid.vue";

defineProps({
  id: { type: String, default: "features" }
});

const features = [
  {
    icon: "🎨",
    chipClass: "chip-pink",
    title: "Beautiful Invitation Designs",
    description:
      "Choose from hundreds of professionally designed templates or create your own custom design"
  },
  {
    icon: "👥",
    chipClass: "chip-green",
    title: "RSVP & Guest Management",
    description:
      "Track responses, manage guest lists, and send automated reminders effortlessly"
  },
  {
    icon: "🔔",
    chipClass: "chip-blue",
    title: "Automated Reminders",
    description:
      "Send timely reminders to guests automatically so you never miss an RSVP"
  },
  {
    icon: "📱",
    chipClass: "chip-purple",
    title: "Mobile-Friendly Experience",
    description:
      "Perfect viewing on any device - your guests can RSVP from anywhere"
  },
  {
    icon: "📅",
    chipClass: "chip-gold",
    title: "Event Details & Schedule",
    description:
      "Share venue information, directions, schedule, and important details in one place"
  },
  {
    icon: "📈",
    chipClass: "chip-peach",
    title: "Real-Time Analytics",
    description:
      "Get insights into guest responses, attendance rates, and engagement metrics"
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

<template>
  <section class="how-section">
    <div class="container">
      <SectionHeader
        title="How It Works"
        subtitle="Four simple steps to your perfect event"
      />

      <StepsGrid :items="steps" />
    </div>
  </section>
</template>

<script setup>
import SectionHeader from "@/components/ui/SectionHeader.vue";
import StepsGrid from "@/components/cards/StepsGrid.vue";

const steps = [
  {
    iconClass: "fas fa-palette",
    title: "Choose a Template",
    description: "Browse our collection of elegant, customizable invitation designs"
  },
  {
    iconClass: "fas fa-pen-to-square",
    title: "Customize Your Event",
    description: "Add your details, photos, and personal touches with our easy editor"
  },
  {
    iconClass: "fas fa-paper-plane",
    title: "Send Invitations",
    description: "Share via email, text, or social media with one click"
  },
  {
    iconClass: "fas fa-chart-line",
    title: "Track RSVPs",
    description: "Monitor responses and manage your guest list in real-time"
  }
];
</script>

<style scoped>
.how-section {
  padding: 6rem 0;
  background: var(--white);
}

/* If you already have global container, remove this */
.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px;
}
</style>

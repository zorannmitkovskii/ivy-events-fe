<template>
  <section class="why-section" :id="id">
    <div class="container">
      <SectionHeader
          title="Why Choose EventPro?"
          subtitle="The complete solution for modern event planning"
      />

      <BenefitsGrid :items="benefits" />
    </div>
  </section>
</template>

<script setup>

import BenefitsGrid from "@/components/grids/BenefitsGrid.vue";
import SectionHeader from "@/components/ui/SectionHeader.vue";

defineProps({
  id: { type: String, default: "why" }
});

const benefits = [
  {
    iconClass: "fas fa-layer-group",
    title: "All-in-One Platform",
    description: "Invitations, RSVPs, guest management, and more in one place",
    highlight: true
  },
  {
    iconClass: "fas fa-ad",
    title: "No Ads on Invitations",
    description: "Keep your invitations clean and professional without distractions"
  },
  {
    iconClass: "fas fa-infinity",
    title: "Unlimited Guests",
    description: "Invite as many people as you need without restrictions"
  },
  {
    iconClass: "fas fa-heart",
    title: "Designed for Weddings & Events",
    description: "Purpose-built features for every type of celebration"
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

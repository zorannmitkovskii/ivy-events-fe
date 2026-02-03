<template>
  <main class="onboarding-page">
    <div class="onboarding-wrap">
      <EventBasicsCard
        :continueTo="{ name: 'home' }"
        @skip="onSkip"
      />
      <OnboardingFooterLinks />
    </div>
  </main>
</template>

<script setup>
import EventBasicsCard from "@/components/cards/EventBasicsCard.vue";
import OnboardingFooterLinks from "@/components/onboarding/OnboardingFooterLinks.vue";

function onSkip() {
  // optional: route somewhere, or store a flag
  // Example: router.push({ name: 'OnboardingGuests' })
  console.log("skip basics");
}
</script>

<style scoped>
.onboarding-page {
  min-height: 100vh;
  background: var(--bg-main);
  display: grid;
  place-items: center;
  padding: 40px 16px;
}

.onboarding-wrap {
  width: 100%;
  max-width: 520px;
  display: grid;
  gap: 14px;
}
</style>

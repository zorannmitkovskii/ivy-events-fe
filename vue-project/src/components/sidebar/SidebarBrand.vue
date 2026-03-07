<template>
  <div class="logo-area">
    <img src="/logoInv.svg" alt="Ivy Events" class="logo-full" />
    <div class="logo-tag">{{ tagline }}</div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { onboardingStore } from "@/store/onboarding.store";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const tagline = computed(() => {
  const cat = onboardingStore.selectedCategory;
  if (cat === "WEDDING") return t("sidebar.weddingPlanner");
  if (cat === "GALLERY") return t("sidebar.gallery");
  return t("sidebar.eventPlanner");
});
</script>

<style scoped>
.logo-area {
  padding: 28px 24px 22px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.logo-full {
  display: block;
  height: 32px;
  width: auto;
}

.logo-tag {
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.28);
  margin-top: 6px;
}
</style>

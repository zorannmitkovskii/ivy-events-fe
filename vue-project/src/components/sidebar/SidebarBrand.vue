<template>
  <div class="logo-area">
    <span class="ivy-logo ivy-logo--inverse logo-full" role="img" aria-label="Ivy Events"></span>
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
/* The design's brand block: no rule under it, and the tagline in the same
   letter-spaced micro-caps the sidebar uses for its section labels. */
.logo-area {
  padding: 22px 22px 20px;
}

.logo-full {
  --logo-h: 30px;
  display: block;
}

.logo-tag {
  margin-top: 10px;
  font-size: 8px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #789084;
}
</style>

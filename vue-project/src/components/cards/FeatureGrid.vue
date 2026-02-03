<template>
  <div class="feature-grid">
    <FeatureCard
      v-for="item in items"
      :key="item.title"
      v-bind="item"
    />
  </div>
</template>

<script setup>
import FeatureCard from "@/components/cards/FeatureCard.vue";

defineProps({
  items: { type: Array, required: true }
});
</script>

<style scoped>
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

/* Responsive */
@media (max-width: 1024px) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>

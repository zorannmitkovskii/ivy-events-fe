<template>
  <div class="templates-grid">
    <TemplateCard
      v-for="t in items"
      :key="t.title"
      v-bind="t"
    />
  </div>
</template>

<script setup>

import TemplateCard from "@/components/cards/TemplateCard.vue";

defineProps({
  items: { type: Array, required: true }
});
</script>

<style scoped>
.templates-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  align-items: start;
}

@media (max-width: 1100px) {
  .templates-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .templates-grid {
    grid-template-columns: 1fr;
  }
}
</style>

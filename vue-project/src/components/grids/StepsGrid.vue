<template>
  <div class="steps-grid">
    <StepCard
      v-for="(s, idx) in items"
      :key="s.title"
      :number="idx + 1"
      :iconClass="s.iconClass"
      :title="s.title"
      :description="s.description"
    />
  </div>
</template>

<script setup>
import StepCard from "@/components/cards/StepCard.vue";

defineProps({
  items: { type: Array, required: true }
});
</script>

<style scoped>
.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 44px;
  align-items: start;
  margin-top: 20px;
}

@media (max-width: 1024px) {
  .steps-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }
}

@media (max-width: 560px) {
  .steps-grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="benefits-grid">
    <BenefitItem
      v-for="b in items"
      :key="b.title"
      :iconClass="b.iconClass"
      :title="b.title"
      :description="b.description"
      :highlight="b.highlight"
    />
  </div>
</template>

<script setup>
import BenefitItem from "@/components/cards/BenefitItem.vue";

defineProps({
  items: { type: Array, required: true }
});
</script>

<style scoped>
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 22px;
}

@media (max-width: 900px) {
  .benefits-grid {
    grid-template-columns: 1fr;
  }
}
</style>

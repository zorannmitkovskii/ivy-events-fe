<template>
  <div class="category-grid">
    <CategoryCard
      v-for="item in items"
      :key="item.titleKey || item.title"
      :title="item.title"
      :titleKey="item.titleKey"
      :description="item.description"
      :descriptionKey="item.descriptionKey"
      :icon="item.icon"
      :chipClass="item.chipClass"
    />
  </div>
</template>

<script setup>
import CategoryCard from "@/components/cards/CategoryCard.vue";

defineProps({
  items: { type: Array, required: true }
});
</script>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}

/* Responsive */
@media (max-width: 1024px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .category-grid {
    grid-template-columns: 1fr;
  }
}
</style>

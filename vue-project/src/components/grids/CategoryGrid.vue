<template>
  <div class="category-grid">
    <CategoryCard
      v-for="item in items"
      :key="item.id"
      :title="item.title"
      :titleKey="item.titleKey"
      :description="item.description"
      :descriptionKey="item.descriptionKey"
      :icon="item.icon"
      :chipClass="item.chipClass"
      :selected="item.id === modelValue"
      :disabled="!!item.disabled"
      @select="$emit('update:modelValue', item.id)"
    />
  </div>
</template>

<script setup>
import CategoryCard from "@/components/cards/CategoryCard.vue";

defineEmits(["update:modelValue"]);

defineProps({
  items: { type: Array, required: true },

  // NEW: selected id
  modelValue: { type: [String, Number, null], default: null }
});
</script>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}

@media (max-width: 1024px) {
  .category-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 520px) {
  .category-grid { grid-template-columns: 1fr; }
}
</style>

<template>
  <div class="category-filter-bar">
    <template v-if="disabled">
      <span class="pill pill--active pill--locked">
        <svg class="lock-icon" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M9 5.5V4a3 3 0 1 0-6 0v1.5H2.25a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75H9ZM4 4a2 2 0 1 1 4 0v1.5H4V4Z" fill="currentColor"/>
        </svg>
        {{ activeLabel }}
      </span>
    </template>
    <template v-else>
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="pill"
        :class="{ 'pill--active': cat.id === modelValue }"
        @click="$emit('update:modelValue', cat.id)"
      >
        {{ cat.label }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  categories: { type: Array, required: true },
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
});

defineEmits(['update:modelValue']);

const activeLabel = computed(() => {
  const match = props.categories.find(c => c.id === props.modelValue);
  return match ? match.label : '';
});
</script>

<style scoped>
.category-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--neutral-200, #e5e7eb);
  background: #fff;
  color: var(--neutral-700, #374151);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill:hover:not(.pill--active):not(.pill--locked) {
  border-color: var(--neutral-400, #9ca3af);
}

.pill--active {
  background: var(--brand-main, #2E7D32);
  color: #fff;
  border-color: var(--brand-main, #2E7D32);
}

.pill--locked {
  cursor: default;
  opacity: 0.85;
}

.lock-icon {
  flex-shrink: 0;
}
</style>

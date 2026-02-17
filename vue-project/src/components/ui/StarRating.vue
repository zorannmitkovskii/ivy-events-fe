<template>
  <div class="star-rating" :class="{ 'star-rating--readonly': readonly }">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="star-btn"
      :disabled="readonly"
      @mouseenter="!readonly && (hovered = n)"
      @mouseleave="!readonly && (hovered = 0)"
      @click="!readonly && $emit('update:modelValue', n)"
    >
      <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        :fill="n <= (hovered || modelValue) ? 'var(--brand-gold, #f59e0b)' : 'none'"
        :stroke="n <= (hovered || modelValue) ? 'var(--brand-gold, #f59e0b)' : 'var(--neutral-300, #d1d5db)'"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";

defineProps({
  modelValue: { type: Number, default: 0 },
  readonly: { type: Boolean, default: false },
  size: { type: Number, default: 20 },
});

defineEmits(["update:modelValue"]);

const hovered = ref(0);
</script>

<style scoped>
.star-rating {
  display: inline-flex;
  gap: 2px;
}

.star-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.star-btn:hover:not(:disabled) {
  transform: scale(1.15);
}

.star-rating--readonly .star-btn {
  cursor: default;
  pointer-events: none;
}
</style>

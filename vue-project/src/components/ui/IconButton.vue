<template>
  <button
    type="button"
    class="w-10 h-10 inline-flex items-center justify-center rounded-small border border-gray-200 hover:border-gray-300 bg-white/60 hover:bg-white transition"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  ariaLabel: { type: String, required: true },
  disabled: { type: Boolean, default: false },
});
defineEmits(["click"]);
</script>

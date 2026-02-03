<template>
  <div class="segmented">
    <button
      v-for="opt in options"
      :key="opt.value"
      class="segmented-btn"
      :class="{ active: modelValue === opt.value }"
      @click="$emit('update:modelValue', opt.value)"
      type="button"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, required: true } // [{value,label}]
});
defineEmits(["update:modelValue"]);
</script>

<template>
  <label class="block" :for="forId">
    <span class="font-body text-sm text-gray-700 mb-2 block">
      {{ label }} <span v-if="required" class="text-pink-500">*</span>
    </span>
    <slot />
    <p v-if="hint" class="mt-2 text-xs text-gray-500">{{ hint }}</p>
    <p v-if="error" class="mt-2 text-xs text-red-600">{{ error }}</p>
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  forId: { type: String, default: "" },
  required: { type: Boolean, default: false },
  hint: { type: String, default: "" },
  error: { type: String, default: "" },
});
</script>

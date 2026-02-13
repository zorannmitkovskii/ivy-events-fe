<template>
  <textarea
    class="w-full px-4 py-3 border border-gray-300 rounded-small focus:outline-none focus:ring-2 focus:ring-pink-300 font-body"
    :id="id"
    :rows="rows"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: "" },
  id: { type: String, default: "" },
  rows: { type: Number, default: 4 },
  placeholder: { type: String, default: "" },
});
defineEmits(["update:modelValue"]);
</script>

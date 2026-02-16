<template>
  <input
    class="w-full px-4 py-3 border border-gray-300 rounded-small focus:outline-none focus:ring-2 focus:ring-pink-300 font-body"
    :id="id"
    :type="type"
    :placeholder="placeholder"
    :value="modelValue"
    :readonly="readonly"
    :autocomplete="autocomplete"
    @input="$emit('update:modelValue', $event.target.value)"
    @keydown.enter="$emit('enter')"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: "" },
  id: { type: String, default: "" },
  type: { type: String, default: "text" },
  placeholder: { type: String, default: "" },
  readonly: { type: Boolean, default: false },
  autocomplete: { type: String, default: "off" },
});
defineEmits(["update:modelValue", "enter"]);
</script>

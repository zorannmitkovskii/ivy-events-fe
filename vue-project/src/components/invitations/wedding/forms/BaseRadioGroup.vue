<template>
  <div class="flex gap-4 flex-wrap">
    <label v-for="opt in options" :key="opt.value" class="flex items-center">
      <input
        class="mr-2"
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="modelValue === opt.value"
        @change="$emit('update:modelValue', opt.value)"
      />
      <span class="font-body text-gray-700">{{ opt.label }}</span>
    </label>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: "" },
  name: { type: String, required: true },
  options: { type: Array, default: () => [] },
});
defineEmits(["update:modelValue"]);
</script>

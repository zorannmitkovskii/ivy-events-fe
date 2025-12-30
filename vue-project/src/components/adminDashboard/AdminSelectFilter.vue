<template>
  <div class="mb-3">
    <label class="form-label">{{ label }}</label>

    <select class="form-select w-auto"
            v-model="selected"
            @change="$emit('change', selected)">

      <option value="">All</option>

      <option :value="option"
              v-for="option in options"
              :key="option">
        {{ option }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  label: String,
  options: Array,
  modelValue: String
})

const emit = defineEmits(["update:modelValue", "change"])

const selected = ref(props.modelValue)

watch(selected, val => emit("update:modelValue", val))
</script>

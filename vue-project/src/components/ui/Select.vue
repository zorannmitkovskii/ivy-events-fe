<template>
  <select class="sel">
    <option value="">{{ placeholder ?? "Select" }}</option>
    <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
  </select>
</template>

<script setup lang="ts">
defineProps<{
  options: Array<{ label: string; value: string }>;
  placeholder?: string;
}>();
</script>

<style scoped>
.sel {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-300);
  background: var(--bg-white);
}
</style>

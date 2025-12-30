<template>
  <div class="card card-rounded p-3 h-100">
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <h6 class="mb-1">{{ title }}</h6>
        <div class="stats-number">{{ value }}</div>
        <small class="text-muted">{{ subtitle }}</small>
      </div>
      <div class="text-muted">{{ extra }}</div>
    </div>
    <div v-if="$slots.footer" class="mt-3"> <slot name="footer" /></div>
  </div>
</template>


<script setup>
import { defineProps } from 'vue'
const props = defineProps({ title: String, value: [String, Number], subtitle: String, extra: String })
</script>


<style scoped>
.card { border: none; }
</style>

<template>
  <div class="d-flex gap-3 overflow-auto py-2">
    <div v-for="(v, i) in vendors" :key="i" class="card vendor-card p-2" style="min-width:220px;">
<!--      <img :src="v.image" class="w-100" />-->
      <div class="p-2">
        <div class="fw-bold">{{ v.name }}</div>
        <small class="text-muted">{{ v.category }}</small>
      </div>
    </div>
  </div>
</template>


<script setup>
import { defineProps } from 'vue'
const props = defineProps({ vendors: { type: Array, default: () => [] } })
</script>


<style scoped>
.vendor-card { border-radius: 12px; }
</style>

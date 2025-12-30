<template>
  <div class="tasks-card">
    <h6 class="mb-3 text-brand-dark">This Week's Tasks</h6>
    <ul class="list-group list-group-flush">
      <li v-for="(t,i) in tasks" :key="i" class="list-group-item">
        {{ t }}
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({ tasks: { type: Array, default: () => [] }})
</script>

<style scoped>
.list-group-item { border: none; border-bottom: 1px solid #eee; }
</style>

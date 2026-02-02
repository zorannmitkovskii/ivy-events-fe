<template>
  <div class="card">
    <div v-if="title" class="card-head">
      <div class="card-title">{{ title }}</div>
      <slot name="action" />
    </div>
    <div class="card-body"><slot /></div>
  </div>
</template>

<script setup>
defineProps({ title: { type: String, default: "" } });
</script>

<style scoped>
.card{
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.card-head{
  display:flex; justify-content:space-between; align-items:center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.card-title{ font-weight: 950; }
.card-body{ padding: 14px 16px; }
</style>

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
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
.card-head{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--neutral-300);
}
.card-title{
  font-weight: 600;
  font-size: 16px;
  color: var(--brand-main);
}
.card-body{ padding: 16px 20px; }
</style>

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
  background: var(--dash-cream-card, #fff);
  border-radius: var(--dash-radius, 14px);
  border: 1px solid var(--dash-cream-border, #e6dfd4);
  box-shadow: var(--dash-shadow-sm, 0 1px 12px rgba(30,36,32,0.06));
}
.card-head{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--dash-cream-border, #e6dfd4);
}
.card-title{
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dash-muted, #7a7870);
  font-weight: 600;
}
.card-body{ padding: 16px 20px; }
</style>

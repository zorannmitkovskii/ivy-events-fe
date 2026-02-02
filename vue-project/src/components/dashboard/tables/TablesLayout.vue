<template>
  <div class="page">
    <div class="row">
      <div>
        <h1 class="h1">{{ title }}</h1>
        <div class="sub">{{ subtitle }}</div>
      </div>
      <div class="actions">
        <slot name="actions" />
      </div>
    </div>

    <div class="grid">
      <div><slot name="left" /></div>
      <div><slot name="right" /></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String
});
</script>

<style scoped>
.row{ display:flex; justify-content:space-between; align-items:flex-start; gap:12px; flex-wrap:wrap; }
.actions{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.grid{
  display:grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
}
@media (max-width: 1100px){
  .grid{ grid-template-columns: 1fr; }
}
</style>

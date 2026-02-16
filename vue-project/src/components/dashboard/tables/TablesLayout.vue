<template>
  <div class="layout">
    <DashboardToolbar>
      <template #actions>
        <slot name="actions" />
      </template>
    </DashboardToolbar>

    <div class="grid">
      <div><slot name="left" /></div>
      <div><slot name="right" /></div>
    </div>
  </div>
</template>

<script setup>
import DashboardToolbar from "@/components/dashboard/DashboardToolbar.vue";
</script>

<style scoped>
.layout {
  display: grid;
  gap: 24px;
}

.grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 24px;
}

@media (max-width: 1100px) {
  .grid { grid-template-columns: 1fr; }
}
</style>

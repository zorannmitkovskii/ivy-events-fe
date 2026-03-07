<template>
  <div class="table-card">
    <div class="table-scroll">
      <table class="d-table" :class="{ 'fixed-layout': cols?.length }">
        <colgroup v-if="cols?.length">
          <col v-for="(w, i) in cols" :key="i" :style="{ width: w }" />
        </colgroup>

        <thead>
          <tr>
            <slot name="head" />
          </tr>
        </thead>

        <tbody>
          <slot name="body" />
        </tbody>
      </table>
    </div>

    <div v-if="$slots.footer" class="table-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  cols: { type: Array, default: null }
});
</script>

<style scoped>
.table-card {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.d-table {
  width: 100%;
  border-collapse: collapse;
}

.d-table.fixed-layout {
  table-layout: fixed;
}

.d-table thead {
  background: var(--dash-sage-ghost);
  border-bottom: 1px solid var(--dash-cream-border);
}

.d-table :deep(th) {
  padding: 13px 24px;
  text-align: left;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dash-muted);
  white-space: nowrap;
}

.d-table :deep(tbody tr) {
  border-bottom: 1px solid var(--dash-cream-border);
  transition: background 0.15s ease;
}

.d-table :deep(tbody tr:last-child) {
  border-bottom: none;
}

.d-table :deep(tbody tr:hover) {
  background: var(--dash-cream);
}

.d-table :deep(tbody td) {
  padding: 14px 24px;
  font-size: 13.5px;
  color: var(--dash-ink);
  vertical-align: middle;
}

.table-footer {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 24px;
  background: var(--dash-sage-ghost);
  border-top: 1px solid var(--dash-cream-border);
  font-size: 12.5px;
  color: var(--dash-muted);
}

@media (max-width: 900px) {
  .d-table :deep(th),
  .d-table :deep(tbody td) {
    padding: 12px 16px;
  }
}
</style>

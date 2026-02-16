<template>
  <div class="table-card">
    <div class="table-scroll">
      <table class="d-table">
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

<style scoped>
.table-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.d-table {
  width: 100%;
  border-collapse: collapse;
}

.d-table thead {
  background: var(--bg-main);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.d-table :deep(th) {
  padding: 14px 24px;
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-900);
  white-space: nowrap;
}

.d-table :deep(tbody tr) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.15s ease;
}

.d-table :deep(tbody tr:hover) {
  background: var(--bg-main);
}

.d-table :deep(tbody td) {
  padding: 14px 24px;
  font-size: 14px;
  color: var(--neutral-900);
  vertical-align: middle;
}

.table-footer {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 14px 24px;
  background: var(--bg-main);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 13px;
  color: var(--neutral-500);
}

@media (max-width: 900px) {
  .d-table :deep(th),
  .d-table :deep(tbody td) {
    padding: 12px 16px;
  }
}
</style>

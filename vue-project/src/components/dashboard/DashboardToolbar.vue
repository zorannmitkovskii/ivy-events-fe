<template>
  <div class="toolbar-card">
    <div class="toolbar-inner">
      <div class="btn-group">
        <slot name="actions" />
      </div>

      <div class="filter-group">
        <slot name="filters" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 16px 24px;
}

.toolbar-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.btn-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group :deep(.filter-input),
.filter-group :deep(.filter-select) {
  padding: 10px 16px;
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--neutral-900);
  background: #fff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-group :deep(.filter-input) {
  width: 220px;
}

.filter-group :deep(.filter-input)::placeholder {
  color: var(--neutral-500);
}

.filter-group :deep(.filter-input):focus,
.filter-group :deep(.filter-select):focus {
  border-color: var(--brand-gold);
  box-shadow: 0 0 0 3px rgba(200, 162, 77, 0.15);
}

@media (max-width: 1100px) {
  .toolbar-inner {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-group {
    width: 100%;
  }
  .filter-group :deep(.filter-input) {
    flex: 1;
    width: auto;
  }
  .filter-group :deep(.filter-select) {
    flex: 1;
  }
}

@media (max-width: 640px) {
  .toolbar-card {
    padding: 14px 16px;
  }
  .btn-group {
    width: 100%;
  }
  .btn-group :deep(.btn) {
    flex: 1;
  }
  .filter-group {
    flex-direction: column;
  }
}
</style>

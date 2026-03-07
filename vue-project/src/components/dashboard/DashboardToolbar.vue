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
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
  padding: 14px 24px;
}

.toolbar-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.btn-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-group :deep(.filter-input),
.filter-group :deep(.filter-select) {
  padding: 9px 14px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 9px;
  font-size: 13px;
  font-family: 'Outfit', sans-serif;
  color: var(--dash-ink);
  background: var(--dash-cream);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-group :deep(.filter-input) {
  width: 220px;
}

.filter-group :deep(.filter-input)::placeholder {
  color: var(--dash-light);
}

.filter-group :deep(.filter-input):focus,
.filter-group :deep(.filter-select):focus {
  border-color: var(--dash-sage-light);
  box-shadow: 0 0 0 3px rgba(90, 122, 82, 0.1);
  background: var(--dash-cream-card);
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
    padding: 12px 16px;
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

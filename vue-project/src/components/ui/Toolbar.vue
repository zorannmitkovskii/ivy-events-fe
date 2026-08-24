<template>
  <div class="toolbar">
    <div v-if="searchable" class="toolbar__search">
      <svg class="toolbar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="search"
        :value="search"
        :placeholder="searchPlaceholder"
        :aria-label="searchPlaceholder"
        @input="$emit('update:search', $event.target.value)"
      />
    </div>

    <slot name="filters" />

    <div v-if="$slots.actions" class="toolbar__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
/**
 * Toolbar — search, filters and actions above a table or list.
 *
 * Search grows, filters sit next to it, actions go right. Rebuilt on every
 * screen before this; the search box was a different width on each one.
 */
defineProps({
  searchable: { type: Boolean, default: true },
  search: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '' },
})
defineEmits(['update:search'])
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  font-family: var(--font-ui);
}

.toolbar__search { flex: 1; min-width: 180px; position: relative; }

.toolbar__icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: var(--ink-3);
  pointer-events: none;
}

.toolbar__search input {
  width: 100%;
  height: 34px;
  padding: 0 11px 0 33px;
  font: inherit;
  font-size: 13.5px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line-2);
  border-radius: var(--radius-sm);
}
.toolbar__search input::placeholder { color: var(--ink-3); }
.toolbar__search input:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 1px;
}

.toolbar__actions {
  margin-left: auto;
  display: flex;
  gap: 9px;
  flex-wrap: wrap;
}

@media (max-width: 720px) {
  .toolbar__actions { margin-left: 0; }
}
</style>

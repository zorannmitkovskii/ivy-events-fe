<template>
  <RouterLink :to="to" class="nav-item" :class="{ active }">
    <span class="nav-icon" v-html="icon" />
    <span class="nav-label">{{ label }}</span>
    <span v-if="badge" class="nav-badge">{{ badge }}</span>
  </RouterLink>
</template>

<script setup>
defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, default: "" },
  badge: { type: String, default: null },
  active: { type: Boolean, default: false }
});
</script>

<style scoped>
/*
  The redesign's nav row: a rounded pill that fills on hover and when active,
  and a short gold bar pushed to the right edge of the row rather than a
  full-height rule glued to the panel edge. Smaller and quieter than before —
  in the design the sidebar is navigation, not a second headline.
*/
.nav-item {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 0 8px;
  padding: 12px 14px;
  border-radius: 9px;
  font-family: var(--font-ui);
  font-size: 11px;
  color: #91a49b;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  text-decoration: none;
}

.nav-item:hover,
.nav-item.active {
  background: var(--d-side-hover);
  color: #fff;
}

.nav-item.active::after {
  content: '';
  width: 3px;
  height: 18px;
  margin-left: auto;
  border-radius: 3px;
  background: var(--d-gold);
}

.nav-icon {
  width: 22px;
  height: 22px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.nav-icon :deep(svg) {
  width: 17px;
  height: 17px;
  stroke: currentColor;
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* The badge and the active marker both want the row's right edge; when a row
   has both, the badge sits first and the marker closes the row. */
.nav-badge {
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(200, 163, 89, 0.18);
  color: var(--d-gold);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-item.active .nav-label {
  flex: initial;
}
</style>

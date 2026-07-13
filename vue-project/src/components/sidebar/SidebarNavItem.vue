<template>
  <RouterLink :to="to" class="nav-item" :class="{ active }">
    <span class="nav-icon" v-html="icon" />
    <span class="nav-label">{{ label }}</span>
    <span v-if="hasCount" class="nav-count">{{ count }}</span>
    <span v-else-if="badge" class="nav-badge">{{ badge }}</span>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, default: "" },
  badge: { type: String, default: null },
  count: { type: [Number, String], default: null },
  active: { type: Boolean, default: false }
});

const hasCount = computed(() => props.count !== null && props.count !== undefined && props.count !== '');
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  /* Slightly larger hit area, room for the left accent bar */
  padding: 9px 20px 9px 20px;
  font-size: 13.5px;
  /* Higher contrast than the previous 0.44 — meets WCAG AA on the dark sidebar bg. */
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  text-decoration: none;
  position: relative;
  letter-spacing: 0.01em;
  font-weight: 500;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.nav-item.active {
  color: #fff;
  background: rgba(90, 122, 82, 0.22);
  font-weight: 600;
}

/* Left-side active indicator — matches the redesign proposal. */
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  background: var(--brand-light, #9FC0AC);
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  width: 18px;
  text-align: center;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  opacity: 0.9;
}

.nav-item.active .nav-icon { opacity: 1; }

.nav-icon :deep(svg) {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* Neutral count pill — no gold. Just a subtle chip that fades into the
   sidebar background but is scannable. */
.nav-count {
  min-width: 22px;
  padding: 1px 8px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
  line-height: 1.5;
}

.nav-item.active .nav-count {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

/* Legacy badge prop kept for backwards-compat with any callers. */
.nav-badge {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
}
</style>

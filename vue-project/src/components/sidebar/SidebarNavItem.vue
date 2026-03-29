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
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.44);
  cursor: pointer;
  transition: all 0.18s;
  text-decoration: none;
  position: relative;
  letter-spacing: 0.01em;
}

.nav-item:hover {
  color: rgba(255, 255, 255, 0.78);
  background: rgba(255, 255, 255, 0.04);
}

.nav-item.active {
  color: #fff;
  background: rgba(90, 122, 82, 0.18);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  right: 0;
  top: 25%;
  bottom: 25%;
  width: 3px;
  background: var(--dash-sage-mid);
  border-radius: 3px 0 0 3px;
}

.nav-icon {
  width: 18px;
  text-align: center;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

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

.nav-badge {
  background: var(--dash-gold);
  color: #fff;
  border-radius: 20px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
}
</style>

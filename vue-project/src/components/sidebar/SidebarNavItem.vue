<template>
  <RouterLink :to="to" class="item" :class="{ active }">
    <div class="left">
      <span class="icon" v-html="icon" />
      <span class="label">{{ label }}</span>
    </div>

    <span v-if="badge" class="badge">{{ badge }}</span>
  </RouterLink>
</template>

<script setup>
defineProps({
  to: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, default: "" }, // inline svg html
  badge: { type: String, default: null },
  active: { type: Boolean, default: false }
});
</script>

<style scoped>
.item {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--neutral-100);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between;

  /* ✅ fixed nav height target like you asked */
  height: 48px;
}
.item:hover { background: var(--neutral-700); color: var(--bg-white); }
.active { background: var(--neutral-500); color: var(--bg-white); }

.left { display:flex; align-items:center; gap: 10px; min-width: 0; }
.label { font-weight: 600; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }

.icon{
  width: 18px;
  height: 18px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  opacity: .95;
}
.icon :deep(svg){
  width: 18px;
  height: 18px;
  stroke: currentColor;
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.badge {
  background: var(--brand-gold);
  color: #1b1b1b;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 800;
}
</style>

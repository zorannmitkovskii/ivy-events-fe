<template>
  <div class="card card-pad-lg">
    <div class="card-head">
      <div class="card-label">{{ title }}</div>
      <div class="card-icon">👥</div>
    </div>

    <div class="kpi">{{ value }}</div>

    <div v-if="meta?.length" class="meta">
      <span v-for="m in meta" :key="m.label" class="dot">
        <i></i>{{ m.value }} {{ m.label }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  value: [String, Number],
  meta: Array
});
</script>

<style scoped>
.meta {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--neutral-700);
  font-size: 12px;
  font-weight: 700;
}
.dot { display: inline-flex; align-items: center; gap: 6px; }
.dot i {
  width: 7px; height: 7px;
  border-radius: 999px;
  background: var(--brand-main);
  opacity: .85;
  display: inline-block;
}
</style>

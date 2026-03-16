<template>
  <div class="layout-picker">
    <div class="layout-grid">
      <button
        v-for="layout in layouts"
        :key="layout.key"
        class="layout-card"
        :class="{ 'layout-card--active': current === layout.key }"
        @click="emit('select', layout.key)"
      >
        <div class="layout-diagram" v-html="layout.diagram"></div>
        <span class="layout-label">{{ layout.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  layouts: { type: Array, required: true },
  current: { type: String, default: '' },
});

const emit = defineEmits(['select']);
</script>

<style scoped>
.layout-picker {
  padding: 12px 16px;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.layout-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px 10px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  font-family: inherit;
}

.layout-card:hover {
  border-color: #9ca3af;
}

.layout-card--active {
  border-color: #1f2937;
  background: #f3f4f6;
}

.layout-diagram {
  width: 100%;
  max-width: 64px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.layout-diagram :deep(svg) {
  width: 100%;
  height: 100%;
}

.layout-label {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.layout-card--active .layout-label {
  color: #1f2937;
}
</style>

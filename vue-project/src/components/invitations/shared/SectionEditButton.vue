<template>
  <button
    v-if="visible"
    class="section-edit-btn"
    :class="[`section-edit-btn--${variant}`]"
    type="button"
    @click="$emit('click')"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
      <path d="m15 5 4 4"/>
    </svg>
    <span v-if="label">{{ label }}</span>
  </button>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  label: { type: String, default: '' },
  variant: { type: String, default: 'light', validator: v => ['light', 'dark'].includes(v) },
});

defineEmits(['click']);
</script>

<style scoped>
.section-edit-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.section-edit-btn:hover {
  opacity: 1;
  transform: scale(1.05);
}

.section-edit-btn--light {
  background: rgba(255, 255, 255, 0.85);
  color: #1f2937;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-edit-btn--dark {
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>

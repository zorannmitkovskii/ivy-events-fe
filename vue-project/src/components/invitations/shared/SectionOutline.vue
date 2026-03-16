<template>
  <div class="section-outline">
    <div class="outline-header">
      <span class="outline-title">{{ t('editSection.sectionOutline') }}</span>
    </div>
    <div class="outline-list">
      <div
        v-for="(key, index) in order"
        :key="key"
        class="outline-row"
        :class="{
          'outline-row--hidden': !isVisible(key),
          'outline-row--dragging': dragIndex === index,
          'outline-row--over': dropIndex === index && dropIndex !== dragIndex,
        }"
        draggable="true"
        @dragstart="onDragStart(index, $event)"
        @dragover.prevent="onDragOver(index)"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop(index)"
        @dragend="onDragEnd"
      >
        <!-- Drag handle -->
        <span class="outline-drag">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="8" y2="6.01"/><line x1="16" y1="6" x2="16" y2="6.01"/>
            <line x1="8" y1="12" x2="8" y2="12.01"/><line x1="16" y1="12" x2="16" y2="12.01"/>
            <line x1="8" y1="18" x2="8" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/>
          </svg>
        </span>

        <!-- Eye toggle -->
        <button class="outline-eye" @click.stop="emit('toggle-visibility', key)" :title="isVisible(key) ? t('editSection.sectionHidden') : t('editSection.sectionVisible')">
          <svg v-if="isVisible(key)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        </button>

        <!-- Label (click to select) -->
        <button class="outline-label" @click.stop="emit('select', key)">
          {{ getLabelForKey(key) }}
        </button>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  sections: { type: Array, required: true },
  order: { type: Array, required: true },
  visibility: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['reorder', 'toggle-visibility', 'select']);

function isVisible(key) {
  return props.visibility[key] !== false;
}

function getLabelForKey(key) {
  const section = props.sections.find(s => s.key === key);
  return section?.label || key;
}

// HTML5 Drag & Drop
const dragIndex = ref(null);
const dropIndex = ref(null);

function onDragStart(index, e) {
  dragIndex.value = index;
  e.dataTransfer.effectAllowed = 'move';
}

function onDragOver(index) {
  dropIndex.value = index;
}

function onDragLeave() {
  dropIndex.value = null;
}

function onDrop(toIndex) {
  const fromIndex = dragIndex.value;
  if (fromIndex === null || fromIndex === toIndex) return;
  const newOrder = [...props.order];
  const [item] = newOrder.splice(fromIndex, 1);
  newOrder.splice(toIndex, 0, item);
  emit('reorder', newOrder);
  dragIndex.value = null;
  dropIndex.value = null;
}

function onDragEnd() {
  dragIndex.value = null;
  dropIndex.value = null;
}
</script>

<style scoped>
.section-outline {
  padding: 8px 0;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
}

.outline-title {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.outline-list {
  display: flex;
  flex-direction: column;
}

.outline-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  transition: background 0.15s, opacity 0.15s;
  cursor: grab;
}

.outline-row:hover {
  background: #f9fafb;
}

.outline-row--hidden {
  opacity: 0.45;
}

.outline-row--dragging {
  opacity: 0.4;
}

.outline-row--over {
  border-top: 2px solid #3b82f6;
}

.outline-drag {
  display: flex;
  align-items: center;
  color: #d1d5db;
  flex-shrink: 0;
  cursor: grab;
}

.outline-eye {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
  transition: color 0.15s;
}

.outline-eye:hover {
  color: #374151;
}

.outline-row--hidden .outline-eye {
  color: #d1d5db;
}

.outline-label {
  flex: 1;
  border: none;
  background: none;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: inherit;
  transition: color 0.15s;
}

.outline-label:hover {
  color: #1f2937;
}

.outline-row--hidden .outline-label {
  color: #9ca3af;
  text-decoration: line-through;
}

</style>

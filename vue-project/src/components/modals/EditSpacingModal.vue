<template>
  <BaseModal :open="open" :title="t('editSection.layoutSpacing')" @close="emit('close')">
    <div class="spacing-modal">
      <div class="preset-grid">
        <button
          v-for="p in PRESETS"
          :key="p.key"
          class="preset-card"
          :class="{ 'preset-card--active': localPreset === p.key }"
          @click="localPreset = p.key; emitChange()"
        >
          <!-- Miniature layout diagram -->
          <div class="preset-diagram" :style="{ gap: p.diagramGap }">
            <div class="diagram-bar diagram-bar--header"></div>
            <div class="diagram-bar diagram-bar--content" :style="{ height: p.diagramContent }"></div>
            <div class="diagram-bar diagram-bar--content" :style="{ height: p.diagramContent }"></div>
            <div class="diagram-bar diagram-bar--footer"></div>
          </div>
          <span class="preset-label">{{ p.label }}</span>
        </button>
      </div>
    </div>

    <template v-if="!liveEdit" #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">Cancel</ButtonMain>
      <ButtonMain variant="main" type="button" @click="onSave">{{ t('editSection.save') }}</ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/components/ui/BaseModal.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';

const { t } = useI18n();

const PRESETS = [
  {
    key: 'compact',
    label: '',
    diagramGap: '3px',
    diagramContent: '18px',
  },
  {
    key: 'balanced',
    label: '',
    diagramGap: '6px',
    diagramContent: '22px',
  },
  {
    key: 'spacious',
    label: '',
    diagramGap: '10px',
    diagramContent: '28px',
  },
];

// Assign labels after i18n
PRESETS[0].label = t('editSection.compact');
PRESETS[1].label = t('editSection.balanced');
PRESETS[2].label = t('editSection.spacious');

const props = defineProps({
  open: { type: Boolean, default: false },
  liveEdit: { type: Boolean, default: false },
  currentPreset: { type: String, default: 'balanced' },
});

const emit = defineEmits(['close', 'save', 'change']);

const localPreset = ref(props.currentPreset);

watch(() => props.open, (v) => {
  if (v) {
    localPreset.value = props.currentPreset;
  }
}, { immediate: true });

function emitChange() {
  if (props.liveEdit) {
    emit('change', localPreset.value);
  }
}

function onSave() {
  emit('save', localPreset.value);
}
</script>

<style scoped>
.spacing-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  font-family: inherit;
}

.preset-card:hover {
  border-color: #9ca3af;
}

.preset-card--active {
  border-color: #1f2937;
  background: #f3f4f6;
}

.preset-diagram {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 48px;
}

.diagram-bar {
  border-radius: 2px;
}

.diagram-bar--header {
  height: 8px;
  background: #9ca3af;
  border-radius: 2px 2px 0 0;
}

.diagram-bar--content {
  background: #d1d5db;
}

.diagram-bar--footer {
  height: 6px;
  background: #9ca3af;
  border-radius: 0 0 2px 2px;
}

.preset-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.preset-card--active .preset-label {
  color: #1f2937;
}
</style>

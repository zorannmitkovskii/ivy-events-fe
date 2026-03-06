<template>
  <BaseModal :open="open" :title="t('editSection.buttons')" @close="emit('close')">
    <div class="buttons-modal">
      <!-- Live Preview -->
      <div class="btn-preview-area">
        <label class="section-label">{{ t('editSection.preview') }}</label>
        <div class="btn-preview-box">
          <button
            class="btn-sample"
            :style="{
              background: localBg,
              color: localText,
              borderRadius: localRadius,
            }"
          >
            Sample Button
          </button>
        </div>
      </div>

      <!-- Button Color -->
      <div class="color-field">
        <label class="section-label">{{ t('editSection.buttonBg') }}</label>
        <div class="color-input-row">
          <div class="color-swatch" :style="{ background: localBg }"></div>
          <input type="color" :value="localBg" class="color-picker" @input="localBg = $event.target.value; emitChange()" />
          <input type="text" :value="localBg" class="color-hex" maxlength="7" @input="onHexInput('bg', $event)" />
        </div>
      </div>

      <!-- Text Color -->
      <div class="color-field">
        <label class="section-label">{{ t('editSection.buttonText') }}</label>
        <div class="color-input-row">
          <div class="color-swatch" :style="{ background: localText }"></div>
          <input type="color" :value="localText" class="color-picker" @input="localText = $event.target.value; emitChange()" />
          <input type="text" :value="localText" class="color-hex" maxlength="7" @input="onHexInput('text', $event)" />
        </div>
      </div>

      <!-- Border Radius -->
      <div class="radius-field">
        <label class="section-label">{{ t('editSection.borderRadius') }}</label>
        <div class="radius-chips">
          <button
            v-for="r in RADIUS_OPTIONS"
            :key="r"
            class="radius-chip"
            :class="{ 'radius-chip--active': localRadius === r }"
            @click="localRadius = r; emitChange()"
          >
            <span class="radius-preview" :style="{ borderRadius: r }"></span>
            {{ r }}
          </button>
        </div>
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

const RADIUS_OPTIONS = ['0px', '4px', '8px', '12px', '24px', '999px'];

const props = defineProps({
  open: { type: Boolean, default: false },
  liveEdit: { type: Boolean, default: false },
  currentBg: { type: String, default: '#1f2937' },
  currentText: { type: String, default: '#ffffff' },
  currentRadius: { type: String, default: '8px' },
});

const emit = defineEmits(['close', 'save', 'change']);

const localBg = ref(props.currentBg);
const localText = ref(props.currentText);
const localRadius = ref(props.currentRadius);

watch(() => props.open, (v) => {
  if (v) {
    localBg.value = props.currentBg;
    localText.value = props.currentText;
    localRadius.value = props.currentRadius;
  }
}, { immediate: true });

function getPayload() {
  return { bg: localBg.value, text: localText.value, radius: localRadius.value };
}

function emitChange() {
  if (props.liveEdit) {
    emit('change', getPayload());
  }
}

function onHexInput(field, e) {
  const val = e.target.value;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    if (field === 'bg') localBg.value = val;
    else localText.value = val;
    emitChange();
  }
}

function onSave() {
  emit('save', getPayload());
}
</script>

<style scoped>
.buttons-modal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.btn-preview-area {
  margin-bottom: 4px;
}

.btn-preview-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.btn-sample {
  padding: 14px 32px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: default;
  font-family: inherit;
  transition: all 0.2s;
}

/* Color field */
.color-field {
  display: flex;
  flex-direction: column;
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.color-picker {
  width: 40px;
  height: 32px;
  border: none;
  padding: 0;
  cursor: pointer;
  background: transparent;
  flex-shrink: 0;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.color-hex {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  color: #1f2937;
}

.color-hex:focus {
  outline: none;
  border-color: #6b7280;
}

/* Radius chips */
.radius-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.radius-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.15s;
  font-family: inherit;
}

.radius-chip:hover {
  border-color: #9ca3af;
}

.radius-chip--active {
  border-color: #1f2937;
  background: #f3f4f6;
  font-weight: 600;
}

.radius-preview {
  width: 18px;
  height: 18px;
  border: 2px solid #6b7280;
  background: #f9fafb;
}
</style>

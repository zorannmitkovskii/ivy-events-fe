<template>
  <BaseModal :open="open" :title="t('editSection.background')" @close="emit('close')">
    <div class="bg-modal">
      <!-- Preview Card -->
      <div class="preview-area">
        <label class="section-label">{{ t('editSection.preview') }}</label>
        <div class="preview-box" :style="{ background: localSectionBg }">
          <div
            class="preview-card"
            :style="{
              background: localCardBg,
              boxShadow: SHADOW_MAP[localCardShadow],
              borderRadius: localCardRadius,
              borderWidth: localCardBorder,
              borderStyle: localCardBorder !== '0px' ? 'solid' : 'none',
              borderColor: '#d1d5db',
            }"
          >
            <div class="preview-card__title">Card Title</div>
            <div class="preview-card__text">Content preview</div>
          </div>
        </div>
      </div>

      <!-- Section Background -->
      <div class="color-field">
        <label class="section-label">{{ t('editSection.sectionBg') }}</label>
        <div class="color-input-row">
          <div class="color-swatch" :style="{ background: localSectionBg }"></div>
          <input type="color" :value="localSectionBg" class="color-picker" @input="localSectionBg = $event.target.value; emitChange()" />
          <input type="text" :value="localSectionBg" class="color-hex" maxlength="7" @input="onHex('sectionBg', $event)" />
        </div>
      </div>

      <!-- Card Background -->
      <div class="color-field">
        <label class="section-label">{{ t('editSection.cardBg') }}</label>
        <div class="color-input-row">
          <div class="color-swatch" :style="{ background: localCardBg }"></div>
          <input type="color" :value="localCardBg" class="color-picker" @input="localCardBg = $event.target.value; emitChange()" />
          <input type="text" :value="localCardBg" class="color-hex" maxlength="7" @input="onHex('cardBg', $event)" />
        </div>
      </div>

      <!-- Card Shadow -->
      <div class="field">
        <label class="section-label">{{ t('editSection.cardShadow') }}</label>
        <div class="shadow-chips">
          <button
            v-for="s in SHADOW_OPTIONS"
            :key="s.key"
            class="shadow-chip"
            :class="{ 'shadow-chip--active': localCardShadow === s.key }"
            @click="localCardShadow = s.key; emitChange()"
          >
            <span class="shadow-dot" :style="{ boxShadow: SHADOW_MAP[s.key] }"></span>
            {{ s.label }}
          </button>
        </div>
      </div>

      <!-- Card Radius -->
      <div class="field">
        <label class="section-label">{{ t('editSection.cardRadius') }}</label>
        <div class="radius-chips">
          <button
            v-for="r in RADIUS_OPTIONS"
            :key="r"
            class="radius-chip"
            :class="{ 'radius-chip--active': localCardRadius === r }"
            @click="localCardRadius = r; emitChange()"
          >
            <span class="radius-preview" :style="{ borderRadius: r }"></span>
            {{ r }}
          </button>
        </div>
      </div>

      <!-- Card Border -->
      <div class="field">
        <label class="section-label">{{ t('editSection.cardBorder') }}</label>
        <div class="radius-chips">
          <button
            v-for="b in BORDER_OPTIONS"
            :key="b"
            class="radius-chip"
            :class="{ 'radius-chip--active': localCardBorder === b }"
            @click="localCardBorder = b; emitChange()"
          >
            {{ b }}
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

const SHADOW_MAP = {
  none: 'none',
  subtle: '0px 4px 20px rgba(0,0,0,0.08)',
  medium: '0px 6px 24px rgba(0,0,0,0.12)',
  strong: '0px 10px 40px rgba(0,0,0,0.18)',
};

const SHADOW_OPTIONS = [
  { key: 'none', label: '' },
  { key: 'subtle', label: '' },
  { key: 'medium', label: '' },
  { key: 'strong', label: '' },
];

const RADIUS_OPTIONS = ['0px', '8px', '16px', '24px', '32px'];
const BORDER_OPTIONS = ['0px', '1px', '2px'];

const props = defineProps({
  open: { type: Boolean, default: false },
  liveEdit: { type: Boolean, default: false },
  currentSectionBg: { type: String, default: '#f9fafb' },
  currentCardBg: { type: String, default: '#ffffff' },
  currentCardShadow: { type: String, default: 'subtle' },
  currentCardRadius: { type: String, default: '24px' },
  currentCardBorder: { type: String, default: '0px' },
});

const emit = defineEmits(['close', 'save', 'change']);

const localSectionBg = ref(props.currentSectionBg);
const localCardBg = ref(props.currentCardBg);
const localCardShadow = ref(props.currentCardShadow);
const localCardRadius = ref(props.currentCardRadius);
const localCardBorder = ref(props.currentCardBorder);

// Compute labels after i18n is available
SHADOW_OPTIONS[0].label = t('editSection.shadowNone');
SHADOW_OPTIONS[1].label = t('editSection.shadowSubtle');
SHADOW_OPTIONS[2].label = t('editSection.shadowMedium');
SHADOW_OPTIONS[3].label = t('editSection.shadowStrong');

watch(() => props.open, (v) => {
  if (v) {
    localSectionBg.value = props.currentSectionBg;
    localCardBg.value = props.currentCardBg;
    localCardShadow.value = props.currentCardShadow;
    localCardRadius.value = props.currentCardRadius;
    localCardBorder.value = props.currentCardBorder;
  }
}, { immediate: true });

function getPayload() {
  return {
    sectionBg: localSectionBg.value,
    cardBg: localCardBg.value,
    cardShadow: localCardShadow.value,
    cardRadius: localCardRadius.value,
    cardBorder: localCardBorder.value,
  };
}

function emitChange() {
  if (props.liveEdit) {
    emit('change', getPayload());
  }
}

function onHex(field, e) {
  const val = e.target.value;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    if (field === 'sectionBg') localSectionBg.value = val;
    else localCardBg.value = val;
    emitChange();
  }
}

function onSave() {
  emit('save', getPayload());
}
</script>

<style scoped>
.bg-modal {
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

/* Preview */
.preview-box {
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
}

.preview-card {
  padding: 20px;
  width: 100%;
  max-width: 200px;
  text-align: center;
}

.preview-card__title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.preview-card__text {
  font-size: 12px;
  color: #9ca3af;
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

/* Shadow chips */
.shadow-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.shadow-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: border-color 0.15s;
  font-family: inherit;
  min-width: 64px;
}

.shadow-chip:hover {
  border-color: #9ca3af;
}

.shadow-chip--active {
  border-color: #1f2937;
  background: #f3f4f6;
  color: #374151;
  font-weight: 600;
}

.shadow-dot {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #fff;
  border: 1px solid #e5e7eb;
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

<template>
  <BaseModal :open="open" :title="t('editSection.colors')" @close="emit('close')">
    <div class="colors-modal">
      <!-- Preset Palettes -->
      <div v-if="presets.length" class="presets-section">
        <label class="presets-label">{{ t('editSection.colorPresets') }}</label>
        <div class="presets-grid">
          <button
            v-for="(preset, i) in presets"
            :key="i"
            type="button"
            class="preset-card"
            :class="{ 'preset-card--active': activePresetIndex === i }"
            @click="applyPreset(preset, i)"
          >
            <div class="preset-swatches">
              <span
                v-for="(color, ci) in presetSwatches(preset)"
                :key="ci"
                class="preset-dot"
                :style="{ background: color }"
              ></span>
            </div>
            <span class="preset-name">{{ preset.name }}</span>
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div v-if="presets.length" class="presets-divider">
        <span>{{ t('editSection.customColors') }}</span>
      </div>

      <!-- Individual Color Pickers -->
      <div v-for="field in localFields" :key="field.key" class="color-field">
        <label class="color-label">{{ field.label }}</label>
        <div class="color-input-row">
          <div class="color-swatch" :style="{ background: field.value }"></div>
          <input
            type="color"
            :value="field.value"
            class="color-picker"
            @input="updateColor(field.key, $event.target.value)"
          />
          <input
            type="text"
            :value="field.value"
            class="color-hex"
            maxlength="7"
            @input="onHexInput(field.key, $event.target.value)"
          />
        </div>
      </div>

      <!--
        Readability, while the colour is still being chosen (IVY-1004).
        A palette that only fails on save is a palette people fight with.
      -->
      <div v-if="contrastChecks.length" class="contrast">
        <div class="contrast-head">{{ t('editSection.readability') }}</div>
        <div v-for="check in contrastChecks" :key="check.label" class="contrast-row">
          <span class="contrast-label">{{ check.label }}</span>
          <span class="contrast-ratio">{{ check.ratio }}:1</span>
          <StatusPill :tone="check.passes ? 'ok' : 'warn'"
                      :label="check.passes ? t('editSection.readabilityPass') : t('editSection.readabilityFail')" />
        </div>
        <p v-if="contrastChecks.some((c) => !c.passes)" class="contrast-hint">
          {{ t('editSection.readabilityHint') }}
        </p>
      </div>

      <button type="button" class="reset-btn" @click="resetDefaults">
        {{ t('editSection.resetDefaults') }}
      </button>
    </div>

    <template v-if="!liveEdit" #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        Cancel
      </ButtonMain>
      <ButtonMain variant="main" type="button" @click="onSave">
        Save
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/components/ui/BaseModal.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import StatusPill from '@/components/ui/StatusPill.vue';
import { checkContrast } from '@/composables/useBrandContrast';

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  fields: { type: Array, default: () => [] },
  presets: { type: Array, default: () => [] },
  liveEdit: { type: Boolean, default: false },
  /**
   * Which pairs to check for readability: [{ fg, bg }] by field key. Left
   * empty, the common pairs below are used, so callers get the check without
   * having to ask for it.
   */
  contrastPairs: { type: Array, default: () => [] },
});

/** Text-on-surface pairs as they are named across the invitation editors. */
const DEFAULT_PAIRS = [
  { fg: 'text', bg: 'rootBg' },
  { fg: 'text', bg: 'cardBg' },
  { fg: 'text', bg: 'sectionBg' },
  { fg: 'textColor', bg: 'bg' },
];

const emit = defineEmits(['close', 'save', 'change']);

const localFields = ref([]);
const activePresetIndex = ref(-1);

watch(() => props.open, (v) => {
  if (v) {
    localFields.value = props.fields.map(f => ({ ...f }));
    activePresetIndex.value = -1;
  }
}, { immediate: true });

/**
 * Only pairs where both colours exist in this modal are checked. A missing
 * colour is unknown, not fine — so it produces no row rather than a pass.
 */
const contrastChecks = computed(() => {
  const value = (key) => localFields.value.find((f) => f.key === key)?.value;
  const label = (key) => localFields.value.find((f) => f.key === key)?.label ?? key;

  const pairs = props.contrastPairs.length ? props.contrastPairs : DEFAULT_PAIRS;
  return pairs
    .map(({ fg, bg }) => {
      const result = checkContrast(value(fg), value(bg));
      if (result.ratio === null) return null;
      return { label: `${label(fg)} / ${label(bg)}`, ratio: result.ratio, passes: result.passes };
    })
    .filter(Boolean);
});

function presetSwatches(preset) {
  return Object.values(preset.colors);
}

function emitChange() {
  if (props.liveEdit) {
    const result = {};
    localFields.value.forEach(f => { result[f.key] = f.value; });
    emit('change', result);
  }
}

function applyPreset(preset, index) {
  activePresetIndex.value = index;
  for (const field of localFields.value) {
    if (preset.colors[field.key] !== undefined) {
      field.value = preset.colors[field.key];
    }
  }
  emitChange();
}

function updateColor(key, value) {
  const field = localFields.value.find(f => f.key === key);
  if (field) field.value = value;
  activePresetIndex.value = -1;
  emitChange();
}

function onHexInput(key, value) {
  if (/^#[0-9a-fA-F]{0,6}$/.test(value)) {
    updateColor(key, value);
  }
}

function resetDefaults() {
  localFields.value = props.fields.map(f => ({ ...f }));
  activePresetIndex.value = -1;
  emitChange();
}

function onSave() {
  const result = {};
  localFields.value.forEach(f => {
    result[f.key] = f.value;
  });
  emit('save', result);
}
</script>

<style scoped>
.colors-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Presets */
.presets-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.presets-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.preset-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px;
  border: 2px solid var(--line);
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
}

.preset-card:hover {
  border-color: var(--ink-4);
  transform: translateY(-1px);
}

.preset-card--active {
  border-color: var(--ink);
  box-shadow: 0 0 0 1px var(--ink);
}

.preset-swatches {
  display: flex;
  gap: 3px;
}

.preset-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.preset-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-3);
  text-align: center;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.presets-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0;
}

.presets-divider::before,
.presets-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line);
}

.presets-divider span {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* Color Fields */
.color-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--line);
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
  border: 1px solid var(--line-2);
  border-radius: 6px;
}

.color-hex {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  color: var(--ink);
  outline: none;
  transition: border-color 0.2s;
}

.color-hex:focus {
  border-color: var(--brand-main, var(--ink-3));
}

.reset-btn {
  margin-top: 8px;
  padding: 10px 16px;
  border: 1px solid var(--line-2);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: var(--ink-3);
  cursor: pointer;
  text-align: center;
  transition: background 0.2s, color 0.2s;
}

.reset-btn:hover {
  background: var(--sunken);
  color: var(--ink-2);
}

@media (max-width: 480px) {
  .presets-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ---- Readability check (IVY-1004) ---- */
.contrast {
  margin: 18px 0 4px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--sunken);
}
.contrast-head {
  font-family: var(--font-ui);
  font-size: 11px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--ink-3);
  margin-bottom: 8px;
}
.contrast-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--ink-2);
}
.contrast-label { flex: 1; }
.contrast-ratio { font-variant-numeric: tabular-nums; color: var(--ink); font-weight: 600; }
.contrast-hint {
  margin: 8px 0 0;
  font-family: var(--font-ui);
  font-size: 12.5px;
  color: var(--ink-2);
}
</style>

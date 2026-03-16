<template>
  <div class="section-advanced">
    <!-- Show/Hide Toggle -->
    <div class="adv-field adv-field--row">
      <label class="adv-label">{{ t('editSection.sectionVisible') }}</label>
      <button
        class="toggle"
        :class="{ 'toggle--on': localVisible }"
        @click="localVisible = !localVisible; emitUpdate()"
      >
        <span class="toggle-knob"></span>
      </button>
    </div>

    <!-- Anchor ID -->
    <div class="adv-field">
      <label class="adv-label">{{ t('editSection.anchorId') }}</label>
      <input
        type="text"
        class="adv-input"
        :value="localAnchorId"
        :placeholder="sectionKey + '-section'"
        @input="localAnchorId = $event.target.value; emitUpdate()"
      />
    </div>

    <!-- Animation -->
    <div class="adv-field">
      <label class="adv-label">{{ t('editSection.animation') }}</label>
      <div class="chip-row">
        <button
          v-for="a in ANIMATIONS"
          :key="a.key"
          class="chip"
          :class="{ 'chip--active': localAnimation === a.key }"
          @click="localAnimation = a.key; emitUpdate()"
        >{{ a.label }}</button>
      </div>
    </div>

    <!-- Theme Override -->
    <div v-if="showOverrides" class="adv-field">
      <div class="adv-field--row" style="margin-bottom:8px;">
        <label class="adv-label">{{ t('editSection.overrideTheme') }}</label>
        <button
          class="toggle"
          :class="{ 'toggle--on': overrideEnabled }"
          @click="overrideEnabled = !overrideEnabled; if (!overrideEnabled) clearOverrides(); emitUpdate()"
        >
          <span class="toggle-knob"></span>
        </button>
      </div>

      <div v-if="overrideEnabled" class="override-fields">
        <!-- Background Color -->
        <div class="color-field">
          <label class="adv-label-sm">{{ t('editSection.sectionBg') }}</label>
          <div class="color-input-row">
            <div class="color-swatch" :style="{ background: localOverrides.bg || '#f9fafb' }"></div>
            <input type="color" :value="localOverrides.bg || '#f9fafb'" class="color-picker" @input="localOverrides.bg = $event.target.value; emitUpdate()" />
            <input type="text" :value="localOverrides.bg || '#f9fafb'" class="color-hex" maxlength="7" @input="onHex('bg', $event)" />
          </div>
        </div>

        <!-- Text Color -->
        <div class="color-field">
          <label class="adv-label-sm">{{ t('editSection.textColor') }}</label>
          <div class="color-input-row">
            <div class="color-swatch" :style="{ background: localOverrides.textColor || '#1f2937' }"></div>
            <input type="color" :value="localOverrides.textColor || '#1f2937'" class="color-picker" @input="localOverrides.textColor = $event.target.value; emitUpdate()" />
            <input type="text" :value="localOverrides.textColor || '#1f2937'" class="color-hex" maxlength="7" @input="onHex('textColor', $event)" />
          </div>
        </div>

        <!-- Card Radius -->
        <div class="adv-field">
          <label class="adv-label-sm">{{ t('editSection.cardRadius') }}</label>
          <div class="chip-row">
            <button
              v-for="r in RADIUS_OPTIONS"
              :key="r"
              class="chip chip--sm"
              :class="{ 'chip--active': localOverrides.cardRadius === r }"
              @click="localOverrides.cardRadius = r; emitUpdate()"
            >{{ r }}</button>
          </div>
        </div>

        <!-- Card Shadow -->
        <div class="adv-field">
          <label class="adv-label-sm">{{ t('editSection.cardShadow') }}</label>
          <div class="chip-row">
            <button
              v-for="s in SHADOW_OPTIONS"
              :key="s"
              class="chip chip--sm"
              :class="{ 'chip--active': localOverrides.cardShadow === s }"
              @click="localOverrides.cardShadow = s; emitUpdate()"
            >{{ s }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const ANIMATIONS = [
  { key: 'none', label: '' },
  { key: 'fadeIn', label: '' },
  { key: 'slideUp', label: '' },
];
ANIMATIONS[0].label = t('editSection.animationNone');
ANIMATIONS[1].label = t('editSection.animationFade');
ANIMATIONS[2].label = t('editSection.animationSlide');

const RADIUS_OPTIONS = ['0px', '8px', '16px', '24px', '32px'];
const SHADOW_OPTIONS = ['none', 'subtle', 'medium', 'strong'];

const props = defineProps({
  sectionKey: { type: String, required: true },
  visible: { type: Boolean, default: true },
  anchorId: { type: String, default: '' },
  animation: { type: String, default: 'none' },
  overrides: { type: Object, default: null },
  showOverrides: { type: Boolean, default: true },
});

const emit = defineEmits(['update']);

const localVisible = ref(props.visible);
const localAnchorId = ref(props.anchorId);
const localAnimation = ref(props.animation);
const overrideEnabled = ref(!!props.overrides);
const localOverrides = reactive({
  bg: props.overrides?.bg || '',
  textColor: props.overrides?.textColor || '',
  cardRadius: props.overrides?.cardRadius || '',
  cardShadow: props.overrides?.cardShadow || '',
});

// Sync when props change (e.g. section switch)
watch(() => [props.visible, props.anchorId, props.animation, props.overrides], () => {
  localVisible.value = props.visible;
  localAnchorId.value = props.anchorId;
  localAnimation.value = props.animation;
  overrideEnabled.value = !!props.overrides;
  if (props.overrides) {
    Object.assign(localOverrides, props.overrides);
  }
});

function clearOverrides() {
  localOverrides.bg = '';
  localOverrides.textColor = '';
  localOverrides.cardRadius = '';
  localOverrides.cardShadow = '';
}

function onHex(field, e) {
  const val = e.target.value;
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    localOverrides[field] = val;
    emitUpdate();
  }
}

function emitUpdate() {
  emit('update', {
    visible: localVisible.value,
    anchorId: localAnchorId.value,
    animation: localAnimation.value,
    overrides: overrideEnabled.value ? { ...localOverrides } : null,
  });
}
</script>

<style scoped>
.section-advanced {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.adv-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.adv-field--row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.adv-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.adv-label-sm {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.adv-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 13px;
  font-family: monospace;
  color: #1f2937;
}

.adv-input:focus {
  outline: none;
  border-color: #6b7280;
}

/* Chips */
.chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.15s;
  font-family: inherit;
}

.chip--sm {
  padding: 4px 10px;
  font-size: 12px;
}

.chip:hover {
  border-color: #9ca3af;
}

.chip--active {
  border-color: #1f2937;
  background: #f3f4f6;
  font-weight: 600;
}

/* Toggle */
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: #d1d5db;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle--on {
  background: #059669;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle--on .toggle-knob {
  transform: translateX(20px);
}

/* Override fields */
.override-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

/* Color fields */
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
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.color-picker {
  width: 32px;
  height: 28px;
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
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-family: monospace;
  color: #1f2937;
}

.color-hex:focus {
  outline: none;
  border-color: #6b7280;
}
</style>

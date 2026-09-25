<template>
  <div class="se-models" role="radiogroup" :aria-label="t('agencySite.editor.tabs.model')">
    <button
      v-for="(model, i) in MODELS"
      :key="model"
      type="button"
      role="radio"
      class="se-model"
      :class="{ on: model === modelValue }"
      :aria-checked="model === modelValue"
      :disabled="busy"
      @click="$emit('update:modelValue', model)"
    >
      <span class="se-swatch" :class="`se-swatch-${model.toLowerCase()}`" aria-hidden="true"></span>
      <strong>{{ String(i + 1).padStart(2, '0') }} {{ t(`agencySite.models.${model}.name`) }}</strong>
      <small>{{ t(`agencySite.models.${model}.hint`) }}</small>
      <span class="se-desc">{{ t(`agencySite.models.${model}.description`) }}</span>
    </button>
  </div>
</template>

<script setup>
/** The four layouts, as the design's switcher names them. Picking one saves it. */
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: String, default: 'CLASSIC' },
  busy: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const MODELS = ['CLASSIC', 'PORTFOLIO', 'EDITORIAL', 'CORPORATE']

const { t } = useI18n()
</script>

<style scoped>
.se-models {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.se-model {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  text-align: left;
  cursor: pointer;
}

.se-model.on {
  border-color: var(--ivy);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--ivy) 25%, transparent);
}

.se-model small,
.se-desc {
  color: var(--ink-3);
  font-size: 12.5px;
}

.se-swatch {
  height: 56px;
  border-radius: 8px;
  margin-bottom: 6px;
}

.se-swatch-classic { background: linear-gradient(90deg, #faf9f4 50%, #1f3d2b 50%); }
.se-swatch-portfolio { background: linear-gradient(90deg, #171c18 60%, #ead0a3 60%); }
.se-swatch-editorial { background: linear-gradient(90deg, #f5ede1 50%, #664d3c 50%); }
.se-swatch-corporate { background: linear-gradient(90deg, #f6f8f4 55%, #1a4841 55%); }
</style>

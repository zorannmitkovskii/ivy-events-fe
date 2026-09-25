<template>
  <!-- The eyebrow / heading / paragraph most microsite sections open with. -->
  <div class="grid2 intro-fields">
    <label class="field"><span>{{ t('vendorMicrosite.editor.eyebrow') }}</span>
      <input :value="modelValue.eyebrow ?? ''" :maxlength="limits.short" @input="update('eyebrow', $event.target.value)" /></label>
    <label class="field"><span>{{ t('vendorMicrosite.editor.heading') }}</span>
      <input :value="modelValue.title ?? ''" :maxlength="limits.title" @input="update('title', $event.target.value)" /></label>
    <label v-if="!noText" class="field wide"><span>{{ t('vendorMicrosite.editor.text') }}</span>
      <textarea :value="modelValue.text ?? ''" :maxlength="limits.text" rows="2" @input="update('text', $event.target.value)"></textarea></label>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  limits: { type: Object, required: true },
  /** A heading without a paragraph — the process and the FAQ open with none. */
  noText: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const update = (key, value) => emit('update:modelValue', { ...props.modelValue, [key]: value })
</script>

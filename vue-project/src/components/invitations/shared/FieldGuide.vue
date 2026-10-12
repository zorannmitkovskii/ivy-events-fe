<template>
  <!--
    INV-401: a short guide under a field — whether it is required, what the
    guests will see, and an example. The example is static text, never a value
    of the field: it is marked "Example:" in words (not only by its look),
    sits in its own dashed, italic box, and is linked to the field through
    aria-describedby, so a screen reader reads it as a description, not as
    something already typed. The field keeps its own visible label.
  -->
  <div :id="id" class="field-guide" data-testid="field-guide">
    <p class="field-guide__meta">
      <span
        class="field-guide__req"
        :class="required ? 'field-guide__req--required' : 'field-guide__req--optional'"
        data-testid="field-guide-req"
      >{{ requirementText }}</span>
      <span v-if="guests" class="field-guide__guests">{{ guests }}</span>
    </p>
    <p v-if="example" class="field-guide__example" data-testid="field-guide-example">
      <span class="field-guide__example-label">{{ exampleLabel || t('editSection.guide.exampleLabel') }}</span>
      <q class="field-guide__example-text">{{ example }}</q>
    </p>
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  // The id the field points at with aria-describedby.
  id: { type: String, required: true },
  required: { type: Boolean, default: false },
  // The guide is about a whole section (programme, story), not one field.
  section: { type: Boolean, default: false },
  // What the guests see from this field.
  guests: { type: String, default: '' },
  example: { type: String, default: '' },
  exampleLabel: { type: String, default: '' },
});

const requirementText = computed(() => {
  if (props.required) return t('editSection.guide.required');
  return props.section ? t('editSection.guide.optionalSection') : t('editSection.guide.optional');
});
</script>

<style scoped>
.field-guide {
  display: grid;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--neutral-600, var(--ink-3));
}

.field-guide__meta {
  margin: 0;
}

.field-guide__req {
  display: inline-block;
  margin-right: 6px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid currentColor;
}

.field-guide__req--required {
  color: #8a1c13;
}

.field-guide__req--optional {
  color: var(--neutral-600, var(--ink-3));
}

/* An example is not input: dashed box, italic, its own label in words. */
.field-guide__example {
  margin: 0;
  padding: 6px 8px;
  border: 1px dashed var(--neutral-300, var(--line-2));
  border-radius: 8px;
  background: var(--neutral-50, var(--sunken));
  font-style: italic;
}

.field-guide__example-label {
  font-style: normal;
  font-weight: 700;
  margin-right: 4px;
}
</style>

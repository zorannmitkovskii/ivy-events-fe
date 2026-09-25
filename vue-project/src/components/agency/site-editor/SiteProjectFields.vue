<template>
  <div class="se-fields">
    <label class="se-field">
      <span>{{ t('agencySite.editor.fields.projectTitle') }} *</span>
      <input v-model="project.title" maxlength="120" required />
    </label>
    <label class="se-field">
      <span>{{ t('agencySite.editor.fields.eventType') }}</span>
      <input v-model="project.eventType" maxlength="60" />
    </label>
    <label class="se-field">
      <span>{{ t('agencySite.editor.fields.city') }}</span>
      <input v-model="project.city" maxlength="120" />
    </label>
    <label class="se-field se-check">
      <input v-model="project.published" type="checkbox" />
      <span>{{ t('agencySite.editor.fields.publishedProject') }}</span>
    </label>
    <label class="se-field wide">
      <span>{{ t('agencySite.editor.fields.description') }}</span>
      <textarea v-model="project.description" rows="3" maxlength="600"></textarea>
    </label>
  </div>
</template>

<script setup>
/** A project's words: title, kind, place, description — and whether it is shown. */
import { useI18n } from 'vue-i18n'

const project = defineModel({ type: Object, required: true })

const { t } = useI18n()
</script>

<style scoped>
.se-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.se-field.wide {
  grid-column: 1 / -1;
}

.se-field span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12.5px;
  font-weight: 600;
}

.se-field input:not([type='checkbox']),
.se-field textarea {
  width: 100%;
  min-height: 36px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  font: inherit;
  font-size: 14px;
}

.se-check {
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: end;
}

.se-check span {
  margin: 0;
}

@media (max-width: 640px) {
  .se-fields {
    grid-template-columns: 1fr;
  }
}
</style>

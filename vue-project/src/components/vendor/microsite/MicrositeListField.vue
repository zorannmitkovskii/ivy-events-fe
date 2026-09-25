<template>
  <!-- One repeatable list in the content editor: rows of fields, in order. -->
  <div class="list-field">
    <ol class="rows">
      <li v-for="(row, index) in modelValue" :key="index" class="row">
        <div class="row-fields">
          <label v-for="field in fields" :key="field.key" class="field" :class="{ wide: field.type === 'textarea' }">
            <span>{{ field.label }}</span>
            <textarea
              v-if="field.type === 'textarea'"
              :value="row[field.key] ?? ''"
              :maxlength="field.max"
              rows="3"
              @input="set(index, field.key, $event.target.value)"
            ></textarea>
            <select
              v-else-if="field.type === 'media'"
              :value="row[field.key] ?? ''"
              @change="set(index, field.key, $event.target.value || null)"
            >
              <option value="">{{ t('vendorMicrosite.editor.noPicture') }}</option>
              <option v-for="(item, n) in media" :key="item.id" :value="item.id">{{ item.title || `#${n + 1}` }}</option>
            </select>
            <input
              v-else
              :value="row[field.key] ?? ''"
              :maxlength="field.max"
              @input="set(index, field.key, $event.target.value)"
            />
          </label>
        </div>
        <div class="row-actions">
          <button type="button" :disabled="index === 0" :aria-label="t('vendorMicrosite.editor.up')" @click="move(index, -1)">↑</button>
          <button type="button" :disabled="index === modelValue.length - 1" :aria-label="t('vendorMicrosite.editor.down')" @click="move(index, 1)">↓</button>
          <button type="button" class="remove" :aria-label="t('vendorMicrosite.editor.remove')" @click="remove(index)">✕</button>
        </div>
      </li>
    </ol>
    <button v-if="modelValue.length < max" type="button" class="add" @click="add">+ {{ addLabel }}</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  /** [{ key, label, type: 'text' | 'textarea' | 'media', max }] */
  fields: { type: Array, required: true },
  max: { type: Number, required: true },
  addLabel: { type: String, required: true },
  /** Portfolio pictures, for a `media` field. */
  media: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const emitRows = (rows) => emit('update:modelValue', rows)

function set(index, key, value) {
  emitRows(props.modelValue.map((row, n) => (n === index ? { ...row, [key]: value } : row)))
}

function move(index, step) {
  const rows = [...props.modelValue]
  const [row] = rows.splice(index, 1)
  rows.splice(index + step, 0, row)
  emitRows(rows)
}

function remove(index) {
  emitRows(props.modelValue.filter((_, n) => n !== index))
}

function add() {
  emitRows([...props.modelValue, Object.fromEntries(props.fields.map((field) => [field.key, null]))])
}
</script>

<style scoped>
.rows { list-style: none; margin: 0 0 10px; padding: 0; display: grid; gap: 10px; }
.row { display: flex; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--card); }
.row-fields { flex: 1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.field > span { display: block; margin-bottom: 4px; color: var(--ink-3); font-size: 12px; font-weight: 600; }
.field.wide { grid-column: 1 / -1; }
.field input, .field select, .field textarea {
  width: 100%; min-height: 36px; padding: 7px 9px;
  border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); font: inherit; font-size: 13.5px;
}
.row-actions { display: flex; flex-direction: column; gap: 4px; }
.row-actions button { width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 7px; background: var(--card); color: var(--ink-3); }
.row-actions button:disabled { opacity: .4; }
.row-actions .remove { color: var(--rose-ink); }
.add { border: 1px dashed var(--line); border-radius: 8px; padding: 8px 12px; background: none; color: var(--ivy); font-size: 13px; font-weight: 600; }
@media (max-width: 700px) { .row-fields { grid-template-columns: 1fr; } }
</style>

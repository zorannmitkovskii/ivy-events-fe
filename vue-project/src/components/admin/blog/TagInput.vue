<template>
  <div>
    <div class="tag-input" @click="focus">
      <span v-for="tag in model" :key="tag" class="chip tag">
        {{ tag }}
        <button type="button" :aria-label="t('adminBlog.tags.remove', { tag })" @click.stop="remove(tag)">×</button>
      </span>
      <input
        :id="inputId"
        ref="input"
        v-model="draft"
        :list="suggestionsId"
        :placeholder="model.length ? '' : t('adminBlog.tags.placeholder')"
        :disabled="model.length >= MAX_TAGS"
        @keydown="onKeydown"
        @blur="commit"
      />
      <datalist :id="suggestionsId">
        <option v-for="suggestion in availableSuggestions" :key="suggestion" :value="suggestion" />
      </datalist>
    </div>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    <p v-else class="hint">{{ t('adminBlog.tags.hint', { max: MAX_TAGS }) }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MAX_TAGS, addTags } from '@/utils/blogTags'

/**
 * A post's tags as chips (IVY-906).
 *
 * Enter or a comma adds what was typed, Backspace in an empty field takes the
 * last chip back. The text is normalized as it becomes a chip, so what the
 * editor sees is what will be saved.
 */
const model = defineModel({ type: Array, default: () => [] })

const props = defineProps({
  inputId: { type: String, required: true },
  /** Tags other posts already use, offered while typing so one topic is not spelled three ways. */
  suggestions: { type: Array, default: () => [] },
})

const { t } = useI18n()

const draft = ref('')
const error = ref('')
const input = ref(null)

const suggestionsId = computed(() => `${props.inputId}-suggestions`)
const availableSuggestions = computed(() => props.suggestions.filter((tag) => !model.value.includes(tag)))

function commit() {
  if (!draft.value.trim()) return
  const result = addTags(model.value, draft.value)
  model.value = result.tags
  if (result.error) {
    error.value = t(`adminBlog.tags.${result.error.key}`, { max: result.error.max })
    return
  }
  error.value = ''
  draft.value = ''
}

function onKeydown(event) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    commit()
    return
  }
  if (event.key === 'Backspace' && !draft.value && model.value.length) {
    model.value = model.value.slice(0, -1)
  }
}

function remove(tag) {
  model.value = model.value.filter((existing) => existing !== tag)
  error.value = ''
}

function focus() {
  input.value?.focus()
}
</script>

<style scoped>
.tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  cursor: text;
}

.tag-input:focus-within {
  border-color: var(--ivy);
}

.tag-input input {
  flex: 1;
  min-width: 120px;
  border: 0;
  padding: 4px;
  background: transparent;
  box-shadow: none;
}

.chip.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.chip.tag button {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 15px;
  line-height: 1;
  padding: 0 2px;
}

.hint,
.field-error {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}

.field-error {
  color: var(--danger, #b3261e);
}
</style>

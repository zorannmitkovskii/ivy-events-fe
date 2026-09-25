<template>
  <div class="se-tags">
    <p class="se-hint">{{ t('agencySite.editor.tagsHint', { max: MAX_TAGS }) }}</p>

    <p v-if="loadError" class="se-error" role="alert">{{ t('agencySite.editor.tagsUnavailable') }}</p>
    <p v-else-if="!catalog.length" class="se-hint">{{ t('agencySite.editor.noTags') }}</p>

    <div class="se-chips">
      <button
        v-for="tag in catalog"
        :key="tag.slug"
        type="button"
        class="se-chip"
        :class="{ on: selected.includes(tag.slug) }"
        :aria-pressed="selected.includes(tag.slug)"
        :disabled="!selected.includes(tag.slug) && selected.length >= MAX_TAGS"
        @click="toggle(tag.slug)"
      >{{ tag.name }}</button>
    </div>

    <div class="se-actions">
      <span class="se-count">{{ selected.length }} / {{ MAX_TAGS }}</span>
      <button type="button" class="btn btn-primary btn-sm" :disabled="busy" @click="$emit('save', selected)">
        {{ t('agencySite.editor.saveTags') }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * The agency's topics, picked from the shared list the editors keep.
 *
 * <p>Pick, never type: a tag an agency invented would connect it to nothing,
 * and the point of a tag is that a blog post and a vendor carry the same one.
 */
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { agencySiteService } from '@/services/agencySite.service'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  busy: { type: Boolean, default: false },
})
defineEmits(['save'])

/** The server's limit. */
const MAX_TAGS = 8

const { t, locale } = useI18n()
const catalog = ref([])
const loadError = ref(false)
const selected = ref([...props.modelValue])

watch(() => props.modelValue, (value) => { selected.value = [...value] })

function toggle(slug) {
  selected.value = selected.value.includes(slug)
    ? selected.value.filter((s) => s !== slug)
    : [...selected.value, slug]
}

onMounted(async () => {
  try {
    const tags = await agencySiteService.tagCatalog(locale.value)
    catalog.value = Array.isArray(tags) ? tags : []
  } catch {
    loadError.value = true
  }
})
</script>

<style scoped>
.se-hint {
  margin: 0 0 12px;
  color: var(--ink-3);
  font-size: 13px;
}

.se-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.se-chip {
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  font-size: 13px;
  cursor: pointer;
}

.se-chip.on {
  border-color: var(--ivy);
  background: var(--ivy);
  color: #fff;
}

.se-chip:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.se-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 14px;
}

.se-count {
  color: var(--ink-3);
  font-size: 12.5px;
}

.se-error {
  color: var(--red, #a33a2b);
  font-size: 12.5px;
}
</style>

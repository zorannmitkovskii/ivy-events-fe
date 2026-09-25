<template>
  <div class="tag-picker">
    <p class="help">{{ t('tags.picker.help', { max: MAX_TAGS }) }}</p>

    <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <p v-else-if="!catalog.length" class="help">{{ t('tags.picker.none') }}</p>

    <ul v-else class="chips" :aria-label="t('tags.label')">
      <li v-for="tag in catalog" :key="tag.slug">
        <button
          type="button"
          :class="{ on: isPicked(tag.slug) }"
          :aria-pressed="isPicked(tag.slug)"
          :disabled="!isPicked(tag.slug) && full"
          @click="toggle(tag.slug)"
        >#{{ tag.name }}</button>
      </li>
    </ul>

    <p class="count">{{ t('tags.picker.count', { n: modelValue.length, max: MAX_TAGS }) }}</p>
  </div>
</template>

<script setup>
/**
 * The shared tags a vendor files themselves under.
 *
 * <p>Picked, never typed: the list is the admin's, so two vendors describing
 * the same thing end up under the same tag and a reader can find both. The
 * parent owns the picked slugs (v-model) and saves them with the profile.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { tagsService } from '@/services/tags.service'
import { getErrorMessage } from '@/services/apiError'

/** Mirrors `TagLinkService.MAX_VENDOR_TAGS`; the server still decides. */
const MAX_TAGS = 8

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

const catalog = ref([])
const loadError = ref('')

const full = computed(() => props.modelValue.length >= MAX_TAGS)

const isPicked = (slug) => props.modelValue.includes(slug)

function toggle(slug) {
  if (isPicked(slug)) {
    emit('update:modelValue', props.modelValue.filter((picked) => picked !== slug))
  } else if (!full.value) {
    emit('update:modelValue', [...props.modelValue, slug])
  }
}

onMounted(async () => {
  try {
    const response = await tagsService.catalog(locale.value)
    catalog.value = response?.data ?? response ?? []
  } catch (failure) {
    loadError.value = getErrorMessage(failure)
  }
})
</script>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0;
  padding: 0;
  list-style: none;
}

.chips button {
  padding: 5px 12px;
  border: 1px solid var(--line-2, #ddd8cf);
  border-radius: 999px;
  background: var(--surface, #fff);
  color: var(--ink-2, #4a4a4a);
  font-size: 13px;
  cursor: pointer;
}

.chips button.on {
  border-color: var(--brand, #1f3d2b);
  background: var(--brand, #1f3d2b);
  color: var(--surface, #fff);
}

.chips button:disabled {
  opacity: 0.45;
  cursor: default;
}

.help,
.count {
  margin: 0;
  font-size: 12.5px;
  color: var(--ink-3, #6b6b6b);
}

.error {
  color: var(--danger, #b3261e);
  font-size: 13px;
}
</style>

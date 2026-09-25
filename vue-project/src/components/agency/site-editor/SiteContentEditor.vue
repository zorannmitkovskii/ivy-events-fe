<template>
  <div class="se-content">
    <p class="se-hint">{{ t('agencySite.editor.contentHint') }}</p>

    <details v-for="section in visibleSections" :key="section.key" class="se-section" :open="section.key === 'hero'">
      <summary>{{ t(`agencySite.editor.sections.${section.key}`) }}</summary>

      <!-- Hero -->
      <div v-if="section.key === 'hero'" class="se-fields">
        <label v-for="field in HERO_FIELDS" :key="field" class="se-field" :class="{ wide: LONG.has(field) }">
          <span>{{ t(`agencySite.editor.fields.${field}`) }}</span>
          <textarea v-if="LONG.has(field)" v-model="hero[field]" rows="3" :maxlength="MAX_TEXT"></textarea>
          <input v-else v-model="hero[field]" :maxlength="field === 'title' || field === 'titleAccent' ? MAX_TITLE : MAX_LABEL" />
        </label>
        <SiteImageField
          class="se-field wide"
          :label="t('agencySite.editor.fields.image')"
          :url="imageUrls[hero.imageKey]"
          @uploaded="(image) => setImage(hero, image)"
          @clear="hero.imageKey = null"
        />
      </div>

      <!-- The band / filmstrip / stripe -->
      <div v-else-if="section.key === 'keywords'" class="se-fields">
        <label class="se-field wide">
          <span>{{ t('agencySite.editor.fields.keywords') }}</span>
          <input :value="(content.keywords || []).join(', ')" @change="setKeywords($event.target.value)" />
          <small>{{ t('agencySite.editor.keywordsHint', { max: MAX_KEYWORDS }) }}</small>
        </label>
      </div>

      <template v-else>
        <div v-if="section.block" class="se-fields">
          <label v-for="field in BLOCK_FIELDS" :key="field" class="se-field" :class="{ wide: field === 'text' }">
            <span>{{ t(`agencySite.editor.fields.${field}`) }}</span>
            <textarea v-if="field === 'text'" v-model="block(section.block)[field]" rows="2" :maxlength="MAX_TEXT"></textarea>
            <input v-else v-model="block(section.block)[field]" :maxlength="field === 'title' ? MAX_TITLE : MAX_LABEL" />
          </label>
        </div>

        <div v-if="section.list" class="se-items">
          <div v-for="(item, i) in list(section.list)" :key="i" class="se-item">
            <div class="se-item-head">
              <b>{{ String(i + 1).padStart(2, '0') }}</b>
              <button type="button" class="btn btn-ghost btn-sm" @click="removeItem(section.list, i)">{{ t('agencySite.editor.remove') }}</button>
            </div>
            <div class="se-fields">
              <template v-for="field in section.fields" :key="field">
                <SiteImageField
                  v-if="field === 'imageKey'"
                  class="se-field wide"
                  :label="t('agencySite.editor.fields.image')"
                  :url="imageUrls[item.imageKey]"
                  @uploaded="(image) => setImage(item, image)"
                  @clear="item.imageKey = null"
                />
                <label v-else class="se-field" :class="{ wide: LONG.has(field) }">
                  <span>{{ t(`agencySite.editor.fields.${field}`) }}</span>
                  <textarea v-if="LONG.has(field)" v-model="item[field]" rows="2" :maxlength="MAX_TEXT"></textarea>
                  <input v-else v-model="item[field]" :maxlength="field === 'symbol' ? MAX_SYMBOL : MAX_TITLE" />
                </label>
              </template>
            </div>
          </div>
          <button
            v-if="list(section.list).length < section.max"
            type="button"
            class="btn btn-ghost btn-sm"
            @click="addItem(section)"
          >+ {{ t('agencySite.editor.addItem') }}</button>
        </div>
      </template>
    </details>

    <div class="se-actions">
      <button type="button" class="btn btn-primary btn-sm" :disabled="busy" @click="$emit('save')">
        {{ busy ? t('agencySite.editor.saving') : t('agencySite.editor.saveContent') }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * The copy of every section the chosen layout draws.
 *
 * <p>Sections another layout uses are hidden here, not deleted: the content
 * is one document, so switching back to that layout finds them intact.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SiteImageField from './SiteImageField.vue'

const props = defineProps({
  model: { type: String, default: 'CLASSIC' },
  busy: { type: Boolean, default: false },
})
defineEmits(['save'])

/** The content document, edited in place. */
const content = defineModel('content', { type: Object, required: true })
/** Key → address, for showing uploaded photos before the next save. */
const imageUrls = defineModel('imageUrls', { type: Object, default: () => ({}) })

/* Mirrors AgencySiteContentRules on the server; it refuses anything longer. */
const MAX_LABEL = 60
const MAX_TITLE = 140
const MAX_TEXT = 600
const MAX_SYMBOL = 4
const MAX_KEYWORDS = 6

const ALL = ['CLASSIC', 'PORTFOLIO', 'EDITORIAL', 'CORPORATE']
const HERO_FIELDS = ['eyebrow', 'title', 'titleAccent', 'text', 'ctaLabel', 'secondaryLabel', 'caption', 'captionNote']
const BLOCK_FIELDS = ['eyebrow', 'title', 'text']
const LONG = new Set(['text', 'description'])

/** Which layout draws which section — the designs, read section by section. */
const SECTIONS = [
  { key: 'hero', models: ALL },
  { key: 'keywords', models: ['CLASSIC', 'PORTFOLIO', 'CORPORATE'] },
  { key: 'services', block: 'services', list: 'serviceItems', fields: ['label', 'symbol', 'name', 'description'], max: 6, models: ALL },
  { key: 'projects', block: 'projects', models: ['CLASSIC', 'PORTFOLIO'] },
  { key: 'statement', block: 'statement', models: ['EDITORIAL'] },
  { key: 'chapters', list: 'chapters', fields: ['eyebrow', 'title', 'text', 'imageKey'], max: 4, models: ['EDITORIAL'] },
  { key: 'process', block: 'process', list: 'steps', fields: ['title', 'description'], max: 6, models: ['CLASSIC', 'EDITORIAL', 'CORPORATE'] },
  { key: 'formats', block: 'formats', list: 'formatItems', fields: ['title', 'description', 'imageKey'], max: 6, models: ['CORPORATE'] },
  { key: 'contact', block: 'contact', models: ALL },
]

const { t } = useI18n()

const visibleSections = computed(() => SECTIONS.filter((section) => section.models.includes(props.model)))

// The page hands over a normalized document (normalizeContent): every block an
// object, every list an array, so nothing here has to create one mid-render.
const hero = computed(() => content.value.hero)

function block(key) {
  return content.value[key]
}

function list(key) {
  return content.value[key]
}

function addItem(section) {
  list(section.list).push(Object.fromEntries(section.fields.map((field) => [field, null])))
}

function removeItem(key, index) {
  list(key).splice(index, 1)
}

function setKeywords(raw) {
  content.value.keywords = raw.split(',').map((word) => word.trim()).filter(Boolean).slice(0, MAX_KEYWORDS)
}

function setImage(target, image) {
  target.imageKey = image.key
  imageUrls.value = { ...imageUrls.value, [image.key]: image.url }
}
</script>

<style scoped>
.se-hint {
  margin: 0 0 12px;
  color: var(--ink-3);
  font-size: 13px;
}

.se-section {
  border: 1px solid var(--line);
  border-radius: 10px;
  margin-bottom: 10px;
  background: var(--card);
}

.se-section summary {
  padding: 11px 14px;
  font-weight: 700;
  cursor: pointer;
}

.se-section[open] summary {
  border-bottom: 1px solid var(--line);
}

.se-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  padding: 12px 14px;
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

.se-field input,
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

.se-field small {
  color: var(--ink-3);
  font-size: 12px;
}

.se-items {
  padding: 0 14px 12px;
}

.se-item {
  border: 1px dashed var(--line);
  border-radius: 8px;
  margin-bottom: 10px;
}

.se-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 0;
}

.se-item .se-fields {
  padding: 8px 12px 12px;
}

.se-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

@media (max-width: 640px) {
  .se-fields {
    grid-template-columns: 1fr;
  }
}
</style>

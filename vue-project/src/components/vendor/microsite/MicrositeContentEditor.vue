<template>
  <!--
    The microsite's own wording, section by section, for the model the vendor
    chose. Only that model's sections are shown: a scene has chapters and no
    quote, a gallery has captions and no FAQ. Anything left empty comes from
    the profile or the page's default, which the hint under each section says.
  -->
  <form class="content-editor" @submit.prevent="save">
    <p class="help">{{ t('vendorMicrosite.editor.intro') }}</p>

    <fieldset class="block">
      <legend>{{ t('vendorMicrosite.editor.section.hero') }}</legend>
      <div class="grid2">
        <label class="field"><span>{{ t('vendorMicrosite.editor.eyebrow') }}</span>
          <input v-model="draft.hero.eyebrow" :maxlength="LIMITS.short" /></label>
        <label class="field"><span>{{ t('vendorMicrosite.editor.ctaLabel') }}</span>
          <input v-model="draft.hero.ctaLabel" :maxlength="LIMITS.short" /></label>
        <label class="field"><span>{{ t('vendorMicrosite.editor.title') }}</span>
          <input v-model="draft.hero.title" :maxlength="LIMITS.title" :placeholder="vendorName" /></label>
        <label class="field"><span>{{ t('vendorMicrosite.editor.titleAccent') }}</span>
          <input v-model="draft.hero.titleAccent" :maxlength="LIMITS.short" /></label>
        <label class="field wide"><span>{{ t('vendorMicrosite.editor.text') }}</span>
          <textarea v-model="draft.hero.text" :maxlength="LIMITS.text" rows="3"></textarea></label>
        <template v-if="model === 'classic'">
          <label class="field"><span>{{ t('vendorMicrosite.editor.secondaryLabel') }}</span>
            <input v-model="draft.hero.secondaryLabel" :maxlength="LIMITS.short" /></label>
          <label class="field"><span>{{ t('vendorMicrosite.editor.caption') }}</span>
            <input v-model="draft.hero.caption" :maxlength="LIMITS.short" /></label>
          <label class="field"><span>{{ t('vendorMicrosite.editor.captionNote') }}</span>
            <input v-model="draft.hero.captionNote" :maxlength="LIMITS.short" /></label>
        </template>
        <label v-if="model !== 'textual'" class="field"><span>{{ t('vendorMicrosite.editor.heroPicture') }}</span>
          <select v-model="draft.hero.mediaId">
            <option :value="null">{{ t('vendorMicrosite.editor.coverPicture') }}</option>
            <option v-for="(item, n) in images" :key="item.id" :value="item.id">{{ item.title || `#${n + 1}` }}</option>
          </select></label>
      </div>
    </fieldset>

    <fieldset v-if="has('eventTypes')" class="block">
      <legend>{{ t('vendorMicrosite.editor.section.eventTypes') }}</legend>
      <MicrositeListField
        v-model="eventTypeRows"
        :fields="[{ key: 'value', label: t('vendorMicrosite.editor.eventType'), max: LIMITS.short }]"
        :max="LIMITS.eventTypes"
        :add-label="t('vendorMicrosite.editor.add')"
      />
    </fieldset>

    <fieldset v-if="has('approach')" class="block">
      <legend>{{ t(`vendorMicrosite.editor.section.${model === 'scene' ? 'intro' : 'approach'}`) }}</legend>
      <IntroFields v-model="draft.approach" :limits="LIMITS" />
    </fieldset>

    <fieldset v-if="has('services')" class="block">
      <legend>{{ t('vendorMicrosite.editor.section.services') }}</legend>
      <IntroFields v-model="draft.servicesIntro" :limits="LIMITS" />
      <p class="hint">{{ t('vendorMicrosite.editor.servicesHint') }}</p>
      <MicrositeListField
        v-model="draft.services"
        :fields="serviceFields"
        :max="LIMITS.services"
        :add-label="t('vendorMicrosite.editor.add')"
      />
    </fieldset>

    <fieldset v-if="has('gallery')" class="block">
      <legend>{{ t('vendorMicrosite.editor.section.gallery') }}</legend>
      <IntroFields v-if="model !== 'textual'" v-model="draft.galleryIntro" :limits="LIMITS" />
      <p class="hint">{{ t('vendorMicrosite.editor.galleryHint', { n: model === 'textual' ? 2 : LIMITS.gallery }) }}</p>
      <ul class="picker">
        <li v-for="(item, n) in images" :key="item.id">
          <button
            type="button"
            class="thumb"
            :class="{ on: chosen(item.id) }"
            :aria-pressed="chosen(item.id)"
            :aria-label="item.title || `#${n + 1}`"
            @click="toggle(item.id)"
          ><img :src="item.thumbnailUrl || item.url" alt="" loading="lazy" /></button>
        </li>
      </ul>
      <p v-if="!images.length" class="hint">{{ t('vendorMicrosite.editor.noPortfolio') }}</p>
      <MicrositeListField
        v-if="draft.gallery.length"
        v-model="draft.gallery"
        :fields="[{ key: 'mediaId', label: t('vendorMicrosite.editor.picture'), type: 'media' },
                  { key: 'caption', label: t('vendorMicrosite.editor.caption'), max: LIMITS.short }]"
        :media="images"
        :max="LIMITS.gallery"
        :add-label="t('vendorMicrosite.editor.add')"
      />
    </fieldset>

    <fieldset v-if="has('quote')" class="block">
      <legend>{{ t('vendorMicrosite.editor.section.quote') }}</legend>
      <div class="grid2">
        <label class="field"><span>{{ t('vendorMicrosite.editor.eyebrow') }}</span>
          <input v-model="draft.quote.eyebrow" :maxlength="LIMITS.short" /></label>
        <label class="field"><span>{{ t('vendorMicrosite.editor.attribution') }}</span>
          <input v-model="draft.quote.attribution" :maxlength="LIMITS.short" /></label>
        <label class="field wide"><span>{{ t('vendorMicrosite.editor.quote') }}</span>
          <textarea v-model="draft.quote.text" :maxlength="LIMITS.text" rows="2"></textarea></label>
      </div>
    </fieldset>

    <fieldset v-if="has('chapters')" class="block">
      <legend>{{ t('vendorMicrosite.editor.section.chapters') }}</legend>
      <MicrositeListField
        v-model="draft.chapters"
        :fields="chapterFields"
        :media="images"
        :max="LIMITS.chapters"
        :add-label="t('vendorMicrosite.editor.add')"
      />
    </fieldset>

    <fieldset v-if="has('steps')" class="block">
      <legend>{{ t('vendorMicrosite.editor.section.steps') }}</legend>
      <IntroFields v-model="draft.processIntro" :limits="LIMITS" no-text />
      <p class="hint">{{ t('vendorMicrosite.editor.stepsHint') }}</p>
      <MicrositeListField
        v-model="draft.steps"
        :fields="[{ key: 'title', label: t('vendorMicrosite.editor.title'), max: LIMITS.short },
                  { key: 'description', label: t('vendorMicrosite.editor.text'), type: 'textarea', max: LIMITS.text }]"
        :max="LIMITS.steps"
        :add-label="t('vendorMicrosite.editor.add')"
      />
    </fieldset>

    <fieldset v-if="has('faq')" class="block">
      <legend>{{ t('vendorMicrosite.editor.section.faq') }}</legend>
      <IntroFields v-model="draft.faqIntro" :limits="LIMITS" no-text />
      <p class="hint">{{ t('vendorMicrosite.editor.faqHint') }}</p>
      <MicrositeListField
        v-model="draft.faq"
        :fields="[{ key: 'question', label: t('vendorMicrosite.editor.question'), max: LIMITS.title },
                  { key: 'answer', label: t('vendorMicrosite.editor.answer'), type: 'textarea', max: LIMITS.text }]"
        :max="LIMITS.faq"
        :add-label="t('vendorMicrosite.editor.add')"
      />
    </fieldset>

    <fieldset class="block">
      <legend>{{ t('vendorMicrosite.editor.section.contact') }}</legend>
      <IntroFields v-model="draft.contact" :limits="LIMITS" />
      <label class="field"><span>{{ t('vendorMicrosite.editor.footer') }}</span>
        <input v-model="draft.footer" :maxlength="LIMITS.footer" /></label>
    </fieldset>

    <div class="actions">
      <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">{{ t('vendorMicrosite.editor.save') }}</button>
    </div>
  </form>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import IntroFields from './MicrositeIntroFields.vue'
import MicrositeListField from './MicrositeListField.vue'
import { MODEL_OF_THEME } from './useMicrosite'

const props = defineProps({
  content: { type: Object, default: () => ({}) },
  theme: { type: String, default: 'CLASSIC' },
  /** The vendor's portfolio. */
  media: { type: Array, default: () => [] },
  vendorName: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['save'])
const { t } = useI18n()

/** The server's limits (MicrositeContentValidator), so a field stops where the server would refuse. */
const LIMITS = {
  short: 80, title: 140, text: 600, footer: 160,
  eventTypes: 6, services: 6, gallery: 12, chapters: 4, steps: 6, faq: 10,
}

/** Which sections each model draws — and so which the editor asks for. */
const MODEL_SECTIONS = {
  classic: ['eventTypes', 'services', 'gallery', 'quote'],
  gallery: ['gallery', 'services'],
  scene: ['approach', 'chapters', 'steps'],
  textual: ['gallery', 'approach', 'services', 'faq'],
}

const model = computed(() => MODEL_OF_THEME[props.theme] ?? 'classic')
const has = (section) => MODEL_SECTIONS[model.value].includes(section)

const images = computed(() => props.media.filter((item) => item.kind === 'IMAGE'))

const INTROS = ['servicesIntro', 'galleryIntro', 'approach', 'processIntro', 'faqIntro', 'contact']
const LISTS = ['services', 'gallery', 'chapters', 'steps', 'faq']

function fromContent(content = {}) {
  return {
    hero: { mediaId: null, ...content.hero },
    quote: { ...content.quote },
    footer: content.footer ?? '',
    eventTypes: [...(content.eventTypes ?? [])],
    ...Object.fromEntries(INTROS.map((key) => [key, { ...content[key] }])),
    ...Object.fromEntries(LISTS.map((key) => [key, (content[key] ?? []).map((row) => ({ ...row }))])),
  }
}

const draft = reactive(fromContent(props.content))
watch(() => props.content, (next) => Object.assign(draft, fromContent(next)))

const eventTypeRows = computed({
  get: () => draft.eventTypes.map((value) => ({ value })),
  set: (rows) => { draft.eventTypes = rows.map((row) => row.value ?? '') },
})

const serviceFields = computed(() => [
  ...(model.value === 'classic' ? [{ key: 'label', label: t('vendorMicrosite.editor.serviceLabel'), max: LIMITS.short }] : []),
  { key: 'name', label: t('vendorMicrosite.editor.serviceName'), max: LIMITS.short },
  ...(model.value === 'gallery' ? [] : [{ key: 'description', label: t('vendorMicrosite.editor.text'), type: 'textarea', max: LIMITS.text }]),
])

const chapterFields = computed(() => [
  { key: 'eyebrow', label: t('vendorMicrosite.editor.eyebrow'), max: LIMITS.short },
  { key: 'title', label: t('vendorMicrosite.editor.title'), max: LIMITS.title },
  { key: 'text', label: t('vendorMicrosite.editor.text'), type: 'textarea', max: LIMITS.text },
  { key: 'mediaId', label: t('vendorMicrosite.editor.picture'), type: 'media' },
  { key: 'ctaLabel', label: t('vendorMicrosite.editor.ctaLabel'), max: LIMITS.short },
])

const chosen = (mediaId) => draft.gallery.some((item) => item.mediaId === mediaId)

function toggle(mediaId) {
  if (chosen(mediaId)) {
    draft.gallery = draft.gallery.filter((item) => item.mediaId !== mediaId)
  } else if (draft.gallery.length < LIMITS.gallery) {
    draft.gallery = [...draft.gallery, { mediaId, caption: null }]
  }
}

/** Sent whole; the server trims, drops empty rows and refuses what is over a limit. */
function save() {
  emit('save', {
    ...draft,
    eventTypes: draft.eventTypes.filter((type) => type && type.trim()),
    hero: { ...draft.hero, mediaId: draft.hero.mediaId || null },
  })
}
</script>

<style scoped>
.content-editor { display: grid; gap: 14px; }
.help, .hint { margin: 0; color: var(--ink-3); font-size: 12.5px; }
.hint { margin: 8px 0; }
.block { margin: 0; padding: 14px; border: 1px solid var(--line); border-radius: 11px; }
.block legend { padding: 0 6px; font-size: 14px; font-weight: 700; color: var(--ivy); }
.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.content-editor :deep(.field > span) { display: block; margin-bottom: 4px; color: var(--ink-3); font-size: 12px; font-weight: 600; }
.content-editor :deep(.field.wide) { grid-column: 1 / -1; }
.content-editor :deep(.field input),
.content-editor :deep(.field select),
.content-editor :deep(.field textarea) {
  width: 100%; min-height: 36px; padding: 7px 9px;
  border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--ink); font: inherit; font-size: 13.5px;
}
.picker { list-style: none; margin: 8px 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(72px, 1fr)); gap: 6px; }
.thumb { display: block; width: 100%; aspect-ratio: 1; padding: 0; border: 2px solid transparent; border-radius: 8px; overflow: hidden; background: var(--mist-2); }
.thumb.on { border-color: var(--moss); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.actions { display: flex; justify-content: flex-end; }
@media (max-width: 700px) { .grid2 { grid-template-columns: 1fr; } }
</style>

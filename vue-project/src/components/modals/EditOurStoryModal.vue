<template>
  <BaseModal :open="open" :title="t('editOurStory.title')" @close="emit('close')">
    <!-- INV-401: optional section, what guests see, an example (static text). -->
    <FieldGuide
      :id="guideId"
      class="section-guide"
      section
      :guests="t('editSection.guide.story.guests')"
      :example="t('editSection.guide.story.example')"
    />
    <!-- INV-402: not read yet / could not be read — nothing to edit, no save. -->
    <SectionStateNotice
      v-if="!loaded"
      kind="story"
      :state="loadState === 'failed' ? 'failed' : 'loading'"
      :busy="busy"
      @retry="emit('retry-load')"
    />
    <template v-else>
    <SectionStateNotice v-if="hidden" ref="hiddenNotice" kind="story" state="hidden" @show="onShow" />
    <SectionStateNotice v-if="!hasOwnItems" ref="emptyNotice" kind="story" state="empty" :can-skip="!hidden" @add="emit('add')" @skip="onSkip" />
    <p v-if="hasExamples" class="examples-note" data-testid="examples-note">{{ t('editSection.guide.examples.note') }}</p>
    <div class="items-list" v-if="items.length">
      <div
        v-for="(item, idx) in items"
        :key="item.id || 'example-' + idx"
        class="item-card"
        :class="{ 'item-card--example': isUnsavedExample(item, 'ourStory') }"
        :data-example="isUnsavedExample(item, 'ourStory') ? 'true' : undefined"
      >
        <!-- Header row -->
        <div class="item-card-header" @click="toggleExpand(item.id || 'example-' + idx)">
          <button
            type="button"
            class="item-info item-toggle"
            :aria-expanded="isExpanded(item.id || 'example-' + idx) ? 'true' : 'false'"
            :aria-controls="itemBodyId(idx)"
            @click.stop="toggleExpand(item.id || 'example-' + idx)"
          >
            <span class="item-type">
              {{ getItemLabel(item, idx) }}
              <span v-if="isUnsavedExample(item, 'ourStory')" class="example-badge" data-testid="example-badge">{{ t('editSection.guide.examples.badge') }}</span>
            </span>
            <span class="item-desc" v-if="!isExpanded(item.id || 'example-' + idx)">{{ item.description || '' }}</span>
          </button>
          <div class="item-actions">
            <button v-if="!noAdd" class="icon-btn icon-btn--danger" type="button" :aria-label="t('editSection.a11y.deleteItem', { item: getItemLabel(item, idx) })" @click.stop="emit('delete', item.id, item)">
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
            <svg
              class="expand-chevron"
              aria-hidden="true"
              :class="{ 'expand-chevron--open': isExpanded(item.id || 'example-' + idx) }"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        <!-- Expandable inline form -->
        <div v-if="isExpanded(item.id || 'example-' + idx)" :id="itemBodyId(idx)" class="item-card-body">
          <div class="field" v-if="fc.type?.show">
            <label :for="fieldId(idx, 'type')">{{ t('ourStory.form.type') }}</label>
            <select :id="fieldId(idx, 'type')" class="input" :value="item.type" @change="onFieldChange(item, 'type', $event.target.value)">
              <option v-for="val in availableTypes" :key="val" :value="val">
                {{ t(`storyTypes.${val}`) }}
              </option>
            </select>
          </div>

          <div class="field" v-if="fc.date?.show">
            <label :for="fieldId(idx, 'date')">{{ t('ourStory.form.date') }}</label>
            <DateInput :input-id="fieldId(idx, 'date')" input-class="input" :model-value="item.storyDate || item.date || ''" @update:model-value="onFieldChange(item, 'storyDate', $event)" />
          </div>

          <div class="field" v-if="fc.imageUrl?.show">
            <p :id="fieldId(idx, 'image')" class="field-label-text">{{ t('ourStory.form.imageUrl') }}</p>
            <input :ref="el => setFileRef(item.id, el)" type="file" accept="image/*" class="hidden-file" @change="onFileSelected(item, $event)" />

            <div v-if="getImagePreview(item)" class="image-preview-wrap">
              <img :src="getImagePreview(item)" alt="Story image" class="image-preview" />
              <div class="image-preview-actions">
                <button type="button" class="image-action-btn" :aria-describedby="fieldId(idx, 'image')" @click="triggerFileSelect(item.id)">
                  {{ t('ourStory.form.changeImage') }}
                </button>
              </div>
            </div>
            <!-- INV-503: a button, so the keyboard can choose a photo too -->
            <button v-else type="button" class="image-upload-area" :aria-describedby="fieldId(idx, 'image')" @click="triggerFileSelect(item.id)">
              <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span class="upload-text">{{ t('ourStory.form.clickToUpload') }}</span>
            </button>
          </div>

          <div class="field" v-if="fc.description?.show">
            <label :for="`${guideId}-desc-${idx}`">{{ descriptionLabel }}</label>
            <textarea
              :id="`${guideId}-desc-${idx}`"
              :aria-describedby="guideId"
              class="input textarea"
              :value="item.description || ''"
              :placeholder="t('ourStory.addDialog.descriptionPh')"
              rows="3"
              @input="onFieldChange(item, 'description', $event.target.value)"
            />
          </div>

          <div class="field">
            <button
              type="button"
              role="switch"
              class="toggle-row"
              :aria-checked="item.showTitle !== false ? 'true' : 'false'"
              @click="onFieldChange(item, 'showTitle', !(item.showTitle !== false))"
            >
              <span class="toggle-switch" :class="{ on: item.showTitle !== false }" aria-hidden="true">
                <span class="toggle-knob" />
              </span>
              <span class="toggle-text">{{ t('ourStory.form.showTitle') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    </template>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t('common.close') }}
      </ButtonMain>
      <ButtonMain v-if="loaded && hasOwnItems && !props.noAdd && (!props.maxItems || items.length < props.maxItems)" variant="main" type="button" @click="emit('add')">
        {{ t('editOurStory.addItem') }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, useId, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import DateInput from "@/components/generic/DateInput.vue";
import { StoryType } from "@/enums/StoryType";
import { DEFAULT_FIELD_CONFIG } from "@/config/ourStoryFieldConfig.js";
import FieldGuide from "@/components/invitations/shared/FieldGuide.vue";
import SectionStateNotice from "@/components/invitations/shared/SectionStateNotice.vue";
import { isUnsavedExample } from "@/utils/creationSteps";

const { t, locale } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  fieldConfig: { type: Object, default: () => null },
  maxItems: { type: Number, default: 0 },
  noAdd: { type: Boolean, default: false },
  // INV-402: the section is hidden from the invitation (its entries are kept).
  hidden: { type: Boolean, default: false },
  // INV-402: 'idle' | 'loading' | 'loaded' | 'failed' — whether the list was read.
  loadState: { type: String, default: "loaded" },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "add", "delete", "update", "skip", "show", "retry-load"]);

const loaded = computed(() => props.loadState === "loaded");
// Examples shown only on screen are not entries (INV-402).
const hasOwnItems = computed(() => props.items.some((i) => !isUnsavedExample(i, "ourStory")));

const hiddenNotice = ref(null);
const emptyNotice = ref(null);
// After "Skip" / "Show it again" the button pressed is gone: the keyboard
// goes to the action that undoes it (or adds the first entry).
let focusAfter = null;
function onSkip() {
  focusAfter = "hidden";
  emit("skip");
}
function onShow() {
  focusAfter = "empty";
  emit("show");
}
watch(() => props.hidden, () => {
  const target = focusAfter;
  focusAfter = null;
  if (target) nextTick(() => (target === "hidden" ? hiddenNotice : emptyNotice).value?.focusAction());
});

const fc = computed(() => props.fieldConfig || DEFAULT_FIELD_CONFIG);

const descriptionLabel = computed(() => {
  const label = fc.value.description?.label;
  return label ? t(label) : t('ourStory.form.description');
});

const guideId = `${useId()}-story-guide`;
// INV-503: ids that tie each item's toggle, labels and fields together.
const itemUid = useId();
const itemBodyId = (idx) => `${itemUid}-item-${idx}`;
const fieldId = (idx, name) => `${itemUid}-${idx}-${name}`;
const hasExamples = computed(() => props.items.some((i) => isUnsavedExample(i, 'ourStory')));

const expandedId = ref(null);
const imagePreviews = ref({});
const selectedFiles = ref({});
const fileRefs = {};

const availableTypes = computed(() => Object.values(StoryType));

function getItemLabel(item, idx) {
  if (fc.value.type?.show && item.type) {
    return t(`storyTypes.${item.type}`);
  }
  // Try type translation even if type field is hidden (item may still have a type)
  if (item.type) {
    const typeLabel = t(`storyTypes.${item.type}`);
    if (typeLabel !== `storyTypes.${item.type}`) return typeLabel;
  }
  if (item.title) return item.title;
  // Use truncated description as label instead of generic "Paragraph N"
  if (item.description) {
    const text = item.description.length > 40 ? item.description.slice(0, 40) + '...' : item.description;
    return text;
  }
  return `${t('ourStory.form.paragraph')} ${idx + 1}`;
}

function isExpanded(id) { return expandedId.value === id; }

// An example being edited becomes an entry with an id (INV-402): it stays open.
watch(() => props.items, (items) => {
  const m = /^example-(\d+)$/.exec(expandedId.value || "");
  const now = m && items[Number(m[1])];
  if (now?.id) expandedId.value = now.id;
}, { deep: true });
function toggleExpand(id) { expandedId.value = expandedId.value === id ? null : id; }

function setFileRef(id, el) { if (el) fileRefs[id] = el; }
function triggerFileSelect(id) { fileRefs[id]?.click(); }

function getImagePreview(item) {
  return imagePreviews.value[item.id] || item.imageUrl || '';
}

function onFileSelected(item, e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  imagePreviews.value = { ...imagePreviews.value, [item.id]: url };
  selectedFiles.value = { ...selectedFiles.value, [item.id]: file };
  if (fileRefs[item.id]) fileRefs[item.id].value = '';
  emitUpdate(item);
}

function onFieldChange(item, field, value) {
  const updated = { ...item, [field]: value };
  emitUpdate(updated, item);
}

function emitUpdate(item, original = item) {
  const lang = locale.value || 'mk';
  const desc = (item.description || '').trim() || null;
  const imgUrl = imagePreviews.value[item.id] || item.imageUrl || null;
  const payload = {
    id: item.id,
    type: item.type,
    storyDate: item.storyDate || item.date || null,
    description: desc,
    imageUrl: imgUrl,
    showTitle: item.showTitle !== false,
  };
  if (desc) payload.descriptionI18n = { [lang]: desc };
  emit('update', payload, selectedFiles.value[item.id] || null, original);
}
</script>

<style scoped>
.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  background: var(--neutral-50, var(--sunken));
  border: 1px solid var(--neutral-200, var(--line));
  border-radius: 10px;
  overflow: hidden;
}

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.item-card-header:hover {
  background: var(--neutral-100, var(--sunken));
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.item-type {
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-main, var(--ink));
}

.item-desc {
  font-size: 12px;
  color: var(--neutral-500, var(--ink-3));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  margin-left: 8px;
}

.expand-chevron {
  transition: transform 0.2s ease;
  color: var(--neutral-400, var(--ink-4));
}

.expand-chevron--open {
  transform: rotate(90deg);
}

.item-card-body {
  padding: 0 12px 12px;
  display: grid;
  gap: 12px;
}

.field label:not(.toggle-row) {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-500);
  display: block;
  margin-bottom: 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.input {
  width: 100%;
  border: 2px solid var(--neutral-300);
  background: var(--bg-main, #fff);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--brand-main);
  outline: none;
  transition: border-color 0.2s ease;
}

.input:focus {
  border-color: var(--brand-gold);
}

.textarea {
  resize: vertical;
  font-family: inherit;
  min-height: 72px;
}

.hidden-file {
  display: none;
}

.image-upload-area {
  border: 2px dashed var(--neutral-300, var(--line-2));
  border-radius: 10px;
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: var(--neutral-400, var(--ink-4));
  transition: border-color 0.2s, color 0.2s;
}

.image-upload-area:hover {
  border-color: var(--brand-gold, var(--brand-gold));
  color: var(--brand-gold, var(--brand-gold));
}

.upload-text {
  font-size: 13px;
  font-weight: 600;
}

.image-preview-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--neutral-200, var(--line));
}

.image-preview {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  display: block;
}

.image-preview-actions {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  background: var(--neutral-50, var(--sunken));
}

.image-action-btn {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-main);
  transition: opacity 0.15s;
}

.image-action-btn:hover {
  opacity: 0.7;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid var(--neutral-200, var(--line));
  border-radius: 6px;
  cursor: pointer;
  color: var(--neutral-600, var(--ink-2));
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--neutral-100, var(--sunken));
  border-color: var(--neutral-300, var(--line-2));
}

.icon-btn--danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.section-guide {
  margin: 0 0 10px;
}

.examples-note {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--neutral-600, var(--ink-3));
}

/* An example entry: dashed edge and a worded badge, not only a colour. */
.item-card--example {
  border-style: dashed;
}

.example-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border: 1px dashed currentColor;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  font-style: italic;
  color: var(--neutral-600, var(--ink-3));
  vertical-align: middle;
}


/* ---- Show title toggle ---- */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-transform: none;
  font-weight: 500;
  margin: 0;
}

.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: var(--neutral-300, var(--line-2));
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.toggle-switch.on {
  background: var(--brand-gold, var(--brand-gold));
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
}

.toggle-switch.on .toggle-knob {
  transform: translateX(18px);
}

.toggle-text {
  font-size: 13px;
  color: var(--dash-ink, #1a1a1a);
  text-transform: none;
  letter-spacing: normal;
}

/* INV-503: the row's toggle is a real button; focus is always visible */
.item-toggle {
  flex: 1;
  min-width: 0;
  align-items: flex-start;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.item-toggle:focus-visible,
.icon-btn:focus-visible,
.input:focus-visible,
.toggle-row:focus-visible,
.image-upload-area:focus-visible,
.image-action-btn:focus-visible {
  outline: 3px solid var(--moss, #5e7f58);
  outline-offset: 2px;
}

.image-upload-area {
  width: 100%;
  background: none;
  font: inherit;
}

.toggle-row {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
}

.field-label-text {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-500);
  margin: 0 0 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
</style>

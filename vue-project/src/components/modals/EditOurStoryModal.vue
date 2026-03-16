<template>
  <BaseModal :open="open" :title="t('editOurStory.title')" @close="emit('close')">
    <div class="items-list" v-if="items.length">
      <div v-for="(item, idx) in items" :key="item.id" class="item-card">
        <!-- Header row -->
        <div class="item-card-header" @click="toggleExpand(item.id)">
          <div class="item-info">
            <span class="item-type">{{ getItemLabel(item, idx) }}</span>
            <span class="item-desc" v-if="!isExpanded(item.id)">{{ item.description || '' }}</span>
          </div>
          <div class="item-actions">
            <button class="icon-btn icon-btn--danger" type="button" @click.stop="emit('delete', item.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
            <svg
              class="expand-chevron"
              :class="{ 'expand-chevron--open': isExpanded(item.id) }"
              width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>

        <!-- Expandable inline form -->
        <div v-if="isExpanded(item.id)" class="item-card-body">
          <div class="field" v-if="fc.type?.show">
            <label>{{ t('ourStory.form.type') }}</label>
            <select class="input" :value="item.type" @change="onFieldChange(item, 'type', $event.target.value)">
              <option v-for="val in availableTypes" :key="val" :value="val">
                {{ t(`storyTypes.${val}`) }}
              </option>
            </select>
          </div>

          <div class="field" v-if="fc.date?.show">
            <label>{{ t('ourStory.form.date') }}</label>
            <input type="date" class="input" :value="item.storyDate || item.date || ''" @input="onFieldChange(item, 'storyDate', $event.target.value)" />
          </div>

          <div class="field" v-if="fc.imageUrl?.show">
            <label>{{ t('ourStory.form.imageUrl') }}</label>
            <input :ref="el => setFileRef(item.id, el)" type="file" accept="image/*" class="hidden-file" @change="onFileSelected(item, $event)" />

            <div v-if="getImagePreview(item)" class="image-preview-wrap">
              <img :src="getImagePreview(item)" alt="Story image" class="image-preview" />
              <div class="image-preview-actions">
                <button type="button" class="image-action-btn" @click="triggerFileSelect(item.id)">
                  {{ t('ourStory.form.changeImage') }}
                </button>
              </div>
            </div>
            <div v-else class="image-upload-area" @click="triggerFileSelect(item.id)">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span class="upload-text">{{ t('ourStory.form.clickToUpload') }}</span>
            </div>
          </div>

          <div class="field" v-if="fc.description?.show">
            <label>{{ descriptionLabel }}</label>
            <textarea
              class="input textarea"
              :value="item.description || ''"
              :placeholder="t('ourStory.addDialog.descriptionPh')"
              rows="3"
              @input="onFieldChange(item, 'description', $event.target.value)"
            />
          </div>
        </div>
      </div>
    </div>
    <p v-else class="empty-msg">{{ t('editOurStory.empty') }}</p>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t('common.close') }}
      </ButtonMain>
      <ButtonMain v-if="!props.maxItems || items.length < props.maxItems" variant="main" type="button" @click="emit('add')">
        {{ t('editOurStory.addItem') }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { StoryType } from "@/enums/StoryType";
import { DEFAULT_FIELD_CONFIG } from "@/config/ourStoryFieldConfig.js";

const { t, locale } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  fieldConfig: { type: Object, default: () => null },
  maxItems: { type: Number, default: 0 },
});

const emit = defineEmits(["close", "add", "delete", "update"]);

const fc = computed(() => props.fieldConfig || DEFAULT_FIELD_CONFIG);

const descriptionLabel = computed(() => {
  const label = fc.value.description?.label;
  return label ? t(label) : t('ourStory.form.description');
});

const expandedId = ref(null);
const imagePreviews = ref({});
const selectedFiles = ref({});
const fileRefs = {};

const availableTypes = computed(() => Object.values(StoryType));

function getItemLabel(item, idx) {
  if (fc.value.type?.show && item.type) {
    return t(`storyTypes.${item.type}`);
  }
  if (item.title) return item.title;
  return `${t('ourStory.form.paragraph')} ${idx + 1}`;
}

function isExpanded(id) { return expandedId.value === id; }
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
  emitUpdate(updated);
}

function emitUpdate(item) {
  const lang = locale.value || 'mk';
  const desc = (item.description || '').trim() || null;
  const imgUrl = imagePreviews.value[item.id] || item.imageUrl || null;
  const payload = {
    id: item.id,
    type: item.type,
    storyDate: item.storyDate || item.date || null,
    description: desc,
    imageUrl: imgUrl,
  };
  if (desc) payload.descriptionI18n = { [lang]: desc };
  emit('update', payload, selectedFiles.value[item.id] || null);
}
</script>

<style scoped>
.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-card {
  background: var(--neutral-50, #f9fafb);
  border: 1px solid var(--neutral-200, #e5e7eb);
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
  background: var(--neutral-100, #f3f4f6);
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
  color: var(--brand-main, #1f2937);
}

.item-desc {
  font-size: 12px;
  color: var(--neutral-500, #6b7280);
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
  color: var(--neutral-400, #9ca3af);
}

.expand-chevron--open {
  transform: rotate(90deg);
}

.item-card-body {
  padding: 0 12px 12px;
  display: grid;
  gap: 12px;
}

.field label {
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
  border: 2px dashed var(--neutral-300, #d1d5db);
  border-radius: 10px;
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  color: var(--neutral-400, #9ca3af);
  transition: border-color 0.2s, color 0.2s;
}

.image-upload-area:hover {
  border-color: var(--brand-gold, #c8a24d);
  color: var(--brand-gold, #c8a24d);
}

.upload-text {
  font-size: 13px;
  font-weight: 600;
}

.image-preview-wrap {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--neutral-200, #e5e7eb);
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
  background: var(--neutral-50, #f9fafb);
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
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 6px;
  cursor: pointer;
  color: var(--neutral-600, #4b5563);
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: var(--neutral-100, #f3f4f6);
  border-color: var(--neutral-300, #d1d5db);
}

.icon-btn--danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.empty-msg {
  text-align: center;
  color: var(--neutral-500, #6b7280);
  font-size: 14px;
  padding: 24px 0;
}
</style>

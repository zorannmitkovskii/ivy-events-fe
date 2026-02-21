<template>
  <BaseModal :open="open" :title="isEdit ? t('ourStory.editDialog.title') : t('ourStory.addDialog.title')" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <div class="field" v-if="fieldConfig.title?.show">
        <label>{{ t("ourStory.form.title") }} {{ fieldConfig.title.required ? '*' : '' }}</label>
        <input class="input" v-model="draft.title" :placeholder="t('ourStory.addDialog.titlePh')" />
        <div v-if="errors.title" class="err">{{ errors.title }}</div>
      </div>

      <div class="field" v-if="fieldConfig.type?.show">
        <label>{{ t("ourStory.form.type") }} {{ fieldConfig.type.required ? '*' : '' }}</label>
        <select class="input" v-model="draft.type">
          <option v-for="(val, key) in StoryType" :key="key" :value="val">
            {{ t(`storyTypes.${val}`) }}
          </option>
        </select>
        <div v-if="errors.type" class="err">{{ errors.type }}</div>
      </div>

      <div class="field" v-if="fieldConfig.date?.show">
        <label>{{ t("ourStory.form.date") }} {{ fieldConfig.date.required ? '*' : '' }}</label>
        <input class="input" type="date" v-model="draft.storyDate" />
        <div v-if="errors.storyDate" class="err">{{ errors.storyDate }}</div>
      </div>

      <div class="field" v-if="fieldConfig.imageUrl?.show">
        <label>{{ t("ourStory.form.imageUrl") }} {{ fieldConfig.imageUrl.required ? '*' : '' }}</label>
        <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onFileSelected" />

        <div v-if="imagePreviewUrl" class="image-preview-wrap">
          <img :src="imagePreviewUrl" alt="Story image" class="image-preview" />
          <div class="image-preview-actions">
            <button type="button" class="image-action-btn" :disabled="uploading" @click="fileInput?.click()">
              {{ t('ourStory.form.changeImage') }}
            </button>
            <button type="button" class="image-action-btn image-action-btn--remove" :disabled="uploading" @click="removeImage">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>

        <div v-else class="image-upload-area" @click="fileInput?.click()">
          <div v-if="uploading" class="uploading-indicator">
            <div class="spinner"></div>
            <span>{{ t('ourStory.images.uploading') }}</span>
          </div>
          <template v-else>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span class="upload-text">{{ t("ourStory.form.clickToUpload") }}</span>
          </template>
        </div>

        <div v-if="uploadError" class="err">{{ uploadError }}</div>
        <div v-if="errors.imageUrl" class="err">{{ errors.imageUrl }}</div>
      </div>

      <div class="field" v-if="fieldConfig.description?.show">
        <label>{{ t(fieldConfig.description.label || "ourStory.form.description") }} {{ fieldConfig.description.required ? '*' : '' }}</label>
        <textarea
          class="input textarea"
          v-model="draft.description"
          :placeholder="t('ourStory.addDialog.descriptionPh')"
          rows="3"
        />
        <div v-if="errors.description" class="err">{{ errors.description }}</div>
      </div>

      <div v-if="validationError" class="err-box">{{ validationError }}</div>
    </form>

    <template #footer>
      <ButtonMain v-if="isEdit" variant="danger" type="button" @click="emit('delete', item.id)">
        {{ t("common.delete") }}
      </ButtonMain>

      <div class="footer-right">
        <ButtonMain variant="outline" type="button" @click="emit('close')">
          {{ t("common.cancel") }}
        </ButtonMain>
        <ButtonMain variant="main" type="button" @click="submit">
          {{ isEdit ? t("common.save") : t("ourStory.addDialog.create") }}
        </ButtonMain>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { StoryType } from "@/enums/StoryType";
import { onboardingStore } from "@/store/onboarding.store.js";
import { OUR_STORY_FIELD_CONFIG, DEFAULT_FIELD_CONFIG } from "@/config/ourStoryFieldConfig.js";
import { invitationImagesService } from "@/services/invitationImages.service.js";

const { t, locale } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  item: { type: Object, default: null }
});

const emit = defineEmits(["close", "submit", "delete"]);

const isEdit = computed(() => !!props.item?.id);

const fieldConfig = computed(() =>
  OUR_STORY_FIELD_CONFIG[onboardingStore.invitationName] || DEFAULT_FIELD_CONFIG
);

const draft = reactive({
  title: "",
  type: StoryType.HOW_WE_MET,
  description: "",
  storyDate: "",
});

const errors = reactive({ title: "", type: "", description: "", storyDate: "", imageUrl: "" });
const validationError = ref("");

/* ---- image upload ---- */
const imagePreviewUrl = ref("");
const imageS3Key = ref("");
const uploading = ref(false);
const uploadError = ref("");
const fileInput = ref(null);

function extractS3Key(proxyUrl) {
  if (!proxyUrl) return "";
  const marker = "/public/images/";
  const idx = proxyUrl.indexOf(marker);
  return idx !== -1 ? proxyUrl.substring(idx + marker.length) : proxyUrl;
}

async function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  uploading.value = true;
  uploadError.value = "";
  try {
    const results = await invitationImagesService.uploadOurStoryImages(onboardingStore.eventId, [file]);
    const url = Array.isArray(results) && results.length ? (results[0]?.url || "") : "";
    imagePreviewUrl.value = url;
    imageS3Key.value = extractS3Key(url);
  } catch (err) {
    uploadError.value = err?.message || "Upload failed";
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

function removeImage() {
  imagePreviewUrl.value = "";
  imageS3Key.value = "";
}

watch(
  () => props.open,
  (v) => {
    if (!v) return;

    validationError.value = "";
    errors.title = "";
    errors.type = "";
    errors.description = "";
    errors.storyDate = "";
    errors.imageUrl = "";

    uploading.value = false;
    uploadError.value = "";

    if (props.item) {
      draft.title = props.item.title ?? "";
      draft.type = props.item.type ?? StoryType.HOW_WE_MET;
      draft.description = props.item.description ?? "";
      draft.storyDate = props.item.storyDate ?? props.item.date ?? "";
      imagePreviewUrl.value = props.item.imageUrl ?? "";
      imageS3Key.value = extractS3Key(props.item.imageUrl);
    } else {
      draft.title = "";
      draft.type = StoryType.HOW_WE_MET;
      draft.description = "";
      draft.storyDate = "";
      imagePreviewUrl.value = "";
      imageS3Key.value = "";
    }
  }
);

function validate() {
  validationError.value = "";
  const cfg = fieldConfig.value;

  errors.title = (cfg.title?.show && cfg.title?.required && !draft.title.trim())
    ? t("ourStory.errors.titleRequired") : "";

  errors.type = (cfg.type?.show && cfg.type?.required && !draft.type)
    ? t("ourStory.errors.typeRequired") : "";

  errors.description = (cfg.description?.show && cfg.description?.required && !draft.description.trim())
    ? t("ourStory.errors.descriptionRequired") : "";

  errors.storyDate = (cfg.date?.show && cfg.date?.required && !draft.storyDate)
    ? t("ourStory.errors.dateRequired") : "";

  errors.imageUrl = (cfg.imageUrl?.show && cfg.imageUrl?.required && !imageS3Key.value)
    ? t("ourStory.errors.imageUrlRequired") : "";

  return !(errors.title || errors.type || errors.description || errors.storyDate || errors.imageUrl);
}

function submit() {
  if (!validate()) return;

  const cfg = fieldConfig.value;
  const lang = locale.value || "mk";
  const payload = {};

  if (cfg.title?.show) {
    const title = draft.title.trim();
    payload.title = title;
    payload.titleI18n = { [lang]: title };
  }
  if (cfg.type?.show) payload.type = draft.type;
  if (cfg.description?.show) {
    const desc = draft.description.trim() || null;
    payload.description = desc;
    if (desc) payload.descriptionI18n = { [lang]: desc };
  }
  if (cfg.date?.show) payload.storyDate = draft.storyDate || null;

  if (isEdit.value) {
    payload.id = props.item.id;
  }

  emit("submit", payload);
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 14px;
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
  background: var(--bg-main);
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

.err {
  margin-top: 6px;
  font-size: 12px;
  color: var(--error);
  font-weight: 600;
}

.err-box {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #ffd2d2;
  background: #fff5f5;
  color: #b00020;
  font-weight: 600;
  font-size: 13px;
}

.footer-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

/* ---- Image Upload ---- */
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

.uploading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid var(--neutral-200, #e5e7eb);
  border-top-color: var(--brand-main);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

.image-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.image-action-btn--remove {
  color: var(--error, #dc2626);
}
</style>

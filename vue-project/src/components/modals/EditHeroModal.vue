<template>
  <BaseModal :open="open" :title="t('editHero.title')" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <!-- Hero Image -->
      <div class="field">
        <label>{{ t('editHero.heroImage') }}</label>
        <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onFileSelected" />

        <div v-if="imagePreview" class="image-preview-wrap">
          <img :src="imagePreview" alt="Hero" class="image-preview" />
          <button type="button" class="change-btn" :disabled="uploading" @click="fileInput?.click()">
            {{ t('editHero.changeImage') }}
          </button>
        </div>
        <div v-else class="image-upload-area" @click="fileInput?.click()">
          <div v-if="uploading" class="uploading-state">
            <div class="spinner"></div>
            <span>{{ t('editHero.uploading') }}</span>
          </div>
          <template v-else>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span class="upload-text">{{ t('editHero.uploadImage') }}</span>
          </template>
        </div>
      </div>
    </form>

    <template v-if="!liveEdit" #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t('common.cancel') }}
      </ButtonMain>
      <ButtonMain variant="main" type="button" :loading="saving" @click="submit">
        {{ t('common.save') }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { invitationImagesService } from "@/services/invitationImages.service";
import { onboardingStore } from "@/store/onboarding.store";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  event: { type: Object, default: () => ({}) },
  liveEdit: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "updated", "change"]);

const imagePreview = ref("");
const selectedFile = ref(null);
const fileInput = ref(null);
const uploading = ref(false);
const saving = ref(false);
const isInitializing = ref(true);

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    isInitializing.value = true;
    const ev = props.event || {};
    imagePreview.value = ev.heroImageUrl || "";
    selectedFile.value = null;
    nextTick(() => { isInitializing.value = false; });
  },
  { immediate: true }
);

function emitChange() {
  if (isInitializing.value || !props.liveEdit) return;
  emit('change', {
    heroImageUrl: imagePreview.value,
    heroFile: selectedFile.value || null,
  });
}

function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  selectedFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
  if (fileInput.value) fileInput.value.value = "";
  emitChange();
}

async function submit() {
  const eventId = onboardingStore.eventId;
  if (!eventId) return;
  saving.value = true;
  try {
    if (selectedFile.value) {
      uploading.value = true;
      await invitationImagesService.uploadHeroImage(eventId, selectedFile.value);
      uploading.value = false;
    }

    emit("updated");
    emit("close");
  } catch (e) {
    console.error("Failed to save hero:", e);
  } finally {
    saving.value = false;
    uploading.value = false;
  }
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

.change-btn {
  display: block;
  width: 100%;
  padding: 8px;
  background: var(--neutral-50, #f9fafb);
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--brand-main);
  transition: opacity 0.15s;
}

.change-btn:hover {
  opacity: 0.7;
}

.change-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.uploading-state {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--brand-gold, #c4956a);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>

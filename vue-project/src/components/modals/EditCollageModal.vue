<template>
  <BaseModal :open="open" :title="t('editCollage.title')" @close="emit('close')">
    <div class="collage-grid" v-if="photos.length">
      <div v-for="(photo, i) in photos" :key="photo.url || i" class="collage-thumb">
        <img :src="photo.thumbUrl || photo.url" :alt="`Photo ${i + 1}`" />
        <button class="delete-btn" type="button" :disabled="deleting" @click="onDelete(photo.url)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
    <p v-else class="empty-msg">{{ t('editCollage.empty') }}</p>

    <input ref="fileInput" type="file" accept="image/*" multiple class="hidden-file" @change="onFilesSelected" />

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t('common.close') }}
      </ButtonMain>
      <ButtonMain variant="main" type="button" :loading="uploading" @click="fileInput?.click()">
        {{ t('editCollage.upload') }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { useCollagePhotos } from "@/composables/useCollagePhotos";
import { onboardingStore } from "@/store/onboarding.store";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
});

const emit = defineEmits(["close", "updated"]);

const { photos, loadPhotos, uploadPhotos, deletePhoto } = useCollagePhotos();
const uploading = ref(false);
const deleting = ref(false);
const fileInput = ref(null);

watch(
  () => props.open,
  async (v) => {
    if (v) {
      const eventId = onboardingStore.eventId;
      if (eventId) await loadPhotos(eventId);
    }
  }
);

async function onFilesSelected(e) {
  const files = e.target.files;
  if (!files?.length) return;
  const eventId = onboardingStore.eventId;
  if (!eventId) return;
  uploading.value = true;
  try {
    await uploadPhotos(eventId, files);
    emit("updated");
  } catch (err) {
    console.error("Upload failed:", err);
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
}

async function onDelete(url) {
  const eventId = onboardingStore.eventId;
  if (!eventId) return;
  deleting.value = true;
  try {
    await deletePhoto(eventId, url);
    emit("updated");
  } catch (err) {
    console.error("Delete failed:", err);
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.collage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.collage-thumb {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 1;
}

.collage-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.15s;
}

.delete-btn:hover {
  background: rgba(220, 38, 38, 0.85);
}

.delete-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.hidden-file {
  display: none;
}

.empty-msg {
  text-align: center;
  color: var(--neutral-500, #6b7280);
  font-size: 14px;
  padding: 24px 0;
}
</style>

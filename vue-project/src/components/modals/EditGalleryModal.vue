<template>
  <BaseModal :open="open" :title="t('editSection.gallery')" @close="emit('close')">
    <div class="gallery-modal">
      <label class="upload-area">
        <input type="file" accept="image/*" multiple class="upload-input" @change="onFileSelect" />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        {{ t('editSection.uploadPhoto') }}
      </label>

      <div v-if="localPhotos.length" class="photo-grid">
        <div v-for="(photo, i) in localPhotos" :key="i" class="photo-item">
          <img :src="photo.url" :alt="photo.alt || ''" class="photo-thumb" />
          <button class="photo-delete" @click="removePhoto(i)" :title="t('editSection.deletePhoto')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div class="photo-order">
            <button v-if="i > 0" class="order-btn" @click="movePhoto(i, -1)" title="Move up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button v-if="i < localPhotos.length - 1" class="order-btn" @click="movePhoto(i, 1)" title="Move down">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>
        </div>
      </div>

      <p v-else class="empty-msg">No photos yet. Upload some to get started.</p>
    </div>

    <template v-if="!liveEdit" #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">Cancel</ButtonMain>
      <ButtonMain variant="main" type="button" @click="onSave">{{ t('editSection.save') }}</ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/components/ui/BaseModal.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  photos: { type: Array, default: () => [] },
  eventId: { type: String, default: '' },
  liveEdit: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'save', 'change']);

const localPhotos = ref([]);

watch(() => props.open, (v) => {
  if (v) {
    localPhotos.value = props.photos.map(p => ({ ...p }));
  }
}, { immediate: true });

function emitChange() {
  if (props.liveEdit) {
    emit('change', localPhotos.value.map(p => ({ ...p })));
  }
}

function onFileSelect(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    localPhotos.value.push({ url, alt: file.name, _file: file });
  });
  e.target.value = '';
  emitChange();
}

function removePhoto(index) {
  const photo = localPhotos.value[index];
  if (photo.url?.startsWith('blob:')) {
    URL.revokeObjectURL(photo.url);
  }
  localPhotos.value.splice(index, 1);
  emitChange();
}

function movePhoto(index, direction) {
  const target = index + direction;
  if (target < 0 || target >= localPhotos.value.length) return;
  const arr = localPhotos.value;
  [arr[index], arr[target]] = [arr[target], arr[index]];
  localPhotos.value = [...arr];
  emitChange();
}

function onSave() {
  emit('save', localPhotos.value.map(p => ({ ...p })));
}
</script>

<style scoped>
.gallery-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 2px dashed #d1d5db;
  border-radius: 10px;
  background: #f9fafb;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.upload-area:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
}

.upload-input {
  display: none;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
}

.photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-delete {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
}

.photo-item:hover .photo-delete {
  opacity: 1;
}

.photo-order {
  position: absolute;
  bottom: 4px;
  left: 4px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.photo-item:hover .photo-order {
  opacity: 1;
}

.order-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.empty-msg {
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
  padding: 24px 0;
}
</style>

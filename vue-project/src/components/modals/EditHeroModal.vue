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

      <!-- Bride Name -->
      <div class="field">
        <label>{{ t('editHero.brideName') }}</label>
        <input class="input" type="text" v-model="draft.brideName" />
      </div>

      <!-- Groom Name -->
      <div class="field">
        <label>{{ t('editHero.groomName') }}</label>
        <input class="input" type="text" v-model="draft.groomName" />
      </div>

      <!-- Wedding Date -->
      <div class="field">
        <label>{{ t('editHero.weddingDate') }}</label>
        <input class="input" type="date" v-model="draft.date" />
      </div>

      <!-- Location -->
      <div class="field">
        <label>{{ t('editHero.location') }}</label>
        <div v-if="!editingLocation && locationDisplay" class="location-readonly">
          <span class="location-text">{{ locationDisplay }}</span>
          <button type="button" class="edit-location-btn" @click="editingLocation = true" :title="t('editHero.changeLocation')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
        <AuthLocationInput
          v-else
          :label="''"
          :placeholder="t('editHero.locationPh')"
          v-model="draft.location"
          :pick-on-map-label="t('common.pickOnMap')"
          :cancel-label="t('common.cancel')"
          :use-this-location-label="t('common.useThisLocation')"
          :search-placeholder="t('common.searchPlaces')"
          :locating-label="t('common.locateMe')"
          :locating-label-loading="t('common.locating')"
        />
      </div>
    </form>

    <template #footer>
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
import { reactive, ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";
import { invitationImagesService } from "@/services/invitationImages.service";
import { eventsService } from "@/services/events.service";
import { onboardingStore } from "@/store/onboarding.store";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  event: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["close", "updated"]);

const draft = reactive({
  brideName: "", groomName: "", date: "",
  location: { name: "", address: "", lat: null, lng: null, placeId: null },
});
const imagePreview = ref("");
const selectedFile = ref(null);
const fileInput = ref(null);
const uploading = ref(false);
const saving = ref(false);
const editingLocation = ref(false);

const locationDisplay = computed(() => {
  const loc = draft.location;
  const parts = [loc.name, loc.address].filter(Boolean);
  return parts.join(", ") || "";
});

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    const ev = props.event || {};
    draft.brideName = ev.coupleNames?.bride || "";
    draft.groomName = ev.coupleNames?.groom || "";
    draft.date = ev.date ? ev.date.slice(0, 10) : "";
    const loc = ev.location;
    draft.location = loc ? {
      name: loc.name || "",
      address: loc.addressLine || "",
      lat: loc.latitude ?? null,
      lng: loc.longitude ?? null,
      placeId: null,
    } : { name: "", address: "", lat: null, lng: null, placeId: null };
    imagePreview.value = ev.heroImageUrl || "";
    selectedFile.value = null;
    editingLocation.value = false;
  }
);

function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  selectedFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
  if (fileInput.value) fileInput.value.value = "";
}

async function submit() {
  const eventId = onboardingStore.eventId;
  if (!eventId) return;
  saving.value = true;
  try {
    // Upload hero image if changed
    if (selectedFile.value) {
      uploading.value = true;
      await invitationImagesService.uploadHeroImage(eventId, selectedFile.value);
      uploading.value = false;
    }

    // Update event details
    const payload = {};
    if (draft.brideName || draft.groomName) {
      payload.coupleNames = {
        bride: draft.brideName,
        groom: draft.groomName,
      };
    }
    if (draft.date) {
      payload.date = draft.date;
    }
    const loc = draft.location;
    const hasLoc = loc.address || loc.name || loc.lat != null;
    payload.location = hasLoc ? {
      name: loc.name || loc.address || "",
      type: null,
      postalCode: null,
      addressLine: loc.address || "",
      city: null,
      countryIso3: null,
      latitude: loc.lat ?? null,
      longitude: loc.lng ?? null,
      photoUrl: null,
      googleMapsUrl: null,
      description: null,
      capacity: null,
      openingHours: null,
      notes: null,
      contact: null,
      isActive: true,
    } : null;
    await eventsService.update(eventId, payload);

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

.location-readonly {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--neutral-300);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--bg-main);
}

.location-text {
  flex: 1;
  font-size: 14px;
  color: var(--brand-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-location-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--neutral-400);
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.edit-location-btn:hover {
  color: var(--brand-gold);
}
</style>

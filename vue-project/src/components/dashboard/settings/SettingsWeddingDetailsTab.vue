<template>
  <div>
    <div class="toolbar">
      <div></div>
      <button class="btn-add" @click="openCreate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        {{ t('weddingDetails.addBtn') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-msg">
      <div class="spinner"></div>
      <span>{{ t('weddingDetails.loading') }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="items.length === 0" class="empty-card">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <h3 class="empty-title">{{ t('weddingDetails.emptyTitle') }}</h3>
      <p class="empty-sub">{{ t('weddingDetails.emptyMessage') }}</p>
      <button class="btn-add" @click="openCreate">{{ t('weddingDetails.addBtn') }}</button>
    </div>

    <!-- Hero Image -->
    <div v-if="!loading" class="hero-image-card">
      <div class="hero-image-header">
        <div>
          <h3 class="hero-image-title">{{ t('weddingDetails.heroImage') }}</h3>
          <p class="hero-image-desc">{{ t('weddingDetails.heroImageDesc') }}</p>
        </div>
      </div>

      <input ref="heroFileInput" type="file" accept="image/*" class="hidden-file" @change="onHeroFileChange" />

      <div v-if="heroImageUrl" class="hero-preview-wrap">
        <img :src="heroImageUrl" alt="Hero" class="hero-preview-img" />
        <button class="hero-change-btn" :disabled="heroUploading" @click="heroFileInput?.click()">
          {{ heroUploading ? t('weddingDetails.heroUploading') : t('weddingDetails.changeHeroImage') }}
        </button>
      </div>

      <div v-else class="hero-upload-area" @click="heroFileInput?.click()">
        <div v-if="heroUploading" class="hero-uploading">
          <div class="spinner"></div>
          <span>{{ t('weddingDetails.heroUploading') }}</span>
        </div>
        <template v-else>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span class="hero-upload-text">{{ t('weddingDetails.uploadHeroImage') }}</span>
        </template>
      </div>
    </div>

    <!-- Cards Grid -->
    <div v-if="!loading && items.length > 0" class="details-grid">
      <div v-for="item in sorted" :key="item.id" class="detail-card">
        <div class="detail-card-head">
          <div class="detail-icon" v-if="item.icon">
            <span>{{ iconMap[item.icon] || item.icon }}</span>
          </div>
          <div class="detail-order">#{{ item.displayOrder }}</div>
          <div class="detail-actions">
            <button class="action-btn" @click="openEdit(item)" title="Edit">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn action-btn--delete" @click="onDelete(item)" title="Delete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <h4 class="detail-title">{{ item.title }}</h4>
        <p class="detail-desc" v-if="item.description">
          {{ item.description }}
        </p>
        <div v-if="item.location?.venueName || item.location?.address" class="detail-location">
          <span class="detail-location-name">{{ item.location.venueName || item.location.address }}</span>
          <a v-if="getMapUrl(item.location)" :href="getMapUrl(item.location)" target="_blank" rel="noopener" class="detail-map-btn">
            {{ t('weddingDetails.showOnMap') }}
          </a>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <BaseModal :open="modalOpen" :title="isEditing ? t('weddingDetails.editTitle') : t('weddingDetails.createTitle')" @close="closeModal">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">{{ t('weddingDetails.fields.title') }} *</label>
          <input type="text" v-model="form.title" class="form-input" :placeholder="t('weddingDetails.fields.titlePh')" />
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('weddingDetails.fields.description') }}</label>
          <textarea v-model="form.description" class="form-input form-textarea" :placeholder="t('weddingDetails.fields.descriptionPh')" rows="3"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('weddingDetails.fields.icon') }}</label>
            <select v-model="form.icon" class="form-input">
              <option value="">None</option>
              <option v-for="ic in iconOptions" :key="ic.value" :value="ic.value">{{ ic.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('weddingDetails.fields.displayOrder') }}</label>
            <input type="number" v-model.number="form.displayOrder" class="form-input" min="1" placeholder="1" />
          </div>
        </div>

        <div class="form-group">
          <AuthLocationInput
            :label="t('weddingDetails.fields.location')"
            :placeholder="t('weddingDetails.fields.locationPh')"
            v-model="form.location"
            :pick-on-map-label="t('weddingDetails.fields.pickOnMap')"
            :cancel-label="t('common.cancel')"
            :use-this-location-label="t('weddingDetails.fields.useThisLocation')"
            :search-placeholder="t('weddingDetails.fields.searchPlaces')"
            :locating-label="t('weddingDetails.fields.locateMe')"
            :locating-label-loading="t('weddingDetails.fields.locating')"
          />
        </div>

        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>

      <template #footer>
        <button class="btn-cancel" @click="closeModal">{{ t('common.cancel') }}</button>
        <button class="btn-save" :disabled="saving" @click="saveForm">
          {{ saving ? '...' : t('common.save') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";
import { eventDetailsService } from "@/services/eventDetails.service";
import { eventsService } from "@/services/events.service";
import { invitationImagesService } from "@/services/invitationImages.service.js";
import { onboardingStore } from "@/store/onboarding.store";

const { t } = useI18n();

const iconOptions = [
  { value: "church", label: "Church" },
  { value: "party", label: "Party / Reception" },
  { value: "dresscode", label: "Dress Code" },
  { value: "rings", label: "Rings" },
  { value: "cake", label: "Cake" },
  { value: "music", label: "Music" },
  { value: "gift", label: "Gift / Registry" },
  { value: "hotel", label: "Accommodation" },
  { value: "transport", label: "Transport" },
  { value: "food", label: "Food / Dinner" },
  { value: "photo", label: "Photography" },
  { value: "flowers", label: "Flowers" },
];

const iconMap = {
  church: "⛪", party: "🎉", dresscode: "👔", rings: "💍",
  cake: "🎂", music: "🎵", gift: "🎁", hotel: "🏨",
  transport: "🚗", food: "🍽️", photo: "📷", flowers: "💐",
};

function getMapUrl(loc) {
  if (!loc) return '';
  if (loc.mapUrl) return loc.mapUrl;
  if (loc.latitude != null && loc.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }
  return '';
}

/* ---- data ---- */
const items = ref([]);
const loading = ref(true);

const sorted = computed(() =>
  [...items.value].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
);

async function fetchData() {
  const eventId = onboardingStore.eventId;
  if (!eventId) { loading.value = false; return; }
  loading.value = true;
  try {
    const data = await eventDetailsService.listByEvent(eventId);
    items.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load event details:", e);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

/* ---- hero image ---- */
const heroImageUrl = ref("");
const heroUploading = ref(false);
const heroFileInput = ref(null);

async function fetchHeroImage() {
  const eventId = onboardingStore.eventId;
  if (!eventId) return;
  try {
    const event = await eventsService.getById(eventId);
    heroImageUrl.value = event?.heroImageUrl || "";
  } catch (e) {
    console.error("Failed to load hero image:", e);
  }
}

async function onHeroFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  heroUploading.value = true;
  try {
    const result = await invitationImagesService.uploadHeroImage(onboardingStore.eventId, file);
    heroImageUrl.value = result?.url || "";
  } catch (e) {
    console.error("Failed to upload hero image:", e);
  } finally {
    heroUploading.value = false;
    if (heroFileInput.value) heroFileInput.value.value = "";
  }
}

onMounted(() => {
  fetchData();
  fetchHeroImage();
});

/* ---- modal ---- */
const modalOpen = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref("");

const form = ref({
  title: "", description: "",
  icon: "", displayOrder: 1,
  location: { name: "", address: "", lat: null, lng: null, placeId: null },
});

function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    title: "", description: "",
    icon: "", displayOrder: items.value.length + 1,
    location: { name: "", address: "", lat: null, lng: null, placeId: null },
  };
  formError.value = "";
  modalOpen.value = true;
}

function openEdit(item) {
  isEditing.value = true;
  editingId.value = item.id;
  const loc = item.location;
  form.value = {
    title: item.title || "",
    description: item.description || "",
    icon: item.icon || "",
    displayOrder: item.displayOrder || 1,
    location: loc ? {
      name: loc.venueName || "",
      address: loc.address || "",
      lat: loc.latitude ?? null,
      lng: loc.longitude ?? null,
      placeId: null,
    } : { name: "", address: "", lat: null, lng: null, placeId: null },
  };
  formError.value = "";
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  editingId.value = null;
  formError.value = "";
}

async function saveForm() {
  formError.value = "";
  if (!form.value.title.trim()) { formError.value = t('weddingDetails.errors.titleRequired'); return; }

  saving.value = true;
  const eventId = onboardingStore.eventId;

  const loc = form.value.location;
  const location = (loc?.lat != null && loc?.lng != null) ? {
    venueName: loc.name || "",
    address: loc.address || "",
    latitude: loc.lat,
    longitude: loc.lng,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`,
  } : null;

  const payload = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    icon: form.value.icon || null,
    displayOrder: form.value.displayOrder || 1,
    eventId,
    location,
  };

  try {
    if (isEditing.value) {
      await eventDetailsService.update(editingId.value, payload);
    } else {
      await eventDetailsService.create(payload);
    }
    closeModal();
    await fetchData();
  } catch (e) {
    formError.value = e.message || "Failed to save";
  } finally {
    saving.value = false;
  }
}

async function onDelete(item) {
  if (!window.confirm(`Delete "${item.title}"?`)) return;
  try {
    await eventDetailsService.remove(item.id);
    await fetchData();
  } catch (e) {
    console.error("Failed to delete event detail:", e);
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border: none;
  border-radius: 10px;
  background: var(--brand-main);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-add:hover { filter: brightness(0.95); }

.loading-msg {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  justify-content: center;
  color: var(--neutral-500);
  font-size: 14px;
}
.spinner {
  width: 20px; height: 20px;
  border: 2.5px solid var(--neutral-200);
  border-top-color: var(--brand-main);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 48px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 8px;
}
.empty-icon { color: var(--neutral-400); margin-bottom: 8px; }
.empty-title { font-weight: 700; font-size: 16px; color: var(--neutral-900); margin: 0; }
.empty-sub { font-size: 13px; color: var(--neutral-500); margin: 0 0 8px; }

/* ---- Hero Image ---- */
.hero-image-card {
  background: #fff;
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
}

.hero-image-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.hero-image-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}

.hero-image-desc {
  font-size: 13px;
  color: var(--neutral-500);
  margin: 4px 0 0;
}

.hidden-file {
  display: none;
}

.hero-preview-wrap {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  max-height: 220px;
}

.hero-preview-img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  display: block;
}

.hero-change-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 7px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.hero-change-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.hero-change-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hero-upload-area {
  border: 2px dashed var(--neutral-300, #d1d5db);
  border-radius: 10px;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: var(--neutral-400, #9ca3af);
  transition: border-color 0.2s, color 0.2s;
}

.hero-upload-area:hover {
  border-color: var(--brand-gold, #c8a24d);
  color: var(--brand-gold, #c8a24d);
}

.hero-upload-text {
  font-size: 13px;
  font-weight: 600;
}

.hero-uploading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

/* ---- Cards Grid ---- */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.detail-card {
  background: #fff;
  border: 1px solid var(--neutral-200, #e5e7eb);
  border-radius: 14px;
  padding: 20px;
  transition: box-shadow 0.2s;
}
.detail-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.detail-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.detail-icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--neutral-100, #f3f4f6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.detail-order {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-400);
  flex: 1;
}

.detail-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}
.detail-card:hover .detail-actions { opacity: 1; }

.action-btn {
  width: 30px; height: 30px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--neutral-400);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.action-btn:hover { background: #eff6ff; color: #2563eb; }
.action-btn--delete:hover { background: #fef2f2; color: #dc2626; }

.detail-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 4px;
}

.detail-desc {
  font-size: 13px;
  color: var(--neutral-500);
  margin: 0;
  line-height: 1.5;
}

.detail-location {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.detail-location-name {
  font-size: 12px;
  color: var(--neutral-600, #4b5563);
}
.detail-map-btn {
  font-size: 11px;
  font-weight: 600;
  color: var(--brand-main);
  text-decoration: none;
  padding: 2px 8px;
  border: 1px solid var(--brand-main);
  border-radius: 6px;
  transition: all 0.15s;
}
.detail-map-btn:hover {
  background: var(--brand-main);
  color: #fff;
}

/* ---- Modal Form ---- */
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.form-input {
  padding: 9px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.form-textarea { resize: vertical; font-family: inherit; }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-error {
  padding: 8px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}

.btn-cancel {
  padding: 9px 20px; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #475569; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: #f8fafc; }

.btn-save {
  padding: 9px 20px; border: none; border-radius: 8px;
  background: var(--brand-main); color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-save:hover { filter: brightness(0.95); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
  .details-grid { grid-template-columns: 1fr; }
}
</style>

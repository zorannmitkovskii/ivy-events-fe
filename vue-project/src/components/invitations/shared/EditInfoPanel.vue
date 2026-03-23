<template>
  <div class="info-panel">
    <div class="field">
      <label>{{ t('editSection.brideName') }}</label>
      <input class="input" type="text" v-model="draft.brideName" />
    </div>

    <div class="field">
      <label>{{ t('editSection.groomName') }}</label>
      <input class="input" type="text" v-model="draft.groomName" />
    </div>

    <div class="field">
      <label>{{ t('editSection.weddingDate') }}</label>
      <input class="input" type="date" v-model="draft.date" />
    </div>

    <div class="field">
      <label>{{ t('editSection.venue') }}</label>
      <div v-if="!editingLocation && locationDisplay" class="location-readonly">
        <span class="location-text">{{ locationDisplay }}</span>
        <button type="button" class="edit-location-btn" @click="editingLocation = true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
      <AuthLocationInput
        v-else
        :label="''"
        :placeholder="t('editSection.venue')"
        v-model="draft.location"
        :pick-on-map-label="t('common.pickOnMap')"
        :cancel-label="t('common.cancel')"
        :use-this-location-label="t('common.useThisLocation')"
        :search-placeholder="t('common.searchPlaces')"
        :locating-label="t('common.locateMe')"
        :locating-label-loading="t('common.locating')"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";

const { t } = useI18n();

const props = defineProps({
  brideName: { type: String, default: "" },
  groomName: { type: String, default: "" },
  weddingDate: { type: String, default: "" },
  location: { type: Object, default: () => null },
});

const emit = defineEmits(["change"]);

const draft = reactive({
  brideName: "",
  groomName: "",
  date: "",
  location: { name: "", address: "", lat: null, lng: null, placeId: null },
});

const editingLocation = ref(false);
const isInitializing = ref(true);

const locationDisplay = computed(() => {
  const loc = draft.location;
  return loc.name || loc.address || "";
});

// Init from props
function initFromProps() {
  isInitializing.value = true;
  draft.brideName = props.brideName || "";
  draft.groomName = props.groomName || "";
  draft.date = props.weddingDate || "";
  const loc = props.location;
  draft.location = loc ? {
    name: loc.name || "",
    address: loc.addressLine || loc.address || "",
    lat: loc.latitude ?? loc.lat ?? null,
    lng: loc.longitude ?? loc.lng ?? null,
    placeId: null,
  } : { name: "", address: "", lat: null, lng: null, placeId: null };
  editingLocation.value = false;
  nextTick(() => { isInitializing.value = false; });
}

initFromProps();

// Re-init when props change externally
watch(() => [props.brideName, props.groomName, props.weddingDate, props.location], () => {
  if (!isInitializing.value) {
    // Only re-init if values actually differ (prevent loops)
    const locChanged = props.location && (
      (props.location.name || '') !== draft.location.name ||
      (props.location.addressLine || props.location.address || '') !== draft.location.address
    );
    if (props.brideName !== draft.brideName || props.groomName !== draft.groomName ||
        props.weddingDate !== draft.date || locChanged) {
      initFromProps();
    }
  }
}, { deep: true });

// Switch back to readonly once a real location is picked (has coordinates)
watch(() => draft.location, (loc) => {
  if (editingLocation.value && loc.lat != null && loc.lng != null) {
    editingLocation.value = false;
  }
}, { deep: true });

function emitChange() {
  if (isInitializing.value) return;
  emit("change", {
    brideName: draft.brideName,
    groomName: draft.groomName,
    date: draft.date,
    location: { ...draft.location },
  });
}

watch(draft, () => { emitChange(); }, { deep: true });
</script>

<style scoped>
.info-panel {
  padding: 20px;
  display: grid;
  gap: 14px;
}

.field label {
  font-size: 12px;
  font-weight: 700;
  color: var(--neutral-500, #6b7280);
  display: block;
  margin-bottom: 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.input {
  width: 100%;
  border: 2px solid var(--neutral-300, #d1d5db);
  background: var(--bg-main, #fff);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--brand-main, #1f2937);
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.input:focus {
  border-color: var(--brand-gold, #c8a24d);
}

.location-readonly {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--neutral-300, #d1d5db);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--bg-main, #fff);
}

.location-text {
  flex: 1;
  font-size: 14px;
  color: var(--brand-main, #1f2937);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-location-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--neutral-400, #9ca3af);
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.edit-location-btn:hover {
  color: var(--brand-gold, #c8a24d);
}
</style>

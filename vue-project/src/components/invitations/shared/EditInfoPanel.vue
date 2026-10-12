<template>
  <div class="info-panel">
    <template v-if="titleMode">
      <div class="field">
        <label :for="ids.title">{{ t('onboarding.eventBasics.fields.title') }}</label>
        <input :id="ids.title" class="input" type="text" v-model="draft.brideName" data-info-field="title" :aria-invalid="isInvalid('title')" :aria-describedby="describedBy('title')" />
        <p v-if="isInvalid('title')" :id="errorId('title')" class="field-error" data-testid="info-field-error"><span aria-hidden="true">! </span>{{ t('onboarding.eventBasics.errors.title') }}</p>
      </div>
    </template>
    <template v-else>
      <div class="field">
        <label :for="ids.bride">{{ t('editSection.brideName') }}</label>
        <input :id="ids.bride" class="input" type="text" v-model="draft.brideName" data-info-field="brideName" :aria-invalid="isInvalid('brideName')" :aria-describedby="describedBy('brideName')" />
        <p v-if="isInvalid('brideName')" :id="errorId('brideName')" class="field-error" data-testid="info-field-error"><span aria-hidden="true">! </span>{{ t('onboarding.eventBasics.errors.brideName') }}</p>
      </div>

      <div class="field">
        <label :for="ids.groom">{{ t('editSection.groomName') }}</label>
        <input :id="ids.groom" class="input" type="text" v-model="draft.groomName" data-info-field="groomName" :aria-invalid="isInvalid('groomName')" :aria-describedby="describedBy('groomName')" />
        <p v-if="isInvalid('groomName')" :id="errorId('groomName')" class="field-error" data-testid="info-field-error"><span aria-hidden="true">! </span>{{ t('onboarding.eventBasics.errors.groomName') }}</p>
      </div>
    </template>

    <div class="field-row">
      <div class="field">
        <label :for="ids.date">{{ t('editSection.weddingDate') }}</label>
        <input :id="ids.date" class="input" type="date" v-model="draft.date" data-info-field="date" :aria-invalid="isInvalid('date')" :aria-describedby="describedBy('date')" />
        <p v-if="isInvalid('date')" :id="errorId('date')" class="field-error" data-testid="info-field-error"><span aria-hidden="true">! </span>{{ t('onboarding.eventBasics.errors.date') }}</p>
      </div>
      <div class="field">
        <label :for="ids.time">{{ t('onboarding.eventBasics.fields.time') }}</label>
        <input :id="ids.time" class="input" type="time" v-model="draft.time" data-info-field="time" :aria-invalid="isInvalid('time')" :aria-describedby="describedBy('time')" />
        <p v-if="isInvalid('time')" :id="errorId('time')" class="field-error" data-testid="info-field-error"><span aria-hidden="true">! </span>{{ t('onboarding.eventBasics.errors.time') }}</p>
      </div>
    </div>

    <div class="field">
      <label :for="ids.tz">{{ t('onboarding.eventBasics.fields.timezone') }}</label>
      <select :id="ids.tz" class="input" v-model="draft.timezone" data-info-field="timezone" :aria-invalid="isInvalid('timezone')" :aria-describedby="describedBy('timezone')">
        <option v-for="tz in tzOptions" :key="tz" :value="tz">{{ tz }}</option>
      </select>
      <p v-if="isInvalid('timezone')" :id="errorId('timezone')" class="field-error" data-testid="info-field-error"><span aria-hidden="true">! </span>{{ t('onboarding.eventBasics.errors.timezone') }}</p>
    </div>
    <p v-if="pastInZone" :id="pastId" class="field-warning" role="alert"><span aria-hidden="true">! </span>{{ t('onboarding.eventBasics.errors.past', { timezone: draft.timezone }) }}</p>

    <div class="field" data-info-field="location">
      <label :for="ids.location">{{ t('editSection.venue') }}</label>
      <div v-if="!editingLocation && locationDisplay && draft.location.lat != null" class="location-readonly">
        <span class="location-text">{{ locationDisplay }}</span>
        <button
          type="button"
          class="edit-location-btn"
          :aria-label="`${t('common.edit')}: ${t('editSection.venue')}`"
          :aria-describedby="ids.locationGuide"
          @click="editingLocation = true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      </div>
      <AuthLocationInput
        v-else
        :label="''"
        :input-id="ids.location"
        :described-by="isInvalid('location') ? errorId('location') + ' ' + ids.locationGuide : ids.locationGuide"
        v-model="draft.location"
        :pick-on-map-label="t('common.pickOnMap')"
        :cancel-label="t('common.cancel')"
        :use-this-location-label="t('common.useThisLocation')"
        :search-placeholder="t('common.searchPlaces')"
        :locating-label="t('common.locateMe')"
        :locating-label-loading="t('common.locating')"
      />
      <!-- INV-401: required, what guests see, an example (never the value). -->
      <p v-if="isInvalid('location')" :id="errorId('location')" class="field-error" data-testid="info-field-error"><span aria-hidden="true">! </span>{{ t('onboarding.eventBasics.errors.location') }}</p>
      <FieldGuide
        :id="ids.locationGuide"
        required
        :guests="t('editSection.guide.location.guests')"
        :example="t('editSection.guide.location.example')"
      />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, nextTick, useId } from "vue";
import { useI18n } from "vue-i18n";
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";
import FieldGuide from "@/components/invitations/shared/FieldGuide.vue";
import { DEFAULT_TIMEZONE, isPastInZone, timezoneOptions } from "@/utils/eventBasics";

const { t } = useI18n();

const props = defineProps({
  brideName: { type: String, default: "" },
  groomName: { type: String, default: "" },
  weddingDate: { type: String, default: "" },
  // INV-104: the start time (HH:mm) and the event's zone — the wall clock
  // where the event happens.
  weddingTime: { type: String, default: "" },
  timezone: { type: String, default: DEFAULT_TIMEZONE },
  // A birthday or a conference has a title, not a couple.
  titleMode: { type: Boolean, default: false },
  location: { type: Object, default: () => null },
  // Fields the stepper (INV-102) reports as missing or wrong.
  invalidFields: { type: Array, default: () => [] },
});

const isInvalid = (field) => (props.invalidFields.includes(field) ? "true" : undefined);


const emit = defineEmits(["change"]);

const uid = useId();
const ids = {
  title: `${uid}-title`,
  bride: `${uid}-bride`,
  groom: `${uid}-groom`,
  date: `${uid}-date`,
  time: `${uid}-time`,
  tz: `${uid}-tz`,
  location: `${uid}-location`,
  locationGuide: `${uid}-location-guide`,
};

// INV-503: what is wrong is said under the field and read with it.
const errorId = (field) => `${uid}-${field}-error`;
const pastId = `${uid}-past`;
function describedBy(field) {
  const list = [];
  if (isInvalid(field)) list.push(errorId(field));
  if ((field === "date" || field === "time") && pastInZone.value) list.push(pastId);
  return list.length ? list.join(" ") : undefined;
}

const draft = reactive({
  brideName: "",
  groomName: "",
  date: "",
  time: "",
  timezone: DEFAULT_TIMEZONE,
  location: { name: "", address: "", lat: null, lng: null, placeId: null },
});

const tzOptions = computed(() => timezoneOptions(draft.timezone));

// Checked in the event's zone, not the browser's (INV-104).
const pastInZone = computed(() =>
  !!draft.date && isPastInZone(draft.date, draft.time || "23:59", draft.timezone)
);

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
  draft.time = props.weddingTime || "";
  draft.timezone = props.timezone || DEFAULT_TIMEZONE;
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
watch(() => [props.brideName, props.groomName, props.weddingDate, props.weddingTime, props.timezone, props.location], () => {
  if (!isInitializing.value) {
    // Only re-init if values actually differ (prevent loops)
    const locChanged = props.location && (
      (props.location.name || '') !== draft.location.name ||
      (props.location.addressLine || props.location.address || '') !== draft.location.address
    );
    if (props.brideName !== draft.brideName || props.groomName !== draft.groomName ||
        props.weddingDate !== draft.date || (props.weddingTime || '') !== draft.time ||
        (props.timezone || DEFAULT_TIMEZONE) !== draft.timezone || locChanged) {
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
    groomName: props.titleMode ? "" : draft.groomName,
    date: draft.date,
    time: draft.time,
    timezone: draft.timezone,
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
  color: var(--neutral-500, var(--ink-3));
  display: block;
  margin-bottom: 6px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.input {
  width: 100%;
  border: 2px solid var(--neutral-300, var(--line-2));
  background: var(--bg-main, #fff);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--brand-main, var(--ink));
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field-error {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 600;
  color: #b42318;
}

.input[aria-invalid="true"] {
  border-color: #b42318;
}

.input:focus-visible {
  outline: 3px solid var(--moss, #5e7f58);
  outline-offset: 2px;
}

.field-warning {
  margin: -6px 0 0;
  font-size: 12px;
  color: #b42318;
}

.input:focus {
  border-color: var(--brand-gold, var(--brand-gold));
}

/* Missing or wrong (INV-102): a thicker red edge, not only a colour change. */
.input[aria-invalid='true'] {
  border-color: #b42318;
  border-left-width: 5px;
}

.location-readonly {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--neutral-300, var(--line-2));
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--bg-main, #fff);
}

.location-text {
  flex: 1;
  font-size: 14px;
  color: var(--brand-main, var(--ink));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-location-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--neutral-400, var(--ink-4));
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.edit-location-btn:hover {
  color: var(--brand-gold, var(--brand-gold));
}
</style>

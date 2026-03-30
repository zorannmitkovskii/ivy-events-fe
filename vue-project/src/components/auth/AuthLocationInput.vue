<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>

    <div class="field__control">
      <span class="field__icon" aria-hidden="true">
        <slot name="icon">📍</slot>
      </span>

      <!-- Address input -->
      <input
        ref="addressInputRef"
        class="field__input"
        type="text"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
        autocomplete="off"
      />

      <!-- Open modal to pick on map -->
      <button
        v-if="mapsReady"
        type="button"
        class="field__btn"
        :disabled="disabled"
        @click="openModal = true"
        aria-label="Pick on map"
      >
        <i class="bi bi-geo-alt"></i>
      </button>

      <!-- Custom autocomplete dropdown -->
      <ul
        v-if="showDropdown && predictions.length"
        class="autocomplete-dropdown"
        role="listbox"
      >
        <li
          v-for="(pred, i) in predictions"
          :key="pred.place_id"
          class="autocomplete-item"
          :class="{ 'autocomplete-item--active': i === activeIndex }"
          role="option"
          :aria-selected="i === activeIndex"
          @mousedown.prevent="selectPrediction(pred)"
          @mouseenter="activeIndex = i"
        >
          <i class="bi bi-geo-alt-fill autocomplete-item__icon"></i>
          <div class="autocomplete-item__text">
            <span
              class="autocomplete-item__main"
              v-html="highlightMatch(pred.structured_formatting.main_text, pred.structured_formatting.main_text_matched_substrings)"
            ></span>
            <span
              v-if="pred.structured_formatting.secondary_text"
              class="autocomplete-item__secondary"
            >
              {{ pred.structured_formatting.secondary_text }}
            </span>
          </div>
        </li>
      </ul>
    </div>

    <!-- coords preview -->
    <div v-if="valueObj?.lat != null && valueObj?.lng != null" class="coordinates-display">
      <i class="bi bi-pin-map"></i>
      {{ valueObj.lat.toFixed(6) }}, {{ valueObj.lng.toFixed(6) }}
    </div>
  </label>

  <!-- Map modal -->
  <BaseModal :open="openModal" :title="pickOnMapLabel" @close="openModal = false">
    <div class="map-tools">
      <button class="btn-locate" type="button" @click="locateMe" :disabled="locating">
        <i class="bi bi-crosshair"></i>
        <span>{{ locating ? locatingLabelLoading : locatingLabel }}</span>
      </button>
    </div>

    <div ref="mapRef" class="map"></div>

    <div v-if="temp.lat != null && temp.lng != null" class="selected-coords">
      <strong>{{ selectedLabel }}</strong> {{ temp.address || loadingAddressLabel }}
      <br />
      <small>{{ temp.lat.toFixed(6) }}, {{ temp.lng.toFixed(6) }}</small>
    </div>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="openModal = false">
        {{ cancelLabel }}
      </ButtonMain>
      <ButtonMain variant="main" type="button" @click="applySelection" :disabled="temp.lat == null">
        {{ useThisLocationLabel }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

/**
 * v-model returns object:
 * { name, address, lat, lng, placeId }
 *
 * Emits:
 * - update:modelValue (object)
 * - update:address (string)  (optional convenience)
 * - select (object)
 */
const emit = defineEmits(["update:modelValue", "update:address", "select"]);

const props = defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, default: "" },

  modelValue: {
    type: Object,
    default: () => ({ name: "", address: "", lat: null, lng: null, placeId: null })
  },

  disabled: { type: Boolean, default: false },

  // i18n labels via props
  pickOnMapLabel: { type: String, default: "Pick on map" },
  cancelLabel: { type: String, default: "Cancel" },
  useThisLocationLabel: { type: String, default: "Use this location" },
  searchPlaceholder: { type: String, default: "Search places" },
  locatingLabel: { type: String, default: "Locate me" },
  locatingLabelLoading: { type: String, default: "Locating…" },
  selectedLabel: { type: String, default: "Selected:" },
  loadingAddressLabel: { type: String, default: "Loading address..." },

  // optional config
  types: { type: Array, default: () => [] }, // Places types (empty = all: addresses + establishments)
  country: { type: String, default: "" } // 'mk' etc (componentRestrictions)
});

const addressInputRef = ref(null);
const mapRef = ref(null);
const openModal = ref(false);
const locating = ref(false);

const mapsReady = ref(false);

// Custom autocomplete state
const predictions = ref([]);
const showDropdown = ref(false);
const activeIndex = ref(-1);
let autocompleteService = null;
let placesService = null;
let sessionToken = null;
let debounceTimer = null;

let map = null;
let marker = null;
let geocoder = null;

const valueObj = computed(() => props.modelValue || {});

const displayValue = computed(() => valueObj.value?.address || valueObj.value?.name || "");

// temporary while modal open
const temp = ref({
  name: "",
  address: "",
  lat: null,
  lng: null,
  placeId: null
});

onMounted(async () => {
  mapsReady.value = await loadGoogleMaps();
  // Set initial input value
  if (addressInputRef.value) {
    addressInputRef.value.value = displayValue.value;
  }
  if (mapsReady.value) {
    initServices();
  }
});

onBeforeUnmount(() => {
  clearTimeout(debounceTimer);
});

// Sync input value when modelValue changes externally (e.g. map pick, parent reset)
watch(() => props.modelValue, () => {
  if (!addressInputRef.value) return;
  // Don't overwrite while user is actively typing
  if (document.activeElement === addressInputRef.value) return;
  addressInputRef.value.value = displayValue.value;
}, { deep: true });

watch(openModal, async (val) => {
  if (!val || !mapsReady.value) return;
  await nextTick();

  // initialize modal temp from current value
  temp.value = {
    name: valueObj.value?.name || "",
    address: valueObj.value?.address || "",
    lat: valueObj.value?.lat ?? null,
    lng: valueObj.value?.lng ?? null,
    placeId: valueObj.value?.placeId ?? null
  };

  initMapModal();
});

// ---- Autocomplete logic ----

function initServices() {
  if (!window.google?.maps?.places) return;
  autocompleteService = new window.google.maps.places.AutocompleteService();
  placesService = new window.google.maps.places.PlacesService(document.createElement("div"));
  sessionToken = new window.google.maps.places.AutocompleteSessionToken();
}

function emitValue(obj) {
  const payload = {
    name: obj.name || "",
    address: obj.address || "",
    lat: obj.lat ?? null,
    lng: obj.lng ?? null,
    placeId: obj.placeId ?? null
  };
  emit("update:modelValue", payload);
  emit("update:address", payload.address);
  emit("select", payload);
}

function onInput(e) {
  const query = e.target.value.trim();
  activeIndex.value = -1;

  // Emit raw text so parent stays in sync (coords reset until a place is picked)
  emitValue({
    name: "",
    address: e.target.value,
    lat: null,
    lng: null,
    placeId: null
  });

  clearTimeout(debounceTimer);

  if (!query || query.length < 2 || !autocompleteService) {
    predictions.value = [];
    showDropdown.value = false;
    return;
  }

  debounceTimer = setTimeout(() => fetchPredictions(query), 300);
}

function fetchPredictions(query) {
  if (!autocompleteService) return;

  const request = {
    input: query,
    sessionToken,
  };

  if (props.types.length) request.types = props.types;
  if (props.country) request.componentRestrictions = { country: props.country };

  autocompleteService.getPlacePredictions(request, (results, status) => {
    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
      predictions.value = results;
      showDropdown.value = true;
    } else {
      predictions.value = [];
      showDropdown.value = false;
    }
  });
}

function selectPrediction(pred) {
  if (!placesService) return;

  showDropdown.value = false;
  predictions.value = [];

  placesService.getDetails(
    {
      placeId: pred.place_id,
      fields: ["place_id", "name", "formatted_address", "geometry"],
      sessionToken,
    },
    (place, status) => {
      // New session after each selection (for billing optimization)
      sessionToken = new window.google.maps.places.AutocompleteSessionToken();

      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return;

      const address = place.formatted_address || "";
      let name = "";
      if (place.name && /^[\p{L}\p{N}\s.,\-'()&]+$/u.test(place.name)) {
        name = place.name;
      } else {
        name = address.split(",")[0]?.trim() || address;
      }
      const lat = place.geometry?.location?.lat?.();
      const lng = place.geometry?.location?.lng?.();

      const payload = {
        name,
        address,
        lat: lat ?? null,
        lng: lng ?? null,
        placeId: place.place_id || null,
      };

      emitValue(payload);

      if (addressInputRef.value) {
        addressInputRef.value.value = address;
      }
    }
  );
}

function onFocus() {
  if (predictions.value.length) {
    showDropdown.value = true;
  }
}

function onBlur() {
  setTimeout(() => {
    showDropdown.value = false;
  }, 150);
}

function onKeydown(e) {
  if (!showDropdown.value || !predictions.value.length) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      activeIndex.value = (activeIndex.value + 1) % predictions.value.length;
      break;
    case "ArrowUp":
      e.preventDefault();
      activeIndex.value = activeIndex.value <= 0
        ? predictions.value.length - 1
        : activeIndex.value - 1;
      break;
    case "Enter":
      e.preventDefault();
      if (activeIndex.value >= 0 && activeIndex.value < predictions.value.length) {
        selectPrediction(predictions.value[activeIndex.value]);
      }
      break;
    case "Escape":
      showDropdown.value = false;
      activeIndex.value = -1;
      break;
  }
}

// ---- Highlight helpers ----

function highlightMatch(text, matchedSubstrings) {
  if (!text) return "";
  if (!matchedSubstrings?.length) return escapeHtml(text);

  const sorted = [...matchedSubstrings].sort((a, b) => a.offset - b.offset);
  let result = "";
  let lastIndex = 0;

  for (const { offset, length } of sorted) {
    result += escapeHtml(text.slice(lastIndex, offset));
    result += `<strong>${escapeHtml(text.slice(offset, offset + length))}</strong>`;
    lastIndex = offset + length;
  }
  result += escapeHtml(text.slice(lastIndex));
  return result;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- Map modal logic ----

function initMapModal() {
  if (!window.google?.maps || !mapRef.value) return;

  if (!geocoder) geocoder = new window.google.maps.Geocoder();

  const center = getInitialCenter();

  map = new window.google.maps.Map(mapRef.value, {
    center,
    zoom: 14,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false
  });

  marker = new window.google.maps.Marker({
    position: center,
    map,
    draggable: true
  });

  // set initial temp coords
  temp.value.lat = center.lat;
  temp.value.lng = center.lng;

  // reverse geocode initial
  reverseGeocode(new window.google.maps.LatLng(center.lat, center.lng));

  marker.addListener("dragend", () => {
    const pos = marker.getPosition();
    temp.value.lat = pos.lat();
    temp.value.lng = pos.lng();
    reverseGeocode(pos);
  });

  map.addListener("click", (e) => {
    marker.setPosition(e.latLng);
    temp.value.lat = e.latLng.lat();
    temp.value.lng = e.latLng.lng();
    reverseGeocode(e.latLng);
  });
}

function getInitialCenter() {
  if (valueObj.value?.lat != null && valueObj.value?.lng != null) {
    return { lat: valueObj.value.lat, lng: valueObj.value.lng };
  }
  // default Skopje
  return { lat: 41.9981, lng: 21.4254 };
}

function reverseGeocode(latLng) {
  if (!geocoder || !latLng) return;

  geocoder.geocode({ location: latLng }, (res, status) => {
    if (status === "OK" && res?.length) {
      // Prefer results that are not Plus Codes
      const preferred = res.find(r => !r.types?.includes("plus_code")) || res[0];
      temp.value.address = preferred.formatted_address;
      // name often not available from reverse geocode -> keep existing
      if (!temp.value.name) temp.value.name = temp.value.address;
    }
  });
}

async function locateMe() {
  if (!navigator.geolocation || !window.google?.maps) return;

  locating.value = true;
  try {
    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000
      });
    });

    const loc = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
    map?.panTo(loc);
    map?.setZoom(15);
    marker?.setPosition(loc);

    temp.value.lat = loc.lat();
    temp.value.lng = loc.lng();

    reverseGeocode(loc);
  } catch (e) {
    console.warn("Geolocation error:", e);
  } finally {
    locating.value = false;
  }
}

function applySelection() {
  if (temp.value.lat == null) return;
  emitValue({ ...temp.value });
  openModal.value = false;
}

// ---- Google Maps loader (single) ----
let mapsLoaderPromise;
function loadGoogleMaps() {
  if (window.google?.maps?.places) return Promise.resolve(true);
  if (mapsLoaderPromise) return mapsLoaderPromise;

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    console.warn("Google Maps API key missing. Autocomplete disabled.");
    return Promise.resolve(false);
  }

  mapsLoaderPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[data-gmaps="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(!!window.google?.maps?.places));
      return;
    }

    const script = document.createElement("script");
    script.dataset.gmaps = "1";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    script.onload = () => resolve(!!window.google?.maps?.places);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return mapsLoaderPromise;
}
</script>

<style scoped>
.field { display: grid; gap: 8px; }
.field__label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(51, 67, 56, 0.75);
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid var(--neutral-300);
  border-radius: 12px;
  background: color-mix(in srgb, var(--bg-main) 30%, transparent);
}

.field__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--bg-dark-gray);
}

.field__input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 12px 132px 12px 44px;
  font-size: 14px;
  color: var(--neutral-900);
}

.field__btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  border: 1px solid var(--neutral-300);
  background: #ffffff;
  color: var(--brand-main);
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.coordinates-display {
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(147, 162, 154, 0.08);
  border-radius: 6px;
  width: fit-content;
}

/* ---- Custom autocomplete dropdown ---- */
.autocomplete-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid var(--neutral-300);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  list-style: none;
  margin: 0;
  padding: 4px;
  max-height: 320px;
  overflow-y: auto;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}

.autocomplete-item--active {
  background: rgba(147, 162, 154, 0.1);
}

.autocomplete-item__icon {
  color: var(--brand-main, #5a7d65);
  font-size: 16px;
  flex-shrink: 0;
  opacity: 0.7;
}

.autocomplete-item--active .autocomplete-item__icon {
  opacity: 1;
}

.autocomplete-item__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.autocomplete-item__main {
  font-size: 14px;
  color: var(--neutral-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.autocomplete-item__secondary {
  font-size: 12px;
  color: rgba(51, 67, 56, 0.55);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---- Map modal ---- */
.map { width: 100%; height: 360px; border-radius: 12px; border: 1px solid var(--neutral-300); }

.map-tools { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }

.btn-locate {
  border: 1px solid var(--neutral-300);
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  cursor: pointer;
}

.selected-coords {
  margin-top: 10px;
  padding: 10px;
  background: rgba(147, 162, 154, 0.08);
  border-radius: 8px;
  font-size: 13px;
}
</style>

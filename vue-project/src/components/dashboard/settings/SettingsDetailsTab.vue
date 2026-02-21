<template>
  <div v-if="form">
    <!-- Event Details -->
    <div class="s-card">
      <h2 class="section-title">{{ t("settings.eventDetails") }}</h2>

      <div class="details-grid">
        <div class="detail-row">
          <label class="detail-label" for="s-name">{{ t("settings.eventName") }}</label>
          <input id="s-name" v-model="form.name" type="text" class="detail-input" />
        </div>

        <div class="detail-row">
          <label class="detail-label" for="s-date">{{ t("settings.eventDate") }}</label>
          <input id="s-date" v-model="form.date" type="date" class="detail-input" />
        </div>

        <div class="detail-row detail-row--full">
          <label class="detail-label">{{ t("settings.eventLocation") }}</label>
          <div class="location-input-wrap">
            <AuthLocationInput
              v-model="form.locationObj"
              :label="''"
              :placeholder="t('settings.locationPh') || 'Search for a venue or address...'"
              :types="[]"
              :pickOnMapLabel="t('common.pickOnMap') || 'Pick on map'"
              :cancelLabel="t('common.cancel')"
              :useThisLocationLabel="t('common.useThisLocation') || 'Use this location'"
              :searchPlaceholder="t('common.searchPlaces') || 'Search places'"
              :locatingLabel="t('common.locateMe') || 'Locate me'"
              :locatingLabelLoading="t('common.locating') || 'Locating...'"
              :selectedLabel="t('common.selected') || 'Selected:'"
              :loadingAddressLabel="t('common.loadingAddress') || 'Loading address...'"
            />
          </div>
        </div>

        <div class="detail-row">
          <label class="detail-label" for="s-category">{{ t("settings.eventCategory") }}</label>
          <input id="s-category" v-model="form.category" type="text" class="detail-input" readonly />
        </div>

        <div class="detail-row">
          <label class="detail-label" for="s-lang">{{ t("settings.language") }}</label>
          <select id="s-lang" v-model="form.lang" class="detail-input detail-select">
            <option value="mk">Македонски</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Display Options -->
    <div class="s-card">
      <h2 class="section-title">{{ t("settings.displayOptions") }}</h2>

      <div class="toggle-grid">
        <div class="toggle-row">
          <span class="toggle-label">{{ t("settings.showAgenda") }}</span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.showAgenda" />
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="toggle-row">
          <span class="toggle-label">{{ t("settings.showOurStory") }}</span>
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.showOurStory" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    </div>

    <!-- Change Invitation -->
    <div class="s-card">
      <ButtonMain variant="main" @click="$emit('go-invitations')">
        {{ t("settings.changeInvitation") }}
      </ButtonMain>
    </div>

    <!-- Danger Zone -->
    <div class="s-card danger-card">
      <h2 class="section-title danger-title">{{ t("settings.dangerZone") }}</h2>
      <p class="section-desc">{{ t("settings.archiveDesc") }}</p>
      <ButtonMain variant="danger" @click="$emit('archive')">
        {{ t("settings.archiveEvent") }}
      </ButtonMain>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";

const { t } = useI18n();

defineProps({
  form: { type: Object, default: null },
  isGallery: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
});

defineEmits(["save", "archive", "go-invitations", "go-packages"]);
</script>

<style scoped>
.s-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 24px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0 0 4px;
}

.section-desc {
  font-size: 13px;
  color: var(--neutral-500);
  margin: 0 0 16px;
}

.details-grid {
  display: grid;
  gap: 0;
  margin-top: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.detail-row:last-child { border-bottom: none; }

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-500);
  flex-shrink: 0;
  margin-right: 16px;
}

.detail-input {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-900);
  background: var(--bg-main, #f8f6f1);
  border: 1px solid var(--neutral-300, #ddd);
  border-radius: var(--radius-md, 8px);
  padding: 8px 12px;
  width: 280px;
  max-width: 100%;
  transition: border-color 0.15s ease;
}
.detail-input:focus {
  outline: none;
  border-color: var(--brand-gold, #C8A24D);
  box-shadow: 0 0 0 2px rgba(200, 162, 77, 0.15);
}
.detail-input[readonly] { opacity: 0.6; cursor: default; }
.detail-select { cursor: pointer; appearance: auto; }

.detail-row--full {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.detail-row--full .location-input-wrap,
.location-input-wrap { width: 100%; }

.toggle-grid { margin-top: 16px; display: grid; gap: 0; }
.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.toggle-row:last-child { border-bottom: none; }

.toggle-label { font-size: 14px; font-weight: 600; color: var(--neutral-700); }

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--neutral-300, #ccc);
  border-radius: 24px;
  transition: background 0.2s ease;
}
.toggle-slider::before {
  content: "";
  position: absolute;
  width: 18px; height: 18px;
  left: 3px; bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s ease;
}
.toggle-switch input:checked + .toggle-slider { background: var(--brand-gold, #C8A24D); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

.danger-card { border-left: 4px solid var(--error); }
.danger-title { color: var(--error); }

@media (max-width: 640px) {
  .s-card { padding: 18px 16px; }
  .detail-row { flex-direction: column; align-items: flex-start; gap: 6px; }
  .detail-input { width: 100%; }
}
</style>

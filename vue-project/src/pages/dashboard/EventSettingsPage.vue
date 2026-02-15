<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <div>
        <h1 class="dash-page-title">{{ t("settings.title") }}</h1>
        <p class="dash-page-subtitle">{{ t("settings.subtitle") }}</p>
      </div>
      <div v-if="event && !loading" class="header-actions">
        <CpayButton
          :event-id="eventId"
          variant="gold"
          :label="t('cpay.upgrade')"
        />
        <ButtonMain
          variant="main"
          :disabled="saving"
          @click="saveEvent"
        >
          {{ saving ? t("settings.saving") : t("settings.save") }}
        </ButtonMain>
      </div>
    </div>

    <!-- Save feedback -->
    <div v-if="saveSuccess" class="save-toast success-toast">
      <i class="bi bi-check-circle-fill"></i> {{ t("settings.saved") }}
    </div>
    <div v-if="saveError" class="save-toast error-toast">
      <i class="bi bi-exclamation-circle-fill"></i> {{ saveError }}
    </div>

    <div v-if="loading" class="s-card s-card-pad">
      {{ t("settings.loading") }}
    </div>

    <div v-else-if="error" class="s-card s-card-pad">
      <div class="empty-title">{{ t("settings.errorTitle") }}</div>
      <div class="empty-sub">{{ error }}</div>
      <div style="margin-top: 12px">
        <ButtonMain variant="main" @click="loadEvent">{{ t("settings.retry") }}</ButtonMain>
      </div>
    </div>

    <template v-else-if="form">
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

          <div class="detail-row">
            <label class="detail-label" for="s-location">{{ t("settings.eventLocation") }}</label>
            <input id="s-location" v-model="form.location" type="text" class="detail-input" />
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

      <!-- Links & Sharing -->
      <div class="s-card">
        <h2 class="section-title">{{ t("settings.linksAndSharing") }}</h2>
        <p class="section-desc">{{ t("settings.invitationLinkDesc") }}</p>

        <!-- Invitation URL -->
        <div class="url-group">
          <span class="url-label">{{ t("settings.invitationLink") }}</span>
          <div class="url-box">
            <span class="url-text">{{ form.invitationUrl || t("settings.noInvitationUrl") }}</span>
            <button
              v-if="form.invitationUrl"
              class="copy-btn"
              type="button"
              @click="copyToClipboard(form.invitationUrl, 'invitation')"
            >
              <i :class="copiedField === 'invitation' ? 'bi bi-check-lg' : 'bi bi-clipboard'"></i>
              {{ copiedField === 'invitation' ? t("settings.copied") : t("settings.copy") }}
            </button>
          </div>
        </div>

        <!-- Private Invitation URL -->
        <div class="url-group">
          <span class="url-label">{{ t("settings.privateInvitationUrl") }}</span>
          <div class="url-box">
            <span class="url-text">{{ form.privateInvitationUrl || "—" }}</span>
            <button
              v-if="form.privateInvitationUrl"
              class="copy-btn"
              type="button"
              @click="copyToClipboard(form.privateInvitationUrl, 'private')"
            >
              <i :class="copiedField === 'private' ? 'bi bi-check-lg' : 'bi bi-clipboard'"></i>
              {{ copiedField === 'private' ? t("settings.copied") : t("settings.copy") }}
            </button>
          </div>
        </div>

        <!-- Gallery URL -->
        <div class="url-group">
          <span class="url-label">{{ t("settings.galleryUrl") }}</span>
          <p class="url-hint">{{ t("settings.galleryUrlDesc") }}</p>
          <div class="url-box">
            <span class="url-text">{{ form.galleryUrl || "—" }}</span>
            <button
              v-if="form.galleryUrl"
              class="copy-btn"
              type="button"
              @click="copyToClipboard(form.galleryUrl, 'gallery')"
            >
              <i :class="copiedField === 'gallery' ? 'bi bi-check-lg' : 'bi bi-clipboard'"></i>
              {{ copiedField === 'gallery' ? t("settings.copied") : t("settings.copy") }}
            </button>
          </div>
        </div>

        <div class="invitation-actions">
          <ButtonMain variant="main" @click="goToInvitations">
            {{ t("settings.changeInvitation") }}
          </ButtonMain>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="s-card danger-card">
        <h2 class="section-title danger-title">{{ t("settings.dangerZone") }}</h2>
        <p class="section-desc">{{ t("settings.archiveDesc") }}</p>
        <ButtonMain variant="danger" @click="archiveEvent">
          {{ t("settings.archiveEvent") }}
        </ButtonMain>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { eventsService } from "@/services/events.service";
import { onboardingStore, setSelectedCategory } from "@/store/onboarding.store";
import { EventCategoryEnum } from "@/enums/EventCategory";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import CpayButton from "@/components/payment/CpayButton.vue";

const { t, locale } = useI18n();
const router = useRouter();

const event = ref(null);
const form = ref(null);
const loading = ref(false);
const error = ref(null);
const saving = ref(false);
const saveSuccess = ref(false);
const saveError = ref(null);
const copiedField = ref(null);

const eventId = ref(onboardingStore.eventId);

function buildForm(ev) {
  return {
    name: ev.name || "",
    date: formatDateForInput(ev.date || ev.eventDate),
    location: ev.location || "",
    category: ev.categoryType || ev.category || "",
    lang: ev.lang || locale.value || "mk",
    showAgenda: ev.showAgenda ?? true,
    showOurStory: ev.showOurStory ?? true,
    invitationUrl: ev.invitationUrl || "",
    privateInvitationUrl: ev.privateInvitationUrl || "",
    galleryUrl: ev.galleryUrl || ""
  };
}

function formatDateForInput(raw) {
  if (!raw) return "";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toISOString().split("T")[0];
  } catch {
    return raw;
  }
}

async function loadEvent() {
  loading.value = true;
  error.value = null;

  try {
    if (eventId.value === "demo") {
      const demo = {
        id: "demo",
        name: "The Annual Gala",
        date: "2024-10-24",
        location: "Grand Ballroom, Skopje",
        category: "Weddings",
        lang: "mk",
        showAgenda: true,
        showOurStory: true,
        invitationUrl: `${window.location.origin}/${locale.value}/invitations/sunset-glass?event=demo`,
        privateInvitationUrl: "",
        galleryUrl: `${window.location.origin}/${locale.value}/gallery?eventId=demo`
      };
      event.value = demo;
      form.value = buildForm(demo);
      return;
    }

    const data = await eventsService.getById(eventId.value);
    event.value = data;
    form.value = buildForm(data);

    const cat = data?.categoryType || data?.category || "";
    if (cat) {
      const upper = cat.toUpperCase().replace(/\s+/g, "_");
      const match = Object.values(EventCategoryEnum).find(v => v === upper);
      setSelectedCategory(match || cat);
    }
  } catch (e) {
    error.value = e?.message || "Failed to load event";
  } finally {
    loading.value = false;
  }
}

async function saveEvent() {
  if (!form.value || saving.value) return;
  saving.value = true;
  saveSuccess.value = false;
  saveError.value = null;

  try {
    const payload = {
      name: form.value.name,
      date: form.value.date,
      location: form.value.location,
      lang: form.value.lang,
      showAgenda: form.value.showAgenda,
      showOurStory: form.value.showOurStory
    };

    await eventsService.update(eventId.value, payload);
    saveSuccess.value = true;
    setTimeout(() => { saveSuccess.value = false; }, 3000);
  } catch (e) {
    saveError.value = e?.message || t("settings.saveError");
    setTimeout(() => { saveError.value = null; }, 4000);
  } finally {
    saving.value = false;
  }
}

async function copyToClipboard(text, field) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  copiedField.value = field;
  setTimeout(() => { copiedField.value = null; }, 2000);
}

function goToInvitations() {
  router.push({ name: "EventInvitationsPage", params: { lang: locale.value } });
}

function archiveEvent() {
  console.log("Archive event", eventId.value);
}

onMounted(loadEvent);
</script>

<style scoped>
/* Page header override for save button */
.dash-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* Cards */
.s-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 24px;
}

.s-card-pad {
  padding: 20px 24px;
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

/* Details grid */
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

.detail-row:last-child {
  border-bottom: none;
}

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

.detail-input[readonly] {
  opacity: 0.6;
  cursor: default;
}

.detail-select {
  cursor: pointer;
  appearance: auto;
}

/* Toggle rows */
.toggle-grid {
  margin-top: 16px;
  display: grid;
  gap: 0;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.toggle-row:last-child {
  border-bottom: none;
}

.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-700);
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

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
  width: 18px;
  height: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--brand-gold, #C8A24D);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* URL sections */
.url-group {
  margin-bottom: 16px;
}

.url-group:last-of-type {
  margin-bottom: 0;
}

.url-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-500);
  margin-bottom: 6px;
}

.url-hint {
  font-size: 12px;
  color: var(--neutral-400);
  margin: 0 0 6px;
}

.url-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-main);
  border: 1px solid var(--neutral-300);
  border-radius: var(--radius-md);
}

.url-text {
  flex: 1;
  font-size: 13px;
  color: var(--neutral-900);
  word-break: break-all;
  font-family: monospace;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--neutral-300);
  background: #fff;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-main);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.copy-btn:hover {
  border-color: var(--brand-gold);
  background: rgba(200, 162, 77, 0.06);
}

.invitation-actions {
  margin-top: 16px;
}

/* Danger zone */
.danger-card {
  border-left: 4px solid var(--error);
}

.danger-title {
  color: var(--error);
}

/* Save toast */
.save-toast {
  padding: 12px 16px;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.success-toast {
  background: #e8f5e9;
  color: #2e7d32;
}

.error-toast {
  background: #fce4ec;
  color: #c62828;
}

/* Empty / error states */
.empty-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--neutral-900);
}

.empty-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--neutral-500);
}

/* Responsive */
@media (max-width: 640px) {
  .dash-page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .s-card {
    padding: 18px 16px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .detail-input {
    width: 100%;
  }

  .url-box {
    flex-direction: column;
    align-items: stretch;
  }

  .copy-btn {
    justify-content: center;
  }
}
</style>

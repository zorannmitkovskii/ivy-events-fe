<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <div>
        <h1 class="dash-page-title">{{ t("settings.title") }}</h1>
        <p class="dash-page-subtitle">{{ t("settings.subtitle") }}</p>
      </div>
      <div v-if="event && !loading && !isGallery && activeTab === 'details'" class="header-actions">
        <ButtonMain
          variant="gold"
          @click="goToPackages"
        >
          {{ t('cpay.upgrade') }}
        </ButtonMain>
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
      <!-- Tab Navigation -->
      <div v-if="!isGallery" class="tabs-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <SettingsDetailsTab
        v-if="activeTab === 'details'"
        :form="form"
        :is-gallery="isGallery"
        :saving="saving"
        @save="saveEvent"
        @archive="archiveEvent"
        @go-invitations="goToInvitations"
        @go-packages="goToPackages"
      />

      <SettingsAgendaTab v-if="activeTab === 'agenda'" />

      <SettingsOurStoryTab v-if="activeTab === 'ourStory'" />

      <SettingsGalleryTab v-if="activeTab === 'gallery'" />

      <SettingsCollageTab v-if="activeTab === 'collage'" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { eventsService } from "@/services/events.service";
import { onboardingStore, setSelectedCategory } from "@/store/onboarding.store";
import { EventCategoryEnum } from "@/enums/EventCategory";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import SettingsDetailsTab from "@/components/dashboard/settings/SettingsDetailsTab.vue";
import SettingsAgendaTab from "@/components/dashboard/settings/SettingsAgendaTab.vue";
import SettingsOurStoryTab from "@/components/dashboard/settings/SettingsOurStoryTab.vue";
import SettingsGalleryTab from "@/components/dashboard/settings/SettingsGalleryTab.vue";
import SettingsCollageTab from "@/components/dashboard/settings/SettingsCollageTab.vue";

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();

const event = ref(null);
const form = ref(null);
const loading = ref(false);
const error = ref(null);
const saving = ref(false);
const saveSuccess = ref(false);
const saveError = ref(null);

const eventId = ref(onboardingStore.eventId);

const isGallery = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY);

const activeTab = ref(route.query.tab || "details");

const tabs = computed(() => [
  { key: "details", label: t("settings.tabs.details") },
  { key: "agenda", label: t("settings.tabs.agenda") },
  { key: "ourStory", label: t("settings.tabs.ourStory") },
  { key: "gallery", label: t("settings.tabs.gallery") },
  { key: "collage", label: t("settings.tabs.collage") },
]);

function buildForm(ev) {
  const loc = ev.location || {};
  const isObj = typeof loc === "object" && loc !== null;

  return {
    name: ev.name || "",
    date: formatDateForInput(ev.date || ev.eventDate),
    category: ev.categoryType || ev.category || "",
    lang: ev.lang || locale.value || "mk",
    showAgenda: ev.showAgenda ?? true,
    showOurStory: ev.showOurStory ?? true,
    invitationUrl: ev.invitationUrl || "",
    galleryUrl: ev.galleryUrl || "",
    locationObj: {
      name: isObj ? (loc.name || "") : (typeof loc === "string" ? loc : ""),
      address: isObj ? (loc.addressLine || "") : "",
      lat: isObj ? (loc.latitude ?? null) : null,
      lng: isObj ? (loc.longitude ?? null) : null,
      placeId: null,
    },
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
    const loc = form.value.locationObj || {};
    const hasLocation = loc.address || loc.name || loc.lat != null;

    const payload = {
      name: form.value.name,
      date: form.value.date,
      location: hasLocation ? {
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
      } : null,
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

function goToPackages() {
  router.push({ name: "dashboard.packages", params: { lang: locale.value } });
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

/* Tabs */
.tabs-bar {
  display: flex;
  gap: 4px;
  background: #fff;
  border-radius: var(--radius-lg, 16px);
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 4px;
  overflow-x: auto;
}

.tab-btn {
  padding: 10px 18px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-500);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--neutral-700);
  background: rgba(0, 0, 0, 0.04);
}

.tab-btn.active {
  color: var(--brand-main, #2f3e36);
  background: var(--bg-main, #f8f6f1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
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

@media (max-width: 640px) {
  .dash-page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .s-card {
    padding: 18px 16px;
  }

  .tabs-bar {
    gap: 2px;
    padding: 3px;
  }

  .tab-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>

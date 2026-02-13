<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t("settings.title") }}</h1>
      <p class="dash-page-subtitle">{{ t("settings.subtitle") }}</p>
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

    <template v-else-if="event">
      <!-- Event Details -->
      <div class="s-card">
        <h2 class="section-title">{{ t("settings.eventDetails") }}</h2>

        <div class="details-grid">
          <div class="detail-row">
            <span class="detail-label">{{ t("settings.eventName") }}</span>
            <span class="detail-value">{{ event.name || "—" }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">{{ t("settings.eventDate") }}</span>
            <span class="detail-value">{{ formattedDate || "—" }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">{{ t("settings.eventLocation") }}</span>
            <span class="detail-value">{{ event.location || "—" }}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">{{ t("settings.eventCategory") }}</span>
            <span class="detail-value">{{ event.category || "—" }}</span>
          </div>
        </div>
      </div>

      <!-- Invitation URL -->
      <div class="s-card">
        <h2 class="section-title">{{ t("settings.invitationLink") }}</h2>
        <p class="section-desc">{{ t("settings.invitationLinkDesc") }}</p>

        <div class="url-box">
          <span class="url-text">{{ event.invitationUrl || t("settings.noInvitationUrl") }}</span>
          <button
            v-if="event.invitationUrl"
            class="copy-btn"
            type="button"
            @click="copyUrl"
          >
            <i :class="copied ? 'bi bi-check-lg' : 'bi bi-clipboard'"></i>
            {{ copied ? t("settings.copied") : t("settings.copy") }}
          </button>
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { eventsService } from "@/services/events.service";
import { onboardingStore, setSelectedCategory } from "@/store/onboarding.store";
import { EventCategoryEnum } from "@/enums/EventCategory";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t, locale } = useI18n();
const router = useRouter();

const event = ref(null);
const loading = ref(false);
const error = ref(null);
const copied = ref(false);

const eventId = computed(() => onboardingStore.eventId);

const formattedDate = computed(() => {
  if (!event.value?.date && !event.value?.eventDate) return null;
  const raw = event.value.date || event.value.eventDate;
  try {
    return new Date(raw).toLocaleDateString(locale.value === "mk" ? "mk-MK" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return raw;
  }
});

async function loadEvent() {
  loading.value = true;
  error.value = null;

  try {
    if (eventId.value === "demo") {
      event.value = {
        id: "demo",
        name: "The Annual Gala",
        date: "2024-10-24",
        location: "Grand Ballroom, Skopje",
        category: "Weddings",
        invitationUrl: `${window.location.origin}/${locale.value}/invitations/sunset-glass?event=demo`
      };
      return;
    }

    event.value = await eventsService.getById(eventId.value);
    const cat = event.value?.categoryType || event.value?.category || "";
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

async function copyUrl() {
  if (!event.value?.invitationUrl) return;
  try {
    await navigator.clipboard.writeText(event.value.invitationUrl);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = event.value.invitationUrl;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
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
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-900);
}

/* Invitation URL */
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
  .s-card {
    padding: 18px 16px;
  }

  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
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

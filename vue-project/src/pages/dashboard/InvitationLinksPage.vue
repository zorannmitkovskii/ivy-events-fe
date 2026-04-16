<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <div>
        <div class="page-eyebrow">{{ t("sidebar.navigation") }}</div>
        <h1 class="dash-page-title">{{ t("invitationLinks.title") }}</h1>
        <p class="dash-page-subtitle">{{ t("invitationLinks.subtitle") }}</p>
      </div>
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
      <!-- Edit invitation button -->
      <div v-if="editInvitationUrl" class="edit-inv-bar">
        <ButtonMain variant="main" @click="openEditInvitation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          {{ t('invitationLinks.editInvitation') || 'Уреди покана' }}
        </ButtonMain>
      </div>

      <!-- Inactive banner -->
      <div v-if="isInactive" class="inactive-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ t('invitationLinks.activateToShare') }}
      </div>

      <div v-else class="links-grid">
        <!-- Regular Invitation (hidden for Gallery) -->
        <LinkCard
          v-if="!isGallery"
          :title="t('invitationLinks.regular')"
          :description="t('invitationLinks.regularDesc')"
          :url="event.invitationUrl || ''"
          qr-file-name="invitation-qr-code.png"
        />

        <!-- Close Friends (hidden for Gallery) -->
        <LinkCard
          v-if="!isGallery"
          :title="t('invitationLinks.closeFriends')"
          :description="t('invitationLinks.closeFriendsDesc')"
          :url="closeFriendsUrl"
          qr-file-name="close-friends-qr-code.png"
        />

        <!-- Gallery Upload -->
        <LinkCard
          :title="t('invitationLinks.gallery')"
          :description="t('invitationLinks.galleryDesc')"
          :url="event.galleryUrl || ''"
          qr-file-name="gallery-qr-code.png"
        />

        <!-- Table Lookup (hidden for Gallery) -->
        <LinkCard
          v-if="!isGallery"
          :title="t('invitationLinks.tableLookup')"
          :description="t('invitationLinks.tableLookupDesc')"
          :url="tableLookupUrl"
          qr-file-name="table-lookup-qr-code.png"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { eventsService } from "@/services/events.service";
import { onboardingStore, setSelectedCategory } from "@/store/onboarding.store";
import { EventCategoryEnum } from "@/enums/EventCategory";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import LinkCard from "@/components/dashboard/settings/LinkCard.vue";
import { getErrorMessage } from "@/services/apiError";

const { t, locale } = useI18n();

const event = ref(null);
const loading = ref(false);
const error = ref(null);

const eventId = ref(onboardingStore.eventId);

const isGallery = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY);
const isInactive = computed(() => {
  const s = event.value?.status || onboardingStore.eventStatus || '';
  return s !== 'ACTIVATED';
});

const closeFriendsUrl = computed(() => {
  if (event.value?.privateInvitationUrl) return event.value.privateInvitationUrl;
  const url = event.value?.invitationUrl;
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}isPrivate=true`;
});

const editInvitationUrl = computed(() => {
  if (!event.value?.invitationUrl) return '';
  const url = event.value.invitationUrl;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}edit=true`;
});

function openEditInvitation() {
  if (editInvitationUrl.value) {
    window.open(editInvitationUrl.value, '_blank');
  }
}

const tableLookupUrl = computed(() => {
  if (!eventId.value) return "";
  return `${window.location.origin}/${locale.value}/table-lookup?eventId=${eventId.value}`;
});

async function loadEvent() {
  loading.value = true;
  error.value = null;

  try {
    if (eventId.value === "demo") {
      event.value = {
        id: "demo",
        invitationUrl: `${window.location.origin}/${locale.value}/invitations/coastal-breeze?event=demo`,
        galleryUrl: `${window.location.origin}/${locale.value}/gallery?eventId=demo`,
        categoryType: "WEDDINGS",
      };
      return;
    }

    const res = await eventsService.getById(eventId.value);
    const data = res?.data || res;
    const inv = data?.invitation || {};
    event.value = {
      ...data,
      invitationUrl: inv.invitationUrl || data.invitationUrl || '',
      galleryUrl: inv.galleryUrl || data.galleryUrl || '',
      privateInvitationUrl: inv.privateInvitationUrl || data.privateInvitationUrl || '',
      invitationName: inv.invitationName || '',
    };

    const cat = data?.categoryType || data?.category || "";
    if (cat) {
      const upper = cat.toUpperCase().replace(/\s+/g, "_");
      const match = Object.values(EventCategoryEnum).find(v => v === upper);
      setSelectedCategory(match || cat);
    }
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    loading.value = false;
  }
}

onMounted(loadEvent);
</script>

<style scoped>
.edit-inv-bar {
  margin-bottom: 16px;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

.s-card {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
  padding: 24px;
}

.s-card-pad {
  padding: 20px 24px;
}

.empty-title {
  font-family: 'Playfair Display', serif;
  font-weight: 400;
  font-size: 18px;
  color: var(--dash-charcoal);
}

.empty-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--dash-muted);
}

.inactive-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  background: var(--dash-cream-card);
  border: 1.5px dashed var(--dash-cream-border);
  border-radius: var(--dash-radius);
  font-size: 14px;
  color: var(--dash-muted);
  text-align: center;
  justify-content: center;
}

@media (max-width: 640px) {
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>

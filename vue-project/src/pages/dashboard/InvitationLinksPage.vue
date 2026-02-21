<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <div>
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
      <div class="links-grid">
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

const { t, locale } = useI18n();

const event = ref(null);
const loading = ref(false);
const error = ref(null);

const eventId = ref(onboardingStore.eventId);

const isGallery = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY);

const closeFriendsUrl = computed(() => {
  const url = event.value?.invitationUrl;
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}isPrivate=true`;
});

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
        invitationUrl: `${window.location.origin}/${locale.value}/invitations/sunset-glass?event=demo`,
        galleryUrl: `${window.location.origin}/${locale.value}/gallery?eventId=demo`,
        categoryType: "WEDDINGS",
      };
      return;
    }

    const data = await eventsService.getById(eventId.value);
    event.value = data;

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

onMounted(loadEvent);
</script>

<style scoped>
.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

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
  .links-grid {
    grid-template-columns: 1fr;
  }
}
</style>

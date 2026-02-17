<template>
  <main class="invitations-page">
    <!-- Fixed header -->
    <header class="sticky-header">
      <div class="header-inner">
        <button class="back-btn" @click="onBack" :disabled="loading" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="header-center">
          <h1 class="header-title">{{ $t('onboarding.invitations.title') }}</h1>
          <p class="header-subtitle">{{ $t('onboarding.invitations.subtitle') }}</p>
        </div>

        <ButtonMain
          :label="$t('onboarding.invitations.continue')"
          variant="main"
          :disabled="!onboardingStore.invitationName || loading"
          :loading="loading"
          @click="onContinue"
        />
      </div>
    </header>

    <!-- Scrollable content -->
    <div class="content">
      <CategoryFilterBar
        :categories="categoryOptions"
        :model-value="displayCategory"
        :disabled="true"
      />

      <InvitationGrid
        class="grid-section"
        :invitations="filteredInvitations"
        :selected-id="onboardingStore.invitationName"
        :empty-message="$t('onboarding.invitations.emptyState')"
        @select="onSelectInvitation"
        @preview="onPreview"
      />

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <OnboardingFooterLinks />
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CategoryFilterBar from '@/components/onboarding/CategoryFilterBar.vue';
import InvitationGrid from '@/components/onboarding/InvitationGrid.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import OnboardingFooterLinks from '@/components/onboarding/OnboardingFooterLinks.vue';
import { onboardingStore, setInvitationName } from '@/store/onboarding.store';
import { eventsService } from '@/services/events.service';
import { isAuthenticated } from '@/services/auth.service';
import { EventCategoryEnum } from '@/enums/EventCategory';
import { INVITATION_REGISTRY } from '@/data/invitationRegistry';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');

const loading = ref(false);
const error = ref('');

const displayCategory = computed(() =>
  onboardingStore.selectedCategory || EventCategoryEnum.WEDDING
);

const CATEGORY_LABEL_MAP = {
  [EventCategoryEnum.WEDDING]: 'eventCategories.items.weddings.title',
  [EventCategoryEnum.BIRTHDAY]: 'eventCategories.items.birthdaysParties.title',
  [EventCategoryEnum.CORPORATE]: 'eventCategories.items.corporate.title',
  [EventCategoryEnum.CONFERENCE]: 'eventCategories.items.conferences.title',
  [EventCategoryEnum.DINNER]: 'eventCategories.items.privateDinners.title',
  [EventCategoryEnum.BABY_SHOWER]: 'eventCategories.items.babyShowers.title',
  [EventCategoryEnum.GRADUATION]: 'eventCategories.items.graduations.title',
  [EventCategoryEnum.ANNIVERSARY]: 'eventCategories.items.anniversaries.title',
};

const categoryOptions = computed(() => {
  const items = [];
  for (const key of Object.values(EventCategoryEnum)) {
    const labelKey = CATEGORY_LABEL_MAP[key];
    if (labelKey) {
      items.push({ id: key, label: t(labelKey) });
    }
  }
  return items;
});

const filteredInvitations = computed(() => {
  return INVITATION_REGISTRY[displayCategory.value] || [];
});

function onSelectInvitation(designId) {
  setInvitationName(designId);
}

function onPreview(designId) {
  const resolved = router.resolve({ name: designId, params: { lang: lang.value } });
  window.open(resolved.href, '_blank');
}

function onBack() {
  if (!isAuthenticated()) {
    router.push({ name: 'home', params: { lang: lang.value } });
  } else {
    router.push({ name: 'EventBasicDetailsPage', params: { lang: lang.value } });
  }
}

async function onContinue() {
  if (!onboardingStore.invitationName) return;

  // Guest flow: save selection and redirect to signup
  if (!isAuthenticated()) {
    await router.push({ name: 'signup', params: { lang: lang.value } });
    return;
  }

  error.value = '';
  loading.value = true;

  try {
    const eventId = onboardingStore.eventId;

    if (eventId) {
      // Send full path (e.g. "invitations/sunset-glass")
      const allInvitations = Object.values(INVITATION_REGISTRY).flat();
      const selected = allInvitations.find(inv => inv.id === onboardingStore.invitationName);
      const slug = selected?.slug || onboardingStore.invitationName;

      await eventsService.updateInvitation(eventId, {
        invitationName: `invitations/${slug}`
      });
    }

    await router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
  } catch (e) {
    error.value = e?.message || 'Failed to save invitation';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.invitations-page {
  min-height: 100vh;
  background: var(--bg-main, #f9fafb);
  display: flex;
  flex-direction: column;
}

/* ===== Fixed header ===== */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid rgba(16, 24, 40, 0.08);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.1);
  background: #fff;
  color: var(--neutral-700, #374151);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.back-btn:hover:not(:disabled) {
  background: var(--bg-main, #f9fafb);
  border-color: rgba(16, 24, 40, 0.18);
}

.back-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.header-center {
  flex: 1;
  min-width: 0;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900, #111827);
  line-height: 1.3;
}

.header-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--neutral-500, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== Scrollable content ===== */
.content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 40px;
}

.grid-section {
  margin-top: 20px;
}

.error {
  margin: 12px 0 0;
  font-size: 13px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.18);
  padding: 10px 12px;
  border-radius: 12px;
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .header-inner {
    padding: 10px 16px;
  }

  .header-subtitle {
    display: none;
  }

  .header-title {
    font-size: 16px;
  }

  .content {
    padding: 16px 16px 32px;
  }
}
</style>

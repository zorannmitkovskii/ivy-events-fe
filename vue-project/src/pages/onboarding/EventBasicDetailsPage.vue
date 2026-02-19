<template>
  <main class="details-page">
    <!-- Fixed header -->
    <header class="sticky-header">
      <div class="header-inner">
        <button class="back-btn" @click="onBack" :disabled="loading" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="header-center">
          <h1 class="header-title">{{ $t('onboarding.eventBasics.title') }}</h1>
          <p class="header-subtitle">{{ $t('onboarding.eventBasics.subtitle') }}</p>
        </div>

        <div class="header-actions">
          <button type="button" class="skip-btn" @click="onSkip" :disabled="loading">
            {{ $t('onboarding.eventBasics.actions.skip') || 'Skip' }}
          </button>
          <ButtonMain
            :label="$t('onboarding.eventBasics.actions.continue') || 'Continue'"
            variant="main"
            :disabled="!canSubmit || loading"
            :loading="loading"
            @click="onCreate"
          />
        </div>
      </div>
    </header>

    <!-- Scrollable content -->
    <div class="content">
      <div class="card">
        <div class="card-head">
          <div class="icon-badge" aria-hidden="true">💚</div>
          <p class="card-desc">{{ $t('onboarding.eventBasics.subtitle') }}</p>
        </div>

        <form class="form" @submit.prevent="onCreate">
          <div v-if="!isGallery" class="grid">
            <AuthInput
              v-model="brideName"
              :label="$t('onboarding.eventBasics.fields.brideName')"
              :placeholder="$t('onboarding.eventBasics.placeholders.brideName')"
            >
              <template #icon>👰</template>
            </AuthInput>

            <AuthInput
              v-model="groomName"
              :label="$t('onboarding.eventBasics.fields.groomName')"
              :placeholder="$t('onboarding.eventBasics.placeholders.groomName')"
            >
              <template #icon>🤵</template>
            </AuthInput>
          </div>

          <div class="grid">
            <div>
              <AuthInput
                v-model="date"
                :label="`${$t('onboarding.eventBasics.fields.weddingDate')}`"
                type="date"
              >
                <template #icon>📅</template>
              </AuthInput>
              <p class="hint">{{ $t('onboarding.eventBasics.hints.weddingDate') }}</p>
            </div>

            <div>
              <AuthLocationInput
                v-model="location"
                :label="$t('onboarding.eventBasics.fields.location')"
                :placeholder="$t('onboarding.eventBasics.placeholders.location')"
                :types="[]"
                :pickOnMapLabel="$t('common.pickOnMap')"
                :cancelLabel="$t('common.cancel')"
                :useThisLocationLabel="$t('common.useThisLocation')"
                :searchPlaceholder="$t('common.searchPlaces')"
                :locatingLabel="$t('common.locateMe')"
                :locatingLabelLoading="$t('common.locating')"
                :selectedLabel="$t('common.selected')"
                :loadingAddressLabel="$t('common.loadingAddress')"
              >
                <template #icon>📍</template>
              </AuthLocationInput>
              <p class="hint">{{ $t('onboarding.eventBasics.hints.location') }}</p>
            </div>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
        </form>

        <div class="protip">
          <span class="protip-icon">💡</span>
          <span>{{ $t('onboarding.eventBasics.protip.text') || `Pro tip: You can invite collaborators after you've set up the basics. We'll remind you later.` }}</span>
        </div>
      </div>
    </div>

    <OnboardingFooterLinks />
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AuthInput from '@/components/auth/AuthInput.vue';
import AuthLocationInput from '@/components/auth/AuthLocationInput.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import OnboardingFooterLinks from '@/components/onboarding/OnboardingFooterLinks.vue';
import { onboardingStore, setEventDetails, setEventId } from '@/store/onboarding.store';
import { eventsService } from '@/services/events.service';
import { getUsername } from '@/services/auth.service';
import { INVITATION_REGISTRY } from '@/data/invitationRegistry';
import { EventCategoryEnum } from '@/enums/EventCategory.js';

const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');

const brideName = ref('');
const groomName = ref('');
const date = ref('');
const location = ref({
  name: '',
  address: '',
  lat: null,
  lng: null,
  placeId: null
});
const loading = ref(false);
const error = ref('');

const isGallery = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY);

const canSubmit = computed(() => {
  if (!onboardingStore.selectedCategory) return false;
  if (isGallery.value) return true;
  return !!(brideName.value.trim() || groomName.value.trim());
});

function composeEventName() {
  const b = brideName.value.trim();
  const g = groomName.value.trim();
  if (b && g) return `${b} & ${g}`;
  if (b) return b;
  if (g) return g;
  if (isGallery.value) return 'My Gallery';
  return 'New Event';
}

function saveDetails() {
  setEventDetails({
    brideName: brideName.value.trim(),
    groomName: groomName.value.trim(),
    date: date.value || '',
    location: location.value,
  });
}

function onBack() {
  router.push({ name: 'EventCategoryPage', params: { lang: lang.value } });
}

async function createEventAndNavigate() {
  error.value = '';
  loading.value = true;

  try {
    saveDetails();

    const loc = location.value || {};
    const payload = {
      name: composeEventName(),
      categoryType: onboardingStore.selectedCategory,
      groom: groomName.value.trim() ? { name: groomName.value.trim() } : null,
      bride: brideName.value.trim() ? { name: brideName.value.trim() } : null,
      location: (loc.address || loc.name) ? {
        name: loc.name || loc.address || '',
        type: null,
        postalCode: null,
        addressLine: loc.address || '',
        city: null,
        countryIso3: null,
        latitude: loc.lat || null,
        longitude: loc.lng || null,
        photoUrl: null,
        googleMapsUrl: null,
        description: null,
        capacity: null,
        openingHours: null,
        notes: null,
        contact: null,
        isActive: true,
      } : null,
      status: 'DRAFT',
      username: getUsername(),
      date: date.value || null,
      lang: lang.value,
    };

    const res = await eventsService.create(payload);
    const eventId = res?.id || res?.eventId;
    setEventId(eventId);

    // GALLERY events skip the invitation step entirely
    if (isGallery.value) {
      router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
      return;
    }

    // Pre-selected invitation from guest browsing — save it and skip to dashboard
    if (onboardingStore.invitationName) {
      const allInvitations = Object.values(INVITATION_REGISTRY).flat();
      const selected = allInvitations.find(inv => inv.id === onboardingStore.invitationName);
      const slug = selected?.slug || onboardingStore.invitationName;

      await eventsService.updateInvitation(eventId, {
        invitationName: `invitations/${slug}`
      });

      router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
      return;
    }

    router.push({ name: 'EventInvitationsPage', params: { lang: lang.value } });
  } catch (e) {
    error.value = e?.message || 'Failed to create event';
  } finally {
    loading.value = false;
  }
}

function onCreate() {
  if (!canSubmit.value) return;
  createEventAndNavigate();
}

function onSkip() {
  saveDetails();
  if (isGallery.value) {
    router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
    return;
  }
  router.push({ name: 'EventInvitationsPage', params: { lang: lang.value } });
}
</script>

<style scoped>
.details-page {
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.skip-btn {
  background: none;
  border: none;
  color: var(--neutral-500, #6b7280);
  font-size: 14px;
  cursor: pointer;
  padding: 8px 4px;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.skip-btn:hover:not(:disabled) {
  color: var(--neutral-700, #374151);
}

.skip-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Scrollable content ===== */
.content {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 40px 16px;
}

.card {
  width: 100%;
  max-width: 720px;
  background: #fff;
  border: 1px solid rgba(16, 24, 40, 0.08);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.06);
  border-radius: 16px;
  padding: 24px;
}

.card-head { justify-content: center; text-align: center; display: grid; gap: 6px; margin-bottom: 16px; }
.icon-badge { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: #EEF6ED; color: #2E7D32; margin: 0 auto 6px; font-size: 18px; }
.card-desc { margin: 0; font-size: 14px; color: var(--neutral-700); }

.form { display: grid; gap: 12px; }
.grid { display: grid; gap: 12px; }
@media (min-width: 720px) { .grid { grid-template-columns: 1fr 1fr; } }

.hint { margin: 4px 0 0; font-size: 12px; color: var(--neutral-700); }

.protip { margin-top: 12px; display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--neutral-700); background: rgba(147, 162, 154, 0.08); border: 1px solid rgba(147, 162, 154, 0.18); padding: 10px 12px; border-radius: 12px; }
.protip-icon { flex: 0 0 auto; }

.error {
  margin: 4px 0 0;
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

  .skip-btn {
    display: none;
  }

  .content {
    padding: 24px 16px 32px;
  }
}
</style>

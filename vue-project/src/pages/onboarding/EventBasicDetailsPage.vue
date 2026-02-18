<template>
  <main class="onboarding-page">
    <div class="card">
      <div class="card-head">
        <div class="icon-badge" aria-hidden="true">💚</div>
        <h1 class="title">{{ $t('onboarding.eventBasics.title') }}</h1>
        <p class="subtitle">{{ $t('onboarding.eventBasics.subtitle')}}</p>
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
            <!-- ✅ Fixed: Empty types array to show ALL places (addresses + POIs) -->
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
            <p class="hint">{{ $t('onboarding.eventBasics.hints.location')}}</p>
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <ButtonMain
          class="w-100"
          :label="$t('onboarding.eventBasics.actions.continue') || 'Continue'"
          variant="main"
          type="submit"
          :disabled="!canSubmit || loading"
          :loading="loading"
        />

        <button type="button" class="link-btn" @click="onSkip" :disabled="loading">
          {{ $t('onboarding.eventBasics.actions.skip') || 'Skip for now' }}
        </button>
      </form>

      <div class="protip">
        <span class="protip-icon">💡</span>
        <span>{{ $t('onboarding.eventBasics.protip.text') || `Pro tip: You can invite collaborators after you've set up the basics. We'll remind you later.` }}</span>
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
.onboarding-page {
  min-height: 100vh;
  background: var(--bg-main);
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
.title { margin: 0; font-size: 24px; color: var(--neutral-900); font-weight: 600; }
.subtitle { margin: 0; font-size: 14px; color: var(--neutral-700); }

.form { display: grid; gap: 12px; }
.grid { display: grid; gap: 12px; }
@media (min-width: 720px) { .grid { grid-template-columns: 1fr 1fr; } }

.hint { margin: 4px 0 0; font-size: 12px; color: var(--neutral-700); }

.w-100 { width: 100%; }
.link-btn { margin-top: 8px; width: 100%; background: transparent; border: none; color: var(--neutral-700); text-decoration: underline; padding: 8px 0; cursor: pointer; }
.link-btn:disabled { opacity: 0.6; cursor: not-allowed; }

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
</style>

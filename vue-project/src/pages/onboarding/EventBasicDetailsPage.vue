<template>
  <main class="onboarding-page">
    <div class="card">
      <div class="card-head">
        <div class="icon-badge" aria-hidden="true">💚</div>
        <h1 class="title">{{ $t('onboarding.details.title') }}</h1>
        <p class="subtitle">{{ $t('onboarding.details.subtitle')}}</p>
      </div>

      <form class="form" @submit.prevent="onCreate">
        <div class="grid">
          <AuthInput
            v-model="brideName"
            :label="$t('onboarding.details.fields.brideName')"
            :placeholder="$t('onboarding.details.placeholders.brideName')"
          >
            <template #icon>👰</template>
          </AuthInput>

          <AuthInput
            v-model="groomName"
            :label="$t('onboarding.details.fields.groomName')"
            :placeholder="$t('onboarding.details.placeholders.groomName')"
          >
            <template #icon>🤵</template>
          </AuthInput>
        </div>

        <div class="grid">
          <div>
            <AuthInput
              v-model="date"
              :label="`${$t('onboarding.details.fields.date')} (Optional)`"
              type="date"
            >
              <template #icon>📅</template>
            </AuthInput>
            <p class="hint">{{ $t('onboarding.details.hints.noDate') }}</p>
          </div>

          <div>
            <!-- ✅ Fixed: Empty types array to show ALL places (addresses + POIs) -->
            <AuthLocationInput
              v-model="location"
              :label="$t('common.location')"
              :placeholder="$t('common.locationPh')"
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
            <p class="hint">{{ $t('onboarding.details.hints.tbdOk')}}</p>
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <ButtonMain
          class="w-100"
          :label="$t('onboarding.details.actions.continue') || 'Continue'"
          variant="main"
          type="submit"
          :disabled="!canSubmit || loading"
          :loading="loading"
        />

        <button type="button" class="link-btn" @click="onSkip" :disabled="loading">
          {{ $t('onboarding.details.actions.skip') || 'Skip for now' }}
        </button>
      </form>

      <div class="protip">
        <span class="protip-icon">💡</span>
        <span>{{ $t('onboarding.details.protip') || `Pro tip: You can invite collaborators after you've set up the basics. We'll remind you later.` }}</span>
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

const canSubmit = computed(() => (brideName.value.trim() || groomName.value.trim()) && !!onboardingStore.selectedCategory);

function composeEventName() {
  const b = brideName.value.trim();
  const g = groomName.value.trim();
  if (b && g) return `${b} & ${g}`;
  if (b) return b;
  if (g) return g;
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
        addressLine: loc.address || '',
        latitude: loc.lat || null,
        longitude: loc.lng || null
      } : null,
      status: 'DRAFT',
      username: getUsername(),
      date: date.value || null,
      lang: lang.value,
    };

    const res = await eventsService.create(payload);
    const eventId = res?.id || res?.eventId;
    setEventId(eventId);

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

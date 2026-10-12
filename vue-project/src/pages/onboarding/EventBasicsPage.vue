<template>
  <main class="basics-page">
    <header class="sticky-header">
      <div class="header-inner">
        <button type="button" class="back-btn" :aria-label="$t('onboarding.eventBasics.back')" @click="onBack">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="header-center">
          <h1 class="header-title">{{ $t('onboarding.eventBasics.title') }}</h1>
        </div>
      </div>
      <div class="header-steps">
        <CreationStepper :steps="steps" @go="goToStep" />
      </div>
    </header>

    <form class="content" novalidate data-testid="event-basics-form" @submit.prevent="onContinue">
      <p class="lead">{{ $t('onboarding.eventBasics.lead') }}</p>

      <fieldset class="group">
        <legend class="group-title">{{ coupleNames ? $t('onboarding.eventBasics.namesLegend') : $t('onboarding.eventBasics.titleLegend') }}</legend>

        <template v-if="coupleNames">
          <div class="field">
            <label for="basics-bride">{{ $t(`onboarding.eventBasics.fields.${nameKeys.first}`) }}</label>
            <input
              id="basics-bride" v-model="form.brideName" class="input" type="text"
              autocomplete="off" :placeholder="$t(`onboarding.eventBasics.placeholders.${nameKeys.first}`)"
              :aria-invalid="!!shown.brideName" :aria-describedby="shown.brideName ? 'basics-bride-err' : undefined"
            />
            <p v-if="shown.brideName" id="basics-bride-err" class="error">{{ $t(shown.brideName) }}</p>
          </div>
          <div class="field">
            <label for="basics-groom">{{ $t(`onboarding.eventBasics.fields.${nameKeys.second}`) }}</label>
            <input
              id="basics-groom" v-model="form.groomName" class="input" type="text"
              autocomplete="off" :placeholder="$t(`onboarding.eventBasics.placeholders.${nameKeys.second}`)"
              :aria-invalid="!!shown.groomName" :aria-describedby="shown.groomName ? 'basics-groom-err' : undefined"
            />
            <p v-if="shown.groomName" id="basics-groom-err" class="error">{{ $t(shown.groomName) }}</p>
          </div>
        </template>
        <div v-else class="field">
          <label for="basics-title">{{ $t('onboarding.eventBasics.fields.title') }}</label>
          <input
            id="basics-title" v-model="form.title" class="input" type="text"
            autocomplete="off" :placeholder="$t('onboarding.eventBasics.placeholders.title')"
            :aria-invalid="!!shown.title" :aria-describedby="shown.title ? 'basics-title-err' : undefined"
          />
          <p v-if="shown.title" id="basics-title-err" class="error">{{ $t(shown.title) }}</p>
        </div>
      </fieldset>

      <fieldset class="group">
        <legend class="group-title">{{ $t('onboarding.eventBasics.whenLegend') }}</legend>
        <div class="row">
          <div class="field">
            <label for="basics-date">{{ $t('onboarding.eventBasics.fields.date') }}</label>
            <input
              id="basics-date" v-model="form.date" class="input" type="date"
              :aria-invalid="!!shown.date" :aria-describedby="shown.date ? 'basics-date-err' : undefined"
            />
            <p v-if="shown.date" id="basics-date-err" class="error">{{ $t(shown.date, { timezone: form.timezone }) }}</p>
          </div>
          <div class="field">
            <label for="basics-time">{{ $t('onboarding.eventBasics.fields.time') }}</label>
            <input
              id="basics-time" v-model="form.time" class="input" type="time"
              :aria-invalid="!!shown.time" :aria-describedby="shown.time ? 'basics-time-err' : undefined"
            />
            <p v-if="shown.time" id="basics-time-err" class="error">{{ $t(shown.time) }}</p>
          </div>
        </div>
        <div class="field">
          <label for="basics-tz">{{ $t('onboarding.eventBasics.fields.timezone') }}</label>
          <select
            id="basics-tz" v-model="form.timezone" class="input"
            aria-describedby="basics-tz-hint"
            :aria-invalid="!!shown.timezone"
          >
            <option v-for="tz in tzOptions" :key="tz" :value="tz">{{ tz }}</option>
          </select>
          <p id="basics-tz-hint" class="hint">{{ $t('onboarding.eventBasics.hints.timezone') }}</p>
          <p v-if="shown.timezone" class="error">{{ $t(shown.timezone) }}</p>
        </div>
      </fieldset>

      <fieldset class="group">
        <legend class="group-title">{{ $t('onboarding.eventBasics.whereLegend') }}</legend>
        <div class="field">
          <label for="basics-venue">{{ $t('onboarding.eventBasics.fields.venue') }}</label>
          <input
            id="basics-venue" v-model="form.location.name" class="input" type="text"
            autocomplete="off" :placeholder="$t('onboarding.eventBasics.placeholders.venue')"
            :aria-invalid="!!shown.location" :aria-describedby="shown.location ? 'basics-venue-err' : undefined"
          />
          <p v-if="shown.location" id="basics-venue-err" class="error">{{ $t(shown.location) }}</p>
        </div>
        <div class="field">
          <label for="basics-address">{{ $t('onboarding.eventBasics.fields.address') }}</label>
          <input
            id="basics-address" v-model="form.location.address" class="input" type="text"
            autocomplete="off" :placeholder="$t('onboarding.eventBasics.placeholders.location')"
          />
        </div>
      </fieldset>

      <p class="device-note" role="note">
        {{ loggedIn ? $t('onboarding.eventBasics.noteSignedIn') : $t('onboarding.eventBasics.noteGuest') }}
      </p>

      <div class="actions">
        <button type="submit" class="action-btn" data-testid="event-basics-continue">
          {{ $t('onboarding.eventBasics.actions.continue') }}
        </button>
      </div>
    </form>

    <OnboardingFooterLinks />
  </main>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import OnboardingFooterLinks from '@/components/onboarding/OnboardingFooterLinks.vue';
import CreationStepper from '@/components/onboarding/CreationStepper.vue';
import { useCreationSteps } from '@/composables/useCreationSteps';
import { onboardingStore, setEventDetails } from '@/store/onboarding.store';
import { seedDraftInfo } from '@/store/invitationDraft.store';
import { isAuthenticated } from '@/services/auth.service';
import {
  basicsToInvitationInfo, coupleNameKeys, hasBasics, normalizeBasics, timezoneOptions, usesCoupleNames, validateBasics,
} from '@/utils/eventBasics';

/**
 * Step two of making an invitation (INV-104): only what the design needs to
 * show the person their own invitation — names or a title, date, time, the
 * event's timezone and a place. Everything else (story, programme, photos,
 * RSVP) comes after the design, and all of it can be skipped.
 *
 * Open to guests: nothing here needs an account, and nothing is sent to the
 * server. The answers stay in this browser until the invitation is saved.
 */
const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
const loggedIn = computed(() => isAuthenticated());

const category = computed(() => onboardingStore.selectedCategory);
const coupleNames = computed(() => usesCoupleNames(category.value));
// Bride and groom only for a wedding (INV-101).
const nameKeys = computed(() => coupleNameKeys(category.value));

const form = reactive(normalizeBasics(onboardingStore.eventDetails));
const tzOptions = computed(() => timezoneOptions(form.timezone));

// Errors appear after the first attempt to continue, then follow the typing.
const attempted = ref(false);
const errors = computed(() => validateBasics(form, category.value));
const shown = computed(() => (attempted.value ? errors.value : {}));

// Field → input id, in the order the form shows them.
const FIELD_IDS = {
  brideName: 'basics-bride',
  groomName: 'basics-groom',
  title: 'basics-title',
  date: 'basics-date',
  time: 'basics-time',
  timezone: 'basics-tz',
  location: 'basics-venue',
};

async function focusField(field) {
  attempted.value = true;
  await nextTick();
  document.getElementById(FIELD_IDS[field])?.focus();
}

/**
 * Kept as typed, valid or not, so no way off this page — Back, the stepper,
 * the browser — loses it (INV-102). Once valid, the draft's info block
 * follows, or the editor would reopen with the names it had before.
 */
function persistBasics() {
  const basics = normalizeBasics(form);
  setEventDetails(basics);
  if (hasBasics(basics, category.value)) seedDraftInfo(basicsToInvitationInfo(basics, category.value));
}

watch(form, persistBasics, { deep: true });

// The stepper (INV-102): this page's live answers decide the Event step.
const { steps, go: goToStep } = useCreationSteps({
  current: 'event',
  context: () => ({ basics: form }),
  handlers: {
    fix: (step, problem) => {
      if (step !== 'event' || !FIELD_IDS[problem.field]) return false;
      focusField(problem.field);
      return true;
    },
    open: (step) => step === 'event',
    leave: persistBasics,
  },
});

// Sent here by the stepper to fix one field: show the errors and go to it.
onMounted(() => {
  const field = route.query?.focus;
  if (field && FIELD_IDS[field]) focusField(field);
});

async function onContinue() {
  attempted.value = true;
  const first = Object.keys(FIELD_IDS).find((key) => errors.value[key]);
  if (first) {
    // Straight to the first thing to fix, for keyboard and screen readers.
    await focusField(first);
    return;
  }
  const basics = normalizeBasics(form);
  setEventDetails(basics);
  // The editor restores names, date and place from the draft's info block;
  // writing it here keeps an older draft from showing somebody else's names.
  seedDraftInfo(basicsToInvitationInfo(basics, category.value));
  await router.push({ name: 'EventInvitationsPage', params: { lang: lang.value } });
}

function onBack() {
  // Kept as typed, valid or not — going back is not discarding.
  setEventDetails(normalizeBasics(form));
  router.push({ name: 'EventCategoryPage', params: { lang: lang.value } });
}
</script>

<style scoped>
.basics-page {
  min-height: 100vh;
  background: var(--bg-main, var(--sunken));
  display: flex;
  flex-direction: column;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid rgba(16, 24, 40, 0.08);
}

.header-inner {
  max-width: 720px;
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
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.1);
  background: #fff;
  color: var(--neutral-700, var(--ink-2));
  cursor: pointer;
  flex-shrink: 0;
}

.header-steps {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px 10px;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900, var(--ink));
}

.content {
  flex: 1;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 24px 48px;
  display: grid;
  gap: 18px;
}

.lead {
  margin: 0;
  font-size: 15px;
  color: var(--neutral-700, var(--ink-2));
}

.group {
  margin: 0;
  padding: 18px;
  border: 1px solid rgba(16, 24, 40, 0.08);
  border-radius: 14px;
  background: #fff;
  display: grid;
  gap: 14px;
  min-width: 0;
}

.group-title {
  padding: 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--neutral-700, var(--ink-2));
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700, var(--ink-2));
}

.input {
  width: 100%;
  min-height: 44px;
  border: 1.5px solid var(--neutral-300, var(--line-2));
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  font-size: 15px;
  background: #fff;
  color: var(--neutral-900, var(--ink));
}

.input:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 1px;
}

.input[aria-invalid='true'] {
  border-color: #b42318;
}

.hint {
  margin: 0;
  font-size: 12px;
  color: var(--neutral-500, var(--ink-3));
}

.error {
  margin: 0;
  font-size: 12px;
  color: #b42318;
}

.device-note {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f0f9ff;
  border: 1px solid #b9e6fe;
  font-size: 13px;
  color: #026aa2;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  min-height: 48px;
  padding: 12px 36px;
  border: none;
  border-radius: 12px;
  background: var(--brand-main, #334338);
  color: #fff;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn:focus-visible,
.back-btn:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .header-inner,
  .header-steps,
  .content {
    padding-left: 16px;
    padding-right: 16px;
  }

  .row {
    grid-template-columns: 1fr;
  }

  .action-btn {
    width: 100%;
  }
}
</style>

<template>
  <div class="ivy-site">
    <!--
      The category cards are the landing page's, and their styles live in
      `ivy/site.css` under `.ivy-site` — outside that wrapper they render as raw
      text and full-size SVGs. The wrapper sets nothing on itself; it only scopes.
    -->
    <main class="category-page">
      <!-- Fixed header -->
      <header class="sticky-header">
        <div class="header-inner">
          <button class="back-btn" @click="onBack" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
  
          <div class="header-center">
            <h1 class="header-title">{{ $t('onboarding.category.title') }}</h1>
            <p class="header-subtitle">{{ $t('onboarding.category.subtitle') }}</p>
          </div>
  
          <div></div>
        </div>
        <div v-if="!isGallery" class="header-steps">
          <CreationStepper :steps="steps" @go="goToStep" />
        </div>
      </header>
  
      <!--
        How to start (INV-101): continue the unfinished invitation on this
        device, or start a new one. Asked only when there really is a draft,
        and once per visit — Back/Forward return to the list below.
      -->
      <!-- INV-302: what happened to a draft that could not be offered. -->
      <div class="start-notices">
        <div v-if="topNotice" class="draft-notice" role="status" data-testid="draft-notice" :data-kind="topNotice.kind">
          <p>{{ topNoticeText }}</p>
          <button type="button" class="state-btn" data-testid="draft-notice-dismiss" @click="onDismissNotice">
            {{ $t('onboarding.category.draft.notice.dismiss') }}
          </button>
        </div>
        <p v-if="checkingServer" class="draft-notice draft-notice--plain" role="status" data-testid="server-drafts-checking">
          {{ $t('onboarding.category.start.checking') }}
        </p>
        <div v-if="serverState === 'failed'" class="draft-notice" role="alert" data-testid="server-drafts-error">
          <p>{{ $t('onboarding.category.start.serverFailed') }}</p>
          <button type="button" class="state-btn" @click="loadServer">{{ $t('onboarding.category.retry') }}</button>
        </div>
      </div>
      <p class="sr-only" role="status" aria-live="polite" data-testid="start-announce">{{ announce }}</p>

      <section
        v-if="showStartChoice"
        class="start-choice"
        aria-labelledby="start-choice-title"
        data-testid="start-choice"
      >
        <h2 id="start-choice-title" ref="choiceTitleRef" tabindex="-1" class="start-choice__title">{{ $t('onboarding.category.start.title') }}</h2>
        <div class="start-options">
          <article v-if="resumable" class="start-card start-card--resume" aria-labelledby="start-resume-title" data-testid="local-draft">
            <h3 id="start-resume-title" class="start-card__title">{{ $t('onboarding.category.start.resumeTitle') }}</h3>
            <p class="start-card__where">{{ $t('onboarding.category.start.localWhere') }}</p>
            <!-- Only what is known: no placeholders for a missing type or name. -->
            <dl class="start-card__summary">
              <div v-if="draftSummary.category">
                <dt>{{ $t('onboarding.category.start.summary.category') }}</dt>
                <dd>{{ draftSummary.category }}</dd>
              </div>
              <div v-if="draftSummary.name">
                <dt>{{ $t('onboarding.category.start.summary.name') }}</dt>
                <dd>{{ draftSummary.name }}</dd>
              </div>
              <div v-if="draftSummary.date">
                <dt>{{ $t('onboarding.category.start.summary.date') }}</dt>
                <dd>{{ draftSummary.date }}</dd>
              </div>
              <div v-if="draftSummary.updatedAt">
                <dt>{{ $t('onboarding.category.start.summary.updatedAt') }}</dt>
                <dd>{{ draftSummary.updatedAt }}</dd>
              </div>
              <div v-if="draftSummary.expiresAt" data-testid="draft-expires">
                <dt>{{ $t('onboarding.category.start.expiresAt') }}</dt>
                <dd>{{ draftSummary.expiresAt }}</dd>
              </div>
            </dl>
            <p v-if="draftSummary.expiresAt" class="start-card__hint">
              {{ $t('onboarding.category.start.expiresHint', { days: TTL_DAYS }) }}
            </p>
            <p v-if="partialNotice" class="start-card__warn" data-testid="draft-partial">
              {{ $t('onboarding.category.start.partial') }}
            </p>
            <div class="start-card__buttons">
              <button type="button" class="start-card__action start-card__action--main" data-testid="resume-draft" @click="onResume">
                {{ $t('onboarding.category.start.resumeAction') }}
              </button>
              <button
                type="button"
                class="start-card__action start-card__action--danger"
                data-testid="discard-draft"
                aria-haspopup="dialog"
                @click="openDiscard(false)"
              >{{ $t('onboarding.category.start.discardAction') }}</button>
            </div>
          </article>

          <article class="start-card" aria-labelledby="start-new-title">
            <h3 id="start-new-title" class="start-card__title">{{ $t('onboarding.category.start.newTitle') }}</h3>
            <p class="start-card__text">
              {{ resumable ? $t('onboarding.category.start.newDescLocal') : $t('onboarding.category.start.newDesc') }}
            </p>
            <button
              type="button"
              class="start-card__action"
              data-testid="start-new"
              :aria-haspopup="resumable ? 'dialog' : undefined"
              aria-controls="category-picker"
              :aria-expanded="showPicker ? 'true' : 'false'"
              @click="onStartNew"
            >{{ $t('onboarding.category.start.newAction') }}</button>
          </article>

          <ul
            v-if="serverDrafts.length"
            class="server-drafts"
            :aria-label="$t('onboarding.category.start.serverListLabel')"
            data-testid="server-drafts"
          >
            <li v-for="d in serverDraftSummaries" :key="d.id">
              <article class="start-card" :aria-labelledby="`server-draft-${d.id}`" data-testid="server-draft">
                <h3 :id="`server-draft-${d.id}`" class="start-card__title">{{ $t('onboarding.category.start.serverTitle') }}</h3>
                <dl class="start-card__summary">
                  <div v-if="d.name">
                    <dt>{{ $t('onboarding.category.start.summary.name') }}</dt>
                    <dd>{{ d.name }}</dd>
                  </div>
                  <div v-if="d.categoryLabel">
                    <dt>{{ $t('onboarding.category.start.summary.category') }}</dt>
                    <dd>{{ d.categoryLabel }}</dd>
                  </div>
                  <div v-if="d.updatedOn">
                    <dt>{{ $t('onboarding.category.start.summary.updatedAt') }}</dt>
                    <dd>{{ d.updatedOn }}</dd>
                  </div>
                </dl>
                <p v-if="d.unsyncedAt" class="start-card__warn" data-testid="server-draft-unsynced">
                  {{ $t('onboarding.category.start.serverUnsynced') }}
                </p>
                <button
                  type="button"
                  class="start-card__action start-card__action--main"
                  data-testid="resume-server-draft"
                  :aria-label="$t('onboarding.category.start.serverActionLabel', { name: d.name || d.categoryLabel || '' })"
                  @click="onResumeServer(d)"
                >{{ $t('onboarding.category.start.serverAction') }}</button>
              </article>
            </li>
          </ul>
        </div>
      </section>

      <DiscardDraftDialog
        :open="discardOpen"
        :draft="resumable"
        :logged-in="loggedIn"
        :start-new="discardForNew"
        @cancel="discardOpen = false"
        @confirm="onConfirmDiscard"
      />

      <!-- Scrollable content -->
      <div v-if="showPicker" id="category-picker" ref="pickerRef" class="content">
        <p v-if="serverDrafts.length && startChoice === START_CHOICE.NEW" class="picker-note" role="note" data-testid="start-new-note">
          {{ $t('onboarding.category.start.newNote') }}
        </p>

        <div v-if="catalogFailed" class="catalog-state catalog-state--error" role="alert" data-testid="categories-error">
          <p>{{ $t('onboarding.category.loadError') }}</p>
          <button type="button" class="state-btn" @click="retryCategories">{{ $t('onboarding.category.retry') }}</button>
        </div>
        <div v-else-if="catalogEmpty" class="catalog-state" role="status" data-testid="categories-empty">
          <p>{{ $t('onboarding.category.empty') }}</p>
          <RouterLink class="state-btn" :to="{ name: 'designs', params: { lang } }">{{ $t('onboarding.category.emptyAction') }}</RouterLink>
        </div>

        <p v-if="selectionUnavailable" class="catalog-state catalog-state--warn" role="alert" data-testid="category-unavailable">
          {{ $t('onboarding.category.unavailable', { category: selectedLabel }) }}
        </p>

        <EventCategories
          v-model="selectedCategoryId"
          bg-class="bg-transparent"
          :show-header="false"
          :disable-navigation="true"
        />
      </div>
  
      <!-- A birthday is either an adult's or a child's. They share a category
           and share almost nothing else: one has a budget, the other collects
           allergies and a guardian's phone number. -->
      <div v-if="showPicker && needsTypeChoice" class="type-choice">
        <p class="type-choice-title">{{ $t('onboarding.category.birthdayWho') }}</p>
        <div ref="typeOptionsRef" class="type-options">
          <button
            v-for="option in birthdayTypes"
            :key="option.code"
            class="type-option"
            :class="{ 'type-option--on': selectedTypeCode === option.code }"
            :aria-pressed="selectedTypeCode === option.code"
            @click="chooseType(option.code)"
          >{{ option.label }}</button>
        </div>
      </div>
  
      <!-- Sticky footer with action button -->
      <div v-if="canContinue" class="sticky-footer">
        <div class="footer-inner">
          <button
            class="action-btn"
            :disabled="creatingEvent"
            @click="onAction"
          >
            <span v-if="creatingEvent" class="btn-spinner"></span>
            {{ actionLabel }}
          </button>
        </div>
      </div>
  
      <OnboardingFooterLinks />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import OnboardingFooterLinks from '@/components/onboarding/OnboardingFooterLinks.vue';
import CreationStepper from '@/components/onboarding/CreationStepper.vue';
import { useCreationSteps } from '@/composables/useCreationSteps';
import {
  setSelectedCategory, setSelectedTypeCode, setEventId, setInvitationName, setInvitationPath, onboardingStore,
} from '@/store/onboarding.store';
import { eventsService } from '@/services/events.service';
import { isAuthenticated, getUsername } from '@/services/auth.service';
import EventCategories from "@/components/landingPage/EventCategories.vue";
import { categoryIdToEnum, categoryLabelKey, enumToCategoryId } from "@/helper/CategoryMapping.helper.js";
import { EventCategoryEnum } from '@/enums/EventCategory';
import { useEventCategories } from '@/composables/usePublicCatalog';
import { draftStore, DRAFT_NOTICE, DRAFT_TTL_MS } from '@/store/invitationDraft.store';
import {
  findResumableDraft, getStartChoice, setStartChoice, START_CHOICE,
  discardLocalDraft, draftRecoveryNotice, dismissDraftNotice, loadServerDrafts, formatCalendarDate, formatInstant,
} from '@/utils/creationDraft';
import DiscardDraftDialog from '@/components/onboarding/DiscardDraftDialog.vue';

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
const creatingEvent = ref(false);
const loggedIn = computed(() => isAuthenticated());

// Initialize with stored category (convert enum to ID for the component)
const selectedCategoryId = ref(
  onboardingStore.selectedCategory
    ? enumToCategoryId(onboardingStore.selectedCategory)
    : null
);

const selectedEnum = computed(() =>
  selectedCategoryId.value ? categoryIdToEnum(selectedCategoryId.value) : null
);

const isGallery = computed(() => selectedEnum.value === EventCategoryEnum.GALLERY);

/*
  The same cards the category grid draws, from the shared catalogue — here for
  the event types under each category, which the server lists per card.
*/
const { categories, loaded: catalogLoaded, failed: catalogFailed, load: loadCategories } = useEventCategories();
loadCategories();

function retryCategories() {
  loadCategories();
}

/** Loaded, but nothing can be created yet: say so and offer the designs instead. */
const catalogEmpty = computed(() =>
  catalogLoaded.value && !catalogFailed.value && !categories.value.some((card) => card.available)
);

/**
 * A remembered category the server no longer offers (or never listed). It is
 * not quietly kept, nor swapped for another one: the person is told and picks
 * again. Galleries are made here without a card and are left alone.
 */
const selectionUnavailable = computed(() => {
  if (!selectedEnum.value || isGallery.value || !catalogLoaded.value) return false;
  return !categories.value.some((card) => card.category === selectedEnum.value && card.available);
});

const selectedLabel = computed(() => {
  const key = categoryLabelKey(selectedEnum.value);
  return key ? t(key) : selectedEnum.value || '';
});

/* ---- How to start (INV-101) --------------------------------------- */

const resumable = computed(() => findResumableDraft(onboardingStore, draftStore));
const startChoice = ref(getStartChoice());
const pickerRef = ref(null);
const choiceTitleRef = ref(null);
const announce = ref('');
const TTL_DAYS = Math.round(DRAFT_TTL_MS / 86400000);

/*
  Drafts saved in the account (INV-302): events the person saved and has not
  activated. Asked only for a signed-in person who has not answered the start
  question in this tab; a failure is said, never read as "no drafts".
*/
const serverDrafts = ref([]);
const serverState = ref('idle'); // idle | loading | loaded | failed

function settleFresh() {
  if (startChoice.value || resumable.value || serverDrafts.value.length || serverState.value === 'loading') return;
  // Nothing to continue: this visit starts a new invitation, and its own
  // progress is not offered back to it as "a draft" on Back.
  startChoice.value = START_CHOICE.FRESH;
  setStartChoice(START_CHOICE.FRESH);
}

async function loadServer() {
  if (!loggedIn.value) return;
  serverState.value = 'loading';
  try {
    serverDrafts.value = await loadServerDrafts();
    serverState.value = 'loaded';
    // A retry that finds drafts after the visit was taken as "fresh" asks now.
    if (serverDrafts.value.length && startChoice.value === START_CHOICE.FRESH) {
      startChoice.value = null;
      setStartChoice(null);
    }
  } catch (e) {
    console.warn('[EventCategoryPage] could not list the drafts in the account', e);
    serverDrafts.value = [];
    serverState.value = 'failed';
  }
  settleFresh();
}

if (loggedIn.value && !startChoice.value) loadServer();
else settleFresh();

/** The choice is offered once per visit, and only when there is a draft. */
const showStartChoice = computed(() => !startChoice.value && (!!resumable.value || serverDrafts.value.length > 0));
// Without a local draft the page waits for the account's answer before
// showing the categories, so the question does not jump in afterwards.
const checkingServer = computed(() => !startChoice.value && !resumable.value && serverState.value === 'loading');
const showPicker = computed(() => !showStartChoice.value && !checkingServer.value);

/* ---- Expired / unreadable / partly read (INV-302) ------------------ */

const recoveryNotice = ref(draftRecoveryNotice());
// Something survived (e.g. the basics, when only the editor's copy was
// damaged): it is said on the draft's card — "part of it could not be read".
const partialNotice = computed(() =>
  !!resumable.value && [DRAFT_NOTICE.PARTIAL, DRAFT_NOTICE.UNREADABLE].includes(recoveryNotice.value?.kind));
const topNotice = computed(() => (recoveryNotice.value && !partialNotice.value ? recoveryNotice.value : null));
const topNoticeText = computed(() => {
  const n = topNotice.value;
  if (!n) return '';
  if (n.kind === DRAFT_NOTICE.EXPIRED) {
    const date = formatInstant(n.updatedAt, locale.value);
    return date
      ? t('onboarding.category.draft.notice.expired', { date, days: TTL_DAYS })
      : t('onboarding.category.draft.notice.expiredNoDate', { days: TTL_DAYS });
  }
  if (n.kind === DRAFT_NOTICE.PARTIAL) return t('onboarding.category.start.partial');
  return t('onboarding.category.draft.notice.unreadable');
});

function onDismissNotice() {
  dismissDraftNotice();
  recoveryNotice.value = null;
}

/** The note has been seen once a choice is made about the draft it describes. */
function settleNotice() {
  if (partialNotice.value) onDismissNotice();
}

const draftSummary = computed(() => {
  const d = resumable.value;
  if (!d) return {};
  const key = categoryLabelKey(d.category);
  let category = d.category ? (key ? t(key) : d.category) : '';
  if (category && d.typeCode) category += ` · ${t(`onboarding.category.types.${d.typeCode}`, d.typeCode)}`;
  const date = formatCalendarDate(d.date, locale.value);
  return {
    category,
    name: d.name,
    date: date && d.time ? `${date}, ${d.time}` : date,
    updatedAt: formatInstant(d.updatedAt, locale.value),
    expiresAt: formatInstant(d.expiresAt, locale.value, false),
  };
});

const serverDraftSummaries = computed(() => serverDrafts.value.map((d) => {
  const key = categoryLabelKey(d.category);
  return {
    ...d,
    categoryLabel: d.category ? (key ? t(key) : d.category) : '',
    updatedOn: formatCalendarDate(d.updatedOn, locale.value),
  };
}));

function focusFirstCategory() {
  nextTick(() => pickerRef.value?.querySelector('button.cat')?.focus());
}

/**
 * "Start a new invitation": the list of categories. With a draft on this
 * device it is the draft's only slot, so starting anew means deleting it —
 * asked first, with exactly what goes (INV-302). Drafts in the account stay.
 */
function onStartNew() {
  if (resumable.value) {
    openDiscard(true);
    return;
  }
  settleNotice();
  startChoice.value = START_CHOICE.NEW;
  setStartChoice(START_CHOICE.NEW);
  focusFirstCategory();
}

/* ---- Discarding the draft on this device (INV-302) ----------------- */

const discardOpen = ref(false);
const discardForNew = ref(false);

function openDiscard(forNew) {
  discardForNew.value = !!forNew;
  discardOpen.value = true;
}

function onConfirmDiscard() {
  discardOpen.value = false;
  discardLocalDraft();
  recoveryNotice.value = null;
  // The store forgot the category; the picker forgets it too.
  if (!onboardingStore.selectedCategory) selectedCategoryId.value = null;
  announce.value = t('onboarding.category.start.discarded');

  if (discardForNew.value || !serverDrafts.value.length) {
    startChoice.value = discardForNew.value ? START_CHOICE.NEW : START_CHOICE.FRESH;
    setStartChoice(startChoice.value);
    focusFirstCategory();
  } else {
    // The account's drafts are still offered.
    nextTick(() => choiceTitleRef.value?.focus());
  }
}

/** "Continue" on a draft in the account: its editor, or its dashboard when it has no design yet. */
function onResumeServer(d) {
  settleNotice();
  startChoice.value = START_CHOICE.RESUME;
  setStartChoice(START_CHOICE.RESUME);
  if (d.design) {
    router.push({ path: `/${lang.value}/invitations/${d.design}`, query: { edit: 'true', eventId: d.id } });
    return;
  }
  setEventId(d.id);
  router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
}

/**
 * "Continue the draft": where it was left — the stepper sends the person to
 * the first required thing still missing (type, basics, design), else into
 * the editor with the draft.
 */
function onResume() {
  settleNotice();
  startChoice.value = START_CHOICE.RESUME;
  setStartChoice(START_CHOICE.RESUME);
  if (!onboardingStore.selectedCategory || selectionUnavailable.value) {
    // A draft without a type (an older one), or with one that is no longer
    // offered: the type is the next thing to choose, not a silent substitute.
    focusFirstCategory();
    return;
  }
  goToStep('details');
}

const selectedCard = computed(() => categories.value.find((card) => card.category === selectedEnum.value) ?? null);

/**
 * The types of the chosen category, when there is more than one (IVY-204).
 *
 * <p>Only birthdays today — adult or child — but that is the server's to say:
 * a category with exactly one type needs no question, since it would have one
 * answer.
 */
const birthdayTypes = computed(() => {
  const types = selectedCard.value?.types ?? [];
  if (types.length < 2) return [];
  return types.map((code) => ({ code, label: t(`onboarding.category.types.${code}`, code) }));
});

const selectedTypeCode = computed(() => onboardingStore.selectedTypeCode);

const needsTypeChoice = computed(() => birthdayTypes.value.length > 0);

/** Blocks the footer until the follow-up is answered — continuing without it
 *  would silently pick one, and the wrong one asks the wrong questions later. */
const awaitingTypeChoice = computed(() => needsTypeChoice.value && !selectedTypeCode.value);

function chooseType(code) {
  setSelectedTypeCode(code);
}

// The stepper (INV-102). The type question is part of the Event step here.
const typeOptionsRef = ref(null);
const { steps, go: goToStep } = useCreationSteps({
  current: 'event',
  context: () => ({ typeRequired: needsTypeChoice.value }),
  handlers: {
    fix: (step, problem) => {
      if (step !== 'event') return false;
      if (problem.field === 'type') {
        nextTick(() => typeOptionsRef.value?.querySelector('button')?.focus());
        return true;
      }
      if (problem.field === 'category') {
        window.scrollTo?.({ top: 0 });
        return true;
      }
      // The basics have not been asked yet: open them, without errors.
      router.push({ name: 'EventBasicsPage', params: { lang: lang.value } });
      return true;
    },
  },
});

const canContinue = computed(() =>
  showPicker.value && !!selectedEnum.value && !awaitingTypeChoice.value && !selectionUnavailable.value
);

const actionLabel = computed(() => {
  if (creatingEvent.value) return '...';
  return isGallery.value
    ? t('onboarding.category.create')
    : t('onboarding.category.next');
});

// Sync selection to store
watch(selectedCategoryId, (newId) => {
  if (!newId) return;
  const enumValue = categoryIdToEnum(newId);
  if (!enumValue) return;

  const previous = onboardingStore.selectedCategory;
  setSelectedCategory(enumValue);
  // The designs are listed per category (INV-101): one chosen for another
  // category is not a choice made for this one. Only the choice goes; the
  // draft's content stays.
  if (previous && previous !== enumValue && (onboardingStore.invitationName || onboardingStore.invitationPath)) {
    setInvitationName('');
    setInvitationPath('');
  }
  // A type chosen for the previous category does not carry over — picking
  // "child birthday" and then switching to a wedding must not leave the
  // wedding claiming to be a child's party.
  if (!selectedTypeCode.value) return;
  const card = categories.value.find((entry) => entry.category === enumValue);
  if (!card?.types?.includes(selectedTypeCode.value)) setSelectedTypeCode("");
});

async function onAction() {
  if (!canContinue.value) return;

  if (isGallery.value) {
    // A gallery is an event on the server straight away; that needs an
    // account. Everything else is built first and saved at the end (INV-104).
    if (!loggedIn.value) {
      await router.push({ name: 'signup', params: { lang: lang.value } });
      return;
    }
    await createGalleryEvent();
  } else {
    await router.push({ name: 'EventBasicsPage', params: { lang: lang.value } });
  }
}

async function createGalleryEvent() {
  if (creatingEvent.value) return;
  creatingEvent.value = true;
  try {
    const payload = {
      name: t(categoryLabelKey(EventCategoryEnum.GALLERY)),
      categoryType: EventCategoryEnum.GALLERY,
      status: 'DRAFT',
      username: getUsername(),
      lang: lang.value,
    };
    const res = await eventsService.create(payload);
    const eventId = res?.id || res?.eventId;
    if (eventId) setEventId(eventId);
    await router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
  } catch (e) {
    console.error('[EventCategoryPage] failed to create gallery event:', e);
    creatingEvent.value = false;
  }
}

function onBack() {
  router.push({ name: 'home', params: { lang: lang.value } });
}
</script>

<style scoped>
.category-page {
  min-height: 100vh;
  background: var(--bg-main, var(--sunken));
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
  color: var(--neutral-700, var(--ink-2));
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.back-btn:hover {
  background: var(--bg-main, var(--sunken));
  border-color: rgba(16, 24, 40, 0.18);
}

.header-center {
  flex: 1;
  min-width: 0;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900, var(--ink));
  line-height: 1.3;
}

.header-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--neutral-500, var(--ink-3));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-steps {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px 10px;
}

@media (max-width: 640px) {
  .header-steps {
    padding: 0 16px 10px;
  }
}

/* ===== How to start (INV-101) ===== */
.start-choice {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 120px;
}

.start-choice__title {
  margin: 0 0 14px;
  font-size: 18px;
  font-weight: 600;
  color: var(--neutral-900, var(--ink));
}

.start-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.start-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(16, 24, 40, 0.1);
}

.start-card--resume {
  border-color: var(--brand-main, #334338);
}

.start-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--neutral-900, var(--ink));
}

.start-card__text {
  margin: 0;
  font-size: 14px;
  color: var(--neutral-700, var(--ink-2));
}

.start-card__summary {
  margin: 0;
  display: grid;
  gap: 6px;
  font-size: 14px;
}

.start-card__summary div {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.start-card__summary dt {
  font-weight: 500;
  color: var(--neutral-500, var(--ink-3));
}

.start-card__summary dt::after {
  content: ':';
}

.start-card__summary dd {
  margin: 0;
  color: var(--neutral-900, var(--ink));
  overflow-wrap: anywhere;
}

.start-card__action {
  margin-top: auto;
  align-self: flex-start;
  min-height: 44px;
  padding: 10px 22px;
  border-radius: 12px;
  border: 1.5px solid var(--brand-main, #334338);
  background: #fff;
  color: var(--brand-main, #334338);
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.start-card__action--main {
  background: var(--brand-main, #334338);
  color: #fff;
}

.start-card__action:focus-visible,
.state-btn:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

/* ===== Drafts: notices, account drafts, discard (INV-302) ===== */
.start-notices {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
}

.start-notices:empty {
  display: none;
}

.draft-notice {
  margin: 16px 0 0;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fffaeb;
  border: 1px solid #fedf89;
  color: #93370d;
  font-size: 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.draft-notice p {
  margin: 0;
  flex: 1 1 220px;
}

.draft-notice--plain {
  background: #fff;
  border-color: rgba(16, 24, 40, 0.1);
  color: var(--neutral-700, var(--ink-2));
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.start-choice__title:focus {
  outline: none;
}

.start-choice__title:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

.start-card__where,
.start-card__hint {
  margin: 0;
  font-size: 13px;
  color: var(--neutral-500, var(--ink-3));
}

.start-card__warn {
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fffaeb;
  border: 1px solid #fedf89;
  color: #93370d;
  font-size: 13px;
}

.start-card__buttons {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.start-card__buttons .start-card__action {
  margin-top: 0;
}

.start-card__action--danger {
  border-color: #b42318;
  color: #b42318;
}

.server-drafts {
  grid-column: 1 / -1;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.server-drafts > li {
  display: flex;
}

.server-drafts .start-card {
  flex: 1;
}

.picker-note {
  margin: 0 0 16px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(16, 24, 40, 0.1);
  font-size: 14px;
  color: var(--neutral-700, var(--ink-2));
}

.catalog-state {
  margin: 0 0 16px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid rgba(16, 24, 40, 0.1);
  font-size: 14px;
  color: var(--neutral-700, var(--ink-2));
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.catalog-state p {
  margin: 0;
  flex: 1 1 220px;
}

.catalog-state--error,
.catalog-state--warn {
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border-color: rgba(180, 35, 24, 0.18);
}

.state-btn {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid rgba(16, 24, 40, 0.18);
  background: #fff;
  color: var(--neutral-900, var(--ink));
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

@media (max-width: 640px) {
  .start-choice {
    padding: 16px 16px 120px;
  }
  .start-card__action {
    width: 100%;
    justify-content: center;
  }
}

/* ===== Birthday type choice ===== */
.type-choice {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 20px;
  text-align: center;
}

.type-choice-title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-700, var(--ink-2));
}

.type-options {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.type-option {
  padding: 9px 20px;
  border-radius: 22px;
  border: 1.5px solid rgba(16, 24, 40, 0.12);
  background: #fff;
  color: var(--neutral-700, var(--ink-2));
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-option:hover {
  border-color: var(--accent, var(--brand));
}

.type-option--on {
  background: var(--accent, var(--brand));
  border-color: var(--accent, var(--brand));
  color: #fff;
}

/* ===== Scrollable content ===== */
.content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 120px;
}

/* ===== Sticky footer ===== */
.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border-top: 1px solid rgba(16, 24, 40, 0.08);
  box-shadow: 0 -2px 8px rgba(16, 24, 40, 0.06);
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 36px;
  border: none;
  border-radius: 12px;
  background: var(--brand-main, #334338);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.action-btn:hover:not(:disabled) {
  background: var(--brand-dark, #263029);
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
    padding: 16px 16px 120px;
  }

  .footer-inner {
    padding: 12px 16px;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>

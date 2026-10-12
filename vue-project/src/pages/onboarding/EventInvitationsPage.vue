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
      <div v-if="!fromDashboard" class="header-steps">
        <CreationStepper :steps="steps" @go="goToStep" />
      </div>
    </header>

    <!-- Scrollable content -->
    <div class="content">
      <!-- INV-104: the designs are shown with the user's own basics -->
      <section v-if="!fromDashboard && categoryChosen" class="basics-summary" data-testid="basics-summary">
        <div v-if="personalization" class="basics-summary__text">
          <p class="basics-summary__category" data-testid="designs-category">{{ $t('onboarding.invitations.forCategory', { category: categoryLabel }) }}</p>
          <p class="basics-summary__names">{{ personalization.names }}</p>
          <p class="basics-summary__meta">{{ [personalization.date, personalization.place].filter(Boolean).join(' · ') }}</p>
        </div>
        <div v-else class="basics-summary__text">
          <p class="basics-summary__category" data-testid="designs-category">{{ $t('onboarding.invitations.forCategory', { category: categoryLabel }) }}</p>
          <p class="basics-summary__missing">{{ $t('onboarding.invitations.basicsMissing') }}</p>
        </div>
        <RouterLink class="basics-summary__edit" :to="{ name: 'EventBasicsPage', params: { lang } }">
          {{ personalization ? $t('onboarding.invitations.editBasics') : $t('onboarding.invitations.addBasics') }}
        </RouterLink>
      </section>

      <!-- Quick actions row -->
      <div v-if="categoryChosen" class="quick-actions">
        <button v-if="fromDashboard && currentInvitationPath" class="action-card action-card--edit" @click="onEditCurrent">
          <div class="action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">{{ $t('onboarding.invitations.editCurrent') }}</span>
            <span class="action-desc">{{ $t('onboarding.invitations.editDesc') || 'Change colors, fonts, content' }}</span>
          </div>
          <svg class="action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <button class="action-card action-card--build" @click="onOpenBuilder">
          <div class="action-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </div>
          <div class="action-text">
            <span class="action-title">{{ $t('onboarding.invitations.buildYourOwn') }}</span>
            <span class="action-desc">{{ $t('onboarding.invitations.buildDesc') || 'Mix and match sections freely' }}</span>
          </div>
          <svg class="action-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- INV-101: never a wedding catalogue standing in for a missing choice -->
      <div v-if="!categoryChosen" class="list-state" role="status" data-testid="designs-no-category">
        <p>{{ $t('onboarding.invitations.noCategory') }}</p>
        <RouterLink class="list-state__action" :to="{ name: 'EventCategoryPage', params: { lang } }">
          {{ $t('onboarding.invitations.chooseCategory') }}
        </RouterLink>
      </div>

      <div v-else-if="fetchLoading" class="loading-state">
        <span class="spinner" />
        <p>{{ $t('onboarding.invitations.loading') }}</p>
      </div>

      <div v-else-if="loadFailed" class="list-state list-state--error" role="alert" data-testid="designs-error">
        <p>{{ $t('onboarding.invitations.loadError') }}</p>
        <button type="button" class="list-state__action" @click="loadTemplates">{{ $t('onboarding.invitations.retry') }}</button>
      </div>

      <div v-else-if="!filteredInvitations.length" class="list-state" role="status" data-testid="designs-empty">
        <p>{{ $t('onboarding.invitations.emptyCategory', { category: categoryLabel }) }}</p>
        <RouterLink v-if="!fromDashboard" class="list-state__action" :to="{ name: 'EventCategoryPage', params: { lang } }">
          {{ $t('onboarding.invitations.chooseOtherCategory') }}
        </RouterLink>
      </div>

      <template v-else>
      <p v-if="sharedSectionsNote" class="shared-sections" data-testid="designs-shared-sections">
        {{ $t('onboarding.invitations.card.sharedSections') }}
      </p>
      <InvitationGrid
        class="grid-section"
        :invitations="filteredInvitations"
        :selected-id="onboardingStore.invitationName"
        :empty-message="$t('onboarding.invitations.emptyState')"
        :personalization="fromDashboard ? null : personalization"
        @select="onSelectInvitation"
        @preview="onPreview"
      />
      </template>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- INV-202: a design looked at on a phone or a desktop, in this page -->
    <TemplatePreviewDialog
      v-model:device="previewDevice"
      :open="!!previewTemplate"
      :name="previewTemplate?.name || ''"
      :src="previewSrc"
      :selected="!!previewTemplate && onboardingStore.invitationName === previewTemplate.id"
      :for-event="!!previewEventId"
      :own-basics="previewOwnBasics"
      :own-details="previewOwnDetails"
      @close="closePreview"
      @use="onUseFromPreview"
    />

    <OnboardingFooterLinks />
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import CategoryFilterBar from '@/components/onboarding/CategoryFilterBar.vue';
import InvitationGrid from '@/components/onboarding/InvitationGrid.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import OnboardingFooterLinks from '@/components/onboarding/OnboardingFooterLinks.vue';
import CreationStepper from '@/components/onboarding/CreationStepper.vue';
import { useCreationSteps } from '@/composables/useCreationSteps';
import { onboardingStore, setInvitationName, setInvitationPath, setEventId } from '@/store/onboarding.store';
import { eventsService } from '@/services/events.service';
import { isAuthenticated, getUsername } from '@/services/auth.service';
import { EventCategoryEnum } from '@/enums/EventCategory';
import { categoryLabelKey } from '@/helper/CategoryMapping.helper.js';
import { invitationTemplateService } from '@/services/invitationTemplate.service';
import { basicsDisplayName, hasBasics, normalizeBasics } from '@/utils/eventBasics';
import { templateTraits, allShareRendererSections } from '@/utils/templateCatalog';
import { hasOwnDetails } from '@/utils/creationSteps';
import { draftStore } from '@/store/invitationDraft.store';
import TemplatePreviewDialog from '@/components/onboarding/TemplatePreviewDialog.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');

const loading = ref(false);
const error = ref('');
// Inside the dashboard shell it is always the current event's design (INV-104
// keeps that path as it was); elsewhere it is a new invitation.
const fromDashboard = computed(() => route.query.from === 'dashboard' || route.name === 'dashboard.invitations');

/*
 * The category the designs are listed for. A new invitation without one is
 * sent back to choose it (INV-101) — showing the wedding designs instead would
 * quietly make it a wedding. The dashboard keeps its old default: the current
 * event's designs are opened from there with no onboarding category.
 */
const displayCategory = computed(() =>
  onboardingStore.selectedCategory || (fromDashboard.value ? EventCategoryEnum.WEDDING : '')
);
const categoryChosen = computed(() => !!displayCategory.value);
const categoryLabel = computed(() => {
  const key = categoryLabelKey(displayCategory.value);
  return key ? t(key) : displayCategory.value;
});

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

/**
 * The names, date and place entered before the design (INV-104), formatted
 * for the cards. Null until there are basics to show.
 */
const personalization = computed(() => {
  const basics = onboardingStore.eventDetails;
  const category = onboardingStore.selectedCategory;
  if (!hasBasics(basics, category)) return null;
  const b = normalizeBasics(basics);
  let date = b.date;
  try {
    // A calendar date, not an instant: formatted as is, in no zone.
    date = new Intl.DateTimeFormat(lang.value, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${b.date}T00:00:00Z`));
  } catch { /* unsupported locale — the ISO date */ }
  return {
    names: basicsDisplayName(b, category),
    date: b.time ? `${date}, ${b.time}` : date,
    place: b.location.name,
  };
});

/** The editor for a design, as a new event — never the dashboard's current one. */
function editorPath(path, extra) {
  const clean = path.startsWith('invitations/') ? path : 'invitations/' + path;
  return { path: `/${lang.value}/${clean}`, query: { new: '1', ...extra } };
}

const templates = ref([]);
const fetchLoading = ref(false);
const loadFailed = ref(false);

/*
 * INV-201: each card says what the design has — only what the code draws
 * (utils/templateCatalog). The description is the localized one for a design
 * the code knows, else the server's as typed, else none.
 */
const filteredInvitations = computed(() => {
  const mapped = templates.value.map(tpl => {
    const known = templateTraits(tpl.path);
    return {
      id: tpl.id,
      name: tpl.name,
      subtitle: known ? t(known.descriptionKey) : (tpl.description || ''),
      traits: known ? known.traits : [],
      thumbnailUrl: tpl.thumbnailImage || (tpl.path ? `/thumbnails/${tpl.path.split('/').pop()}.svg` : ''),
    };
  }).reverse();
  // Put the selected invitation first
  const sel = onboardingStore.invitationName;
  if (sel) {
    const idx = mapped.findIndex(i => i.id === sel);
    if (idx > 0) {
      const [item] = mapped.splice(idx, 1);
      mapped.unshift(item);
    }
  }
  return mapped;
});

// Said once above the cards, not repeated on each: every design the shared
// renderer opens has these sections.
const sharedSectionsNote = computed(() =>
  allShareRendererSections(templates.value.map(tpl => tpl.path))
);

async function loadTemplates() {
  if (!categoryChosen.value) return;
  fetchLoading.value = true;
  loadFailed.value = false;
  try {
    const data = await invitationTemplateService.listByCategory(displayCategory.value);
    templates.value = (data || []).filter(t => t.active !== false);

    // Preselect invitation: resolve stored name (path/slug from BE) to template id
    if (onboardingStore.invitationName) {
      const match = resolveTemplate(onboardingStore.invitationName);
      if (match) {
        setInvitationName(match.id);
        if (!fromDashboard.value && match.path) setInvitationPath(match.path);
      } else if (!fromDashboard.value) {
        // A design of another category (INV-101): not a choice for this one.
        setInvitationName('');
        setInvitationPath('');
      }
    }
  } catch (e) {
    // Said on the page, with a retry — not an empty list that reads as
    // "no designs for this category".
    console.error('Failed to load invitation templates:', e);
    loadFailed.value = true;
  } finally {
    fetchLoading.value = false;
  }
}

onMounted(loadTemplates);

// Match an invitationName (could be id, path, or slug) to a template
function resolveTemplate(name) {
  if (!name) return null;
  return templates.value.find(t =>
    t.id === name || t.path === name || t.slug === name ||
    t.name?.toLowerCase().replace(/\s+/g, '-') === name
  );
}

function onSelectInvitation(id) {
  setInvitationName(id);
  // Where the editor opens it, for the stepper's later steps (INV-102).
  const path = templates.value.find(t => t.id === id)?.path;
  if (!fromDashboard.value && path) setInvitationPath(path);
}

// The stepper (INV-102) — only when making a new invitation.
const { steps, go: goToStep } = useCreationSteps({
  current: 'design',
  handlers: {
    open: (step) => step === 'design',
    // No design yet: to the first card.
    fix: (step) => {
      if (step !== 'design') return false;
      document.querySelector('[data-testid="invitation-card-use"]')?.focus();
      return true;
    },
  },
});

/*
 * "Preview" on a card (INV-202): the design inside this page, on a phone or a
 * desktop, drawn by the page guests open (`preview=1&embed=1`). It only looks:
 * the choice, the draft and the place in the catalogue stay as they were
 * (the renderer does not record a previewed design, INV-201); "Use this design"
 * in the preview is the one explicit way to pick it from there.
 *
 * A new invitation shows what was entered so far, with sample content where
 * nothing is yet; the dashboard shows the current event's content.
 */
const previewId = ref('');
const previewDevice = ref(
  typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)')?.matches ? 'mobile' : 'desktop'
);
const previewTemplate = computed(() => templates.value.find(tpl => tpl.id === previewId.value) || null);
const previewEventId = computed(() => (fromDashboard.value ? onboardingStore.eventId || route.query.eventId || '' : ''));
const previewSrc = computed(() => {
  const inv = previewTemplate.value;
  if (!inv?.path) return '';
  const clean = inv.path.startsWith('invitations/') ? inv.path : 'invitations/' + inv.path;
  const query = previewEventId.value
    ? { preview: '1', embed: '1', eventId: previewEventId.value }
    : { new: '1', preview: '1', embed: '1' };
  return router.resolve({ path: `/${lang.value}/${clean}`, query }).href;
});
// What in the preview is the person's own, for its legend.
const previewOwnBasics = computed(() => !!personalization.value || !!draftStore.theme?.info);
const previewOwnDetails = computed(() => hasOwnDetails(draftStore));

function onPreview(id) {
  const inv = templates.value.find(tpl => tpl.id === id);
  if (!inv?.path) return;
  previewId.value = id;
}

function closePreview() {
  previewId.value = '';
}

function onUseFromPreview() {
  if (!previewId.value) return;
  onSelectInvitation(previewId.value);
  closePreview();
}

const currentInvitationPath = computed(() => {
  // Try onboarding store first, then match from loaded templates
  const name = onboardingStore.invitationName;
  if (!name) return '';
  const tpl = templates.value.find(t => t.id === name || t.path === name || t.name?.toLowerCase().replace(/\s+/g, '-') === name);
  const path = tpl?.path || name;
  // Ensure path starts with 'invitations/'
  return path.startsWith('invitations/') ? path : 'invitations/' + path;
});

function onEditCurrent() {
  const path = currentInvitationPath.value;
  if (!path) return;
  const eventId = onboardingStore.eventId || route.query.eventId || '';
  const url = `/${lang.value}/${path}?edit=true${eventId ? '&eventId=' + eventId : ''}`;
  router.push(url);
}

function onOpenBuilder() {
  if (fromDashboard.value) {
    router.push({ name: 'InvitationBuilderPage', params: { lang: lang.value } });
    return;
  }
  router.push(editorPath('invitations/my-wedding', { edit: 'true' }));
}

function onBack() {
  if (fromDashboard.value) {
    router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
  } else if (onboardingStore.selectedCategory) {
    // Back one step: the basics (INV-104).
    router.push({ name: 'EventBasicsPage', params: { lang: lang.value } });
  } else if (!isAuthenticated()) {
    router.push({ name: 'home', params: { lang: lang.value } });
  } else {
    router.push({ name: 'EventCategoryPage', params: { lang: lang.value } });
  }
}

async function onContinue() {
  if (!onboardingStore.invitationName) return;

  // Making a new invitation (INV-104): no account and no event yet. The
  // chosen design opens with the basics in it; details, programme, story,
  // photos and RSVP are added (or skipped) there, and the account is asked
  // for only when it is saved.
  if (!fromDashboard.value) {
    const selected = templates.value.find(t => t.id === onboardingStore.invitationName);
    const path = selected?.path || onboardingStore.invitationName;
    await router.push(editorPath(path, { edit: 'true' }));
    return;
  }

  error.value = '';
  loading.value = true;

  try {
    let eventId = onboardingStore.eventId;

    // Create event if it doesn't exist yet
    if (!eventId) {
      const payload = {
        name: 'New Event',
        categoryType: onboardingStore.selectedCategory,
        status: 'DRAFT',
        username: getUsername(),
        lang: lang.value,
      };
      const res = await eventsService.create(payload);
      eventId = res?.id || res?.eventId;
      setEventId(eventId);
    }

    // Attach selected invitation to the event
    if (eventId) {
      const selected = templates.value.find(t => t.id === onboardingStore.invitationName);
      const path = selected?.path || onboardingStore.invitationName;

      await eventsService.updateInvitation(eventId, {
        invitationName: path
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

.back-btn:hover:not(:disabled) {
  background: var(--bg-main, var(--sunken));
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

/* ===== Quick actions ===== */
.basics-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--line);
}

.basics-summary__text {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.basics-summary__names {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.basics-summary__meta {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}

.basics-summary__category {
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.list-state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--line);
  font-size: 14px;
  color: var(--ink-2);
}

.list-state p {
  margin: 0;
  flex: 1 1 240px;
}

.list-state--error {
  color: #b42318;
  background: rgba(180, 35, 24, 0.06);
  border-color: rgba(180, 35, 24, 0.18);
}

.list-state__action {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.list-state__action:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

.basics-summary__missing {
  margin: 0;
  font-size: 14px;
  color: var(--ink-2);
}

.basics-summary__edit {
  flex-shrink: 0;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--line-2);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.basics-summary__edit:focus-visible {
  outline: 3px solid var(--brand-gold, #c4956a);
  outline-offset: 2px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  text-align: left;
}
.action-card:hover {
  border-color: var(--line-2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.action-card--edit .action-icon { background: #ecfdf5; color: #059669; }
.action-card--build .action-icon { background: #f0f9ff; color: #0284c7; }

.action-text { flex: 1; min-width: 0; }
.action-title { display: block; font-size: 14px; font-weight: 600; color: var(--ink); }
.action-desc { display: block; font-size: 12px; color: var(--ink-4); margin-top: 1px; }

.action-arrow { color: var(--line-2); flex-shrink: 0; transition: transform 0.15s; }
.action-card:hover .action-arrow { transform: translateX(2px); color: var(--ink-4); }

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

.shared-sections {
  margin: 20px 0 0;
  font-size: 13px;
  color: var(--ink-2);
}

.shared-sections + .grid-section {
  margin-top: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--neutral-500, var(--ink-3));
  font-size: 14px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--brand-gold, #c4956a);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

/* Stepper (INV-102) */
.header-steps {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 24px 10px;
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .header-inner {
    padding: 10px 16px;
  }

  .header-steps {
    padding: 0 16px 10px;
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

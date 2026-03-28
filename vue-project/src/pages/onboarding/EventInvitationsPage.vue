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
      <!-- Edit current invitation (logged in, has invitation) -->
      <div v-if="fromDashboard && currentInvitationPath" class="builder-cta">
        <button class="builder-btn builder-btn--edit" @click="onEditCurrent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
          </svg>
          <span>{{ $t('onboarding.invitations.editCurrent') }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <!-- Build Your Own CTA -->
      <div class="builder-cta">
        <button class="builder-btn" @click="onOpenBuilder">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          <span>{{ $t('onboarding.invitations.buildYourOwn') }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <CategoryFilterBar
        :categories="categoryOptions"
        :model-value="displayCategory"
        :disabled="true"
      />

      <div v-if="fetchLoading" class="loading-state">
        <span class="spinner" />
        <p>{{ $t('onboarding.invitations.loading') }}</p>
      </div>

      <InvitationGrid
        v-else
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CategoryFilterBar from '@/components/onboarding/CategoryFilterBar.vue';
import InvitationGrid from '@/components/onboarding/InvitationGrid.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import OnboardingFooterLinks from '@/components/onboarding/OnboardingFooterLinks.vue';
import { onboardingStore, setInvitationName, setEventId } from '@/store/onboarding.store';
import { eventsService } from '@/services/events.service';
import { isAuthenticated, getUsername } from '@/services/auth.service';
import { EventCategoryEnum } from '@/enums/EventCategory';
import { invitationTemplateService } from '@/services/invitationTemplate.service';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');

const loading = ref(false);
const error = ref('');
const fromDashboard = computed(() => route.query.from === 'dashboard');

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

const templates = ref([]);
const fetchLoading = ref(false);

const filteredInvitations = computed(() => {
  const mapped = templates.value.map(t => ({
    id: t.id,
    name: t.name,
    thumbnailUrl: t.thumbnailImage || (t.path ? `/thumbnails/${t.path.split('/').pop()}.svg` : ''),
  })).reverse();
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

onMounted(async () => {
  fetchLoading.value = true;
  try {
    const data = await invitationTemplateService.listByCategory(displayCategory.value);
    templates.value = (data || []).filter(t => t.active !== false);

    // Preselect invitation: resolve stored name (path/slug from BE) to template id
    if (onboardingStore.invitationName) {
      const match = resolveTemplate(onboardingStore.invitationName);
      if (match) setInvitationName(match.id);
    }
  } catch (e) {
    console.error('Failed to load invitation templates:', e);
  } finally {
    fetchLoading.value = false;
  }
});

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
}

function onPreview(id) {
  const inv = templates.value.find(t => t.id === id);
  if (!inv?.path) return;
  const resolved = router.resolve(`/${lang.value}/${inv.path}?edit=true`);
  window.open(resolved.href, '_blank');
}

const currentInvitationPath = computed(() => {
  if (!onboardingStore.invitationName) return '';
  const tpl = templates.value.find(t => t.id === onboardingStore.invitationName);
  return tpl?.path || onboardingStore.invitationName;
});

function onEditCurrent() {
  const path = currentInvitationPath.value;
  if (!path) return;
  const eventId = onboardingStore.eventId || route.query.eventId || '';
  const url = `/${lang.value}/${path}?edit=true${eventId ? '&eventId=' + eventId : ''}`;
  router.push(url);
}

function onOpenBuilder() {
  router.push({ name: 'InvitationBuilderPage', params: { lang: lang.value } });
}

function onBack() {
  if (fromDashboard.value) {
    router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
  } else if (!isAuthenticated()) {
    router.push({ name: 'home', params: { lang: lang.value } });
  } else {
    router.push({ name: 'EventCategoryPage', params: { lang: lang.value } });
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
/* Builder CTA */
.builder-cta {
  margin-bottom: 20px;
}
.builder-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: inherit;
}
.builder-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
.builder-btn span { flex: 1; text-align: left; }
.builder-btn--edit {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 16px;
  color: var(--neutral-500, #6b7280);
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

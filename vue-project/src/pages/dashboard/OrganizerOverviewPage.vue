<template>
  <div class="org-page">
    <!-- Top bar -->
    <header class="org-topbar">
      <div class="topbar-brand">
        <span class="ivy-logo ivy-logo--inverse topbar-logo" role="img" aria-label="Ivy Events"></span>
      </div>
      <div class="topbar-actions">
        <button class="tb-btn tb-upgrade">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {{ t('organizerOverview.upgrade') }}
        </button>
        <button class="tb-btn tb-logout" @click="onLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {{ t('organizerOverview.logout') }}
        </button>
      </div>
    </header>

    <main class="org-content">
      <PageHeader :title="t('organizerOverview.title')" :subtitle="t('organizerOverview.subtitle')">
        <template #actions>
          <div class="header-btns">
          <button v-if="canManageUsers" class="btn-secondary" @click="openUserDialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          {{ t('organizerOverview.addUser') }}
          </button>
          <button class="btn-primary" @click="onCreateEvent">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ t('organizerOverview.createNew') }}
          </button>
          </div>
        </template>
      </PageHeader>

      <!-- Filters -->
      <section class="filters" :aria-label="t('organizerOverview.filtersTitle')">
        <input
          v-model="search"
          type="search"
          class="filter-input filter-search"
          :placeholder="t('organizerOverview.searchPlaceholder')"
          :aria-label="t('organizerOverview.searchPlaceholder')"
        />
        <select v-model="filters.status" class="filter-input" @change="reload">
          <option value="">{{ t('organizerOverview.allStatuses') }}</option>
          <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabel(s) }}</option>
        </select>

        <select v-model="filters.categoryType" class="filter-input" @change="reload">
          <option value="">{{ t('organizerOverview.allTypes') }}</option>
          <option v-for="c in categoryOptions" :key="c" :value="c">{{ formatCategory(c) }}</option>
        </select>

        <label class="filter-date">
          <span>{{ t('organizerOverview.dateFrom') }}</span>
          <input v-model="filters.from" type="date" class="filter-input" @change="reload" />
        </label>

        <label class="filter-date">
          <span>{{ t('organizerOverview.dateTo') }}</span>
          <input v-model="filters.to" type="date" class="filter-input" @change="reload" />
        </label>

        <button v-if="hasActiveFilters" class="filter-clear" @click="clearFilters">
          {{ t('organizerOverview.resetFilters') }}
        </button>

        <!-- Last in the row and pushed right: it changes how the same events
             are drawn, not which of them are shown. -->
        <div class="view-switch" role="group" :aria-label="t('organizerOverview.viewLabel')">
          <button
            type="button" :class="{ on: view === 'table' }" :aria-pressed="view === 'table'"
            @click="setView('table')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
            {{ t('organizerOverview.viewTable') }}
          </button>
          <button
            type="button" :class="{ on: view === 'cards' }" :aria-pressed="view === 'cards'"
            @click="setView('cards')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            {{ t('organizerOverview.viewCards') }}
          </button>
        </div>
      </section>

      <p v-if="error" class="load-error">{{ t('organizerOverview.loadFailed') }}</p>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>{{ t('organizerOverview.loading') }}</p>
      </div>

      <template v-else-if="events.length">
        <!-- Summary cards -->
        <div class="summary-row">
          <div class="summary-card"><span class="summary-value">{{ events.length }}</span><span class="summary-label">{{ t('organizerOverview.totalEvents') }}</span></div>
          <div class="summary-card"><span class="summary-value">{{ totalGuests }}</span><span class="summary-label">{{ t('organizerOverview.totalGuests') }}</span></div>
          <div class="summary-card"><span class="summary-value">{{ upcomingCount }}</span><span class="summary-label">{{ t('organizerOverview.upcoming') }}</span></div>
          <div class="summary-card"><span class="summary-value">{{ avgRsvpRate === null ? '—' : avgRsvpRate + '%' }}</span><span class="summary-label">{{ t('organizerOverview.rsvpRate') }}</span></div>
        </div>

        <!--
          Two readings of the same list, because an agency asks two questions.

          The table is the default: with thirty weddings on the books the daily
          question is comparative — who is behind, which one has no answers yet,
          which of my organizers is carrying them. The cards answer the other
          one, "what needs me today", by grouping instead of sorting. Neither is
          a subset of the other, so the choice is remembered.
        -->
        <EventsTable
          v-if="view === 'table' && visibleCount"
          :events="searched"
          :urgent-ids="attentionIds"
          :organizer-names="organizerNames"
          :is-done="isDone"
          :rsvp-percent="rsvpPercent"
          :invited-count="invitedCount"
          @open="onManage"
        />

        <template v-else-if="view === 'cards'">
        <section v-if="needsAttention.length" class="ev-group ev-group--urgent">
          <h2 class="ev-group-title">
            {{ t('organizerOverview.needsAttention') }}
            <span class="ev-group-count">{{ needsAttention.length }}</span>
          </h2>
          <div class="ev-grid">
            <EventCard
              v-for="ev in needsAttention" :key="ev.id" :event="ev" urgent
              @open="onManage(ev)" @pin="togglePin(ev.id)"
            />
          </div>
        </section>

        <section v-if="pinnedGroup.length" class="ev-group">
          <h2 class="ev-group-title">{{ t('organizerOverview.pinnedSection') }}</h2>
          <div class="ev-grid">
            <EventCard
              v-for="ev in pinnedGroup" :key="ev.id" :event="ev"
              @open="onManage(ev)" @pin="togglePin(ev.id)"
            />
          </div>
        </section>

        <section v-if="upcomingGroup.length" class="ev-group">
          <h2 class="ev-group-title">{{ t('organizerOverview.upcomingSection') }}</h2>
          <div class="ev-grid">
            <EventCard
              v-for="ev in upcomingGroup" :key="ev.id" :event="ev"
              @open="onManage(ev)" @pin="togglePin(ev.id)"
            />
          </div>
        </section>

        <!-- Compact: a finished event is worth finding, not worth the space of
             one that still needs work. -->
        <section v-if="completedGroup.length" class="ev-group">
          <h2 class="ev-group-title">{{ t('organizerOverview.completedSection') }}</h2>
          <div class="ev-grid ev-grid--compact">
            <EventCard
              v-for="ev in completedGroup" :key="ev.id" :event="ev" compact
              @open="onManage(ev)" @pin="togglePin(ev.id)"
            />
          </div>
        </section>
        </template>

        <!-- The search box hides events without reloading, so "no results" can
             happen in either view. The way out is the same in both. -->
        <p v-if="!visibleCount" class="empty-state">
          {{ t('organizerOverview.noneMatch') }}
          <button class="filter-clear" @click="clearSearchAndFilters">
            {{ t('organizerOverview.resetFilters') }}
          </button>
        </p>
      </template>

      <!-- Nothing matched the filters — different from having no events at all,
           and the way out is to clear the filters, not to create an event. -->
      <div v-else-if="hasActiveFilters" class="empty-state">
        <p>{{ t('organizerOverview.noMatch') }}</p>
        <button class="btn-secondary" @click="clearFilters">{{ t('organizerOverview.resetFilters') }}</button>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <h3>{{ t('organizerOverview.emptyTitle') }}</h3>
        <p>{{ t('organizerOverview.emptyDesc') }}</p>
        <button class="btn-primary" @click="onCreateEvent">{{ t('organizerOverview.createFirst') }}</button>
      </div>
    </main>

    <!-- Create User Dialog -->
    <div v-if="userDialogOpen" class="dialog-backdrop" @click.self="closeUserDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ t('organizerOverview.addUser') }}</h3>
          <button class="dialog-close" @click="closeUserDialog">&times;</button>
        </div>
        <div class="dialog-body">
          <p v-if="userFormError" class="form-error">{{ userFormError }}</p>

          <label class="field-label">{{ t('organizerOverview.firstName') }}</label>
          <input v-model="userForm.firstName" class="field-input" type="text" />

          <label class="field-label">{{ t('organizerOverview.lastName') }}</label>
          <input v-model="userForm.lastName" class="field-input" type="text" />

          <label class="field-label">{{ t('organizerOverview.email') }}</label>
          <input v-model="userForm.email" class="field-input" type="email" />

          <label class="field-label">{{ t('organizerOverview.role') }}</label>
          <div class="role-options">
            <label v-for="r in userRoleOptions" :key="r" class="role-chip" :class="{ 'role-chip--active': userForm.role === r }">
              <input type="radio" :value="r" v-model="userForm.role" class="sr-only" />
              {{ r }}
            </label>
          </div>

          <label class="field-label">{{ t('organizerOverview.assignEvent') }}</label>
          <select v-model="userForm.eventId" class="field-input">
            <option value="">{{ t('organizerOverview.selectEvent') }}</option>
            <option v-for="ev in events" :key="ev.id" :value="ev.id">{{ ev.name || t('organizerOverview.untitled') }}</option>
          </select>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeUserDialog">{{ t('organizerOverview.cancel') }}</button>
          <button class="btn-primary" :disabled="userSaving" @click="saveUser">
            {{ userSaving ? '...' : t('organizerOverview.create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import EventCard from "@/components/dashboard/organizer/EventCard.vue";
import EventsTable from "@/components/dashboard/EventsTable.vue";
import { analyticsService } from '@/services/analytics.service';
import { agencyTeamService } from '@/services/agencyTeam.service';
import { createAdminUser } from '@/services/userService';
import { hasRole, logout } from '@/services/auth.service';
import { selectEvent } from '@/services/eventSelection.service';
import { clearOnboarding } from '@/store/onboarding.store';
import useWorkspaceEvents from '@/composables/useWorkspaceEvents';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || 'mk');

// No role gate: the workspace endpoint already returns only what the caller may
// open. A collaborator with two events needs this list as much as an organizer
// does, and someone with none gets the empty state rather than a redirect loop.
const { rows, events, filters, loading, error, load, resetFilters, togglePin } = useWorkspaceEvents();

// Kept exactly as wide as it was before the page stopped being organizer-only,
// so nobody who could see this button loses it. It is not a claim that both
// roles can use it — the endpoint behind it is ADMIN-only.
const canManageUsers = hasRole('ADMIN') || hasRole('AGENCY_MEMBER');

const analytics = ref(null);

/* ---- Table or cards ---- */

const VIEW_KEY = 'ivy.agencyEvents.view';

/**
 * Remembered per browser, because it is a working habit rather than a setting:
 * whoever lives in the table wants the table tomorrow too. A broken or blocked
 * localStorage falls back to the default rather than failing the page.
 */
function storedView() {
  try {
    const saved = localStorage.getItem(VIEW_KEY);
    return saved === 'cards' || saved === 'table' ? saved : 'table';
  } catch {
    return 'table';
  }
}

const view = ref(storedView());

function setView(next) {
  view.value = next;
  try {
    localStorage.setItem(VIEW_KEY, next);
  } catch {
    // A remembered preference is a convenience. Losing it is not worth an error.
  }
}

/**
 * Keycloak user id → display name, for the table's organizer column.
 *
 * <p>Loaded once per visit rather than per row: forty events would otherwise be
 * forty lookups of a team of four. Left empty for anyone the team endpoint
 * refuses (it is ORG_ADMIN-only), and the table drops the column rather than
 * printing a dash beside every event.
 */
const organizerNames = ref({});

async function loadOrganizers() {
  if (!hasRole('AGENCY') && !hasRole('ADMIN')) return;
  try {
    const response = await agencyTeamService.workload({ sort: 'NAME', direction: 'ASC', max: 200 });
    const directory = response?.data ?? response ?? {};
    const named = {};
    (directory.rows || []).forEach((row) => {
      named[row.id] = [row.firstName, row.lastName].filter(Boolean).join(' ') || row.email;
    });
    organizerNames.value = named;
  } catch {
    organizerNames.value = {};
  }
}

const statusOptions =['DRAFT', 'PENDING', 'ACTIVE', 'ARCHIVED'];
const categoryOptions = ['WEDDING', 'BIRTHDAY', 'ENGAGEMENT', 'CORPORATE', 'BABY_SHOWER', 'GALLERY', 'OTHER'];

const hasActiveFilters = computed(() =>
  Object.values(filters).some(Boolean) || search.value.trim().length > 0);

/** The one button clears both. Two ways to hide events and one way to stop is
 *  how somebody ends up staring at an empty page. */
function clearSearchAndFilters() {
  search.value = '';
  clearFilters();
}

function statusLabel(status) {
  const key = `organizerOverview.statuses.${status || 'DRAFT'}`;
  const label = t(key);
  return label === key ? String(status || '').toLowerCase() : label;
}

onMounted(() => {
  reload();
  // The team does not change when a filter does, so it is not part of reload().
  loadOrganizers();
});

async function reload() {
  await load();
  await loadMetrics();
}

async function clearFilters() {
  resetFilters();
  await reload();
}

/**
 * One request for every number on this screen.
 *
 * <p>This used to fire two calls per event — eighty for a forty-event agency,
 * to fill four cards. The backend now groups it (IVY-105), which also means the
 * response rate is computed once, from a stated denominator, instead of being
 * re-derived here.
 */
async function loadMetrics() {
  try {
    const response = await analyticsService.workspace(filters);
    analytics.value = response?.data ?? response ?? null;
  } catch {
    analytics.value = null;
  }
}

/** Per-event metrics, keyed so the table can look its row up. */
const metricsByEvent = computed(() => {
  const map = {};
  (analytics.value?.events || []).forEach(m => { map[m.eventId] = m; });
  return map;
});

const enrichedEvents = computed(() =>
  rows.value.map(({ event, pinned }) => ({
    ...event,
    pinned,
    metrics: metricsByEvent.value[event.id || event.eventId] || null
  }))
);

const totalGuests = computed(() => analytics.value?.totals?.guestCount ?? 0);
const upcomingCount = computed(() => analytics.value?.totals?.upcomingCount ?? 0);

/** Null means nobody has been invited yet, which is not the same as zero. */
const avgRsvpRate = computed(() => analytics.value?.totals?.responseRate ?? null);

/** Everyone who was actually invited — the denominator the backend documents. */
function invitedCount(ev) {
  const m = ev.metrics;
  if (!m) return 0;
  return (m.confirmedCount || 0) + (m.declinedCount || 0) + (m.awaitingCount || 0);
}

function rsvpPercent(ev, key) {
  const asked = invitedCount(ev);
  return asked ? Math.round(((ev.metrics[key] || 0) / asked) * 100) : 0;
}

/** Typed locally. The workspace call already returned this person's events; a
 *  round trip per keystroke to re-filter a list that is already in memory buys
 *  nothing and makes the field feel slow. */
const search = ref("");

const searched = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return enrichedEvents.value;
  return enrichedEvents.value.filter((ev) =>
    [ev.name, ev.location?.name, ev.location?.city]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(term)));
});

/** Whole days from midnight, so "this week" does not shift with the clock. */
function daysUntilEvent(ev) {
  const raw = ev.date || ev.eventDate;
  if (!raw) return null;
  const day = new Date(raw);
  day.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((day - today) / 86400000);
}

const isDone = (ev) => {
  const days = daysUntilEvent(ev);
  return String(ev.status || "").toUpperCase() === "COMPLETED" || (days !== null && days < 0);
};

/**
 * The only section that earns its place at the top: something is overdue, or
 * the event is close enough that a missing answer is now a problem.
 *
 * <p>Deliberately narrow. A "needs attention" list that includes everything is
 * a list nobody reads twice.
 */
const needsAttention = computed(() => searched.value.filter((ev) => {
  if (isDone(ev)) return false;
  const days = daysUntilEvent(ev);
  const overdue = ev.metrics?.overdueTaskCount || 0;
  const invited = invitedCount(ev);
  const awaiting = ev.metrics?.awaitingCount || 0;
  const soonAndUnanswered = days !== null && days <= 14 && invited > 0 && awaiting > 0;
  return overdue > 0 || soonAndUnanswered;
}));

const attentionIds = computed(() => new Set(needsAttention.value.map((ev) => ev.id)));

// Each event appears in exactly one section. Repeating a card lower down makes
// the page look longer than the work actually is.
const pinnedGroup = computed(() =>
  searched.value.filter((ev) => ev.pinned && !attentionIds.value.has(ev.id) && !isDone(ev)));

const upcomingGroup = computed(() =>
  searched.value
    .filter((ev) => !ev.pinned && !attentionIds.value.has(ev.id) && !isDone(ev))
    .sort((a, b) => (daysUntilEvent(a) ?? 1e9) - (daysUntilEvent(b) ?? 1e9)));

const completedGroup = computed(() =>
  searched.value
    .filter((ev) => isDone(ev) && !attentionIds.value.has(ev.id))
    .sort((a, b) => (daysUntilEvent(b) ?? -1e9) - (daysUntilEvent(a) ?? -1e9)));

const visibleCount = computed(() =>
  needsAttention.value.length + pinnedGroup.value.length
  + upcomingGroup.value.length + completedGroup.value.length);

function onManage(ev) {
  selectEvent(ev);
  router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
}

function onCreateEvent() {
  router.push({ name: 'EventCategoryPage', params: { lang: lang.value } });
}

function onLogout() {
  logout();
  clearOnboarding();
  router.push(`/${lang.value}/auth/login`);
}

/* ---- Create User Dialog ---- */
const userDialogOpen = ref(false);
const userSaving = ref(false);
const userFormError = ref('');
const userRoleOptions = ['USER', 'AGENCY_MEMBER'];

const defaultUserForm = () => ({ firstName: '', lastName: '', email: '', role: 'USER', eventId: '' });
const userForm = ref(defaultUserForm());

function openUserDialog() {
  userForm.value = defaultUserForm();
  userFormError.value = '';
  userDialogOpen.value = true;
}

function closeUserDialog() {
  userDialogOpen.value = false;
}

async function saveUser() {
  userFormError.value = '';
  if (!userForm.value.firstName.trim()) { userFormError.value = t('organizerOverview.errFirstName'); return; }
  if (!userForm.value.lastName.trim()) { userFormError.value = t('organizerOverview.errLastName'); return; }
  if (!userForm.value.email.trim()) { userFormError.value = t('organizerOverview.errEmail'); return; }

  const payload = {
    firstName: userForm.value.firstName.trim(),
    lastName: userForm.value.lastName.trim(),
    email: userForm.value.email.trim(),
    roles: [userForm.value.role],
    eventIds: userForm.value.eventId ? [userForm.value.eventId] : null,
  };

  userSaving.value = true;
  try {
    await createAdminUser(payload);
    closeUserDialog();
  } catch (e) {
    userFormError.value = e.message || 'Failed to create user';
  } finally {
    userSaving.value = false;
  }
}

function formatCategory(cat) {
  if (!cat) return '';
  const key = `eventCategories.${cat.toLowerCase()}`;
  const val = t(key);
  return val !== key ? val : cat.charAt(0) + cat.slice(1).toLowerCase();
}

</script>

<style scoped>
.org-page {
  min-height: 100vh;
  background: #faf8f4;
}

/* ---- Top bar ---- */
.org-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid var(--line);
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-logo {
  --logo-h: 28px;
}

.topbar-actions { display: flex; gap: 8px; align-items: center; }

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
}

.tb-upgrade {
  background: linear-gradient(135deg, #b8954e, #9a7a3e);
  color: #fff;
}

.tb-upgrade:hover { filter: brightness(1.1); }

.tb-logout {
  background: transparent;
  color: var(--ink-3);
  border: 1.5px solid var(--line);
}

.tb-logout:hover { border-color: var(--line-2); color: #1a1a1a; }

/* ---- Content ---- */
.org-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.page-subtitle { font-size: 14px; color: var(--ink-3); margin: 4px 0 0; }

.header-btns { display: flex; gap: 10px; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--brand);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.btn-primary:hover { background: #4a6a42; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fff;
  color: #1a1a1a;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn-secondary:hover { border-color: var(--brand); color: var(--brand); }

/* ---- Loading ---- */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 0; color: var(--ink-3); font-size: 14px; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--line); border-top-color: var(--brand); border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---- Filters ---- */
.filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; margin-bottom: 24px; }
.filter-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #1a1a1a;
}
.filter-input:focus { outline: 2px solid var(--brand); outline-offset: -1px; }
.filter-date { display: flex; flex-direction: column; gap: 4px; }
.filter-date span { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); }
.filter-clear {
  height: 38px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-3);
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}
.filter-clear:hover { color: #1a1a1a; }
.load-error { color: #b91c1c; font-size: 13px; margin: 0 0 16px; }

/* ---- View switch ---- */
/* `margin-left: auto` inside the wrapping filter row: it sits at the right end
   of whatever line it lands on, and drops under the filters on a narrow screen
   instead of squeezing them. */
.view-switch {
  display: inline-flex;
  margin-left: auto;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  height: 38px;
}

.view-switch button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  border: none;
  background: none;
  font-size: 13px;
  color: var(--ink-3);
  cursor: pointer;
}

.view-switch button + button { border-left: 1px solid var(--line); }
.view-switch button:hover { color: #1a1a1a; }
.view-switch button.on { background: var(--brand); color: #fff; }
.view-switch button:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; }

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

/* ---- Summary ---- */
.summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
.summary-card { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
.summary-value { font-family: var(--font-display); font-size: 28px; font-weight: 700; color: #1a1a1a; }
.summary-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); }

/* ---- Empty ---- */
.empty-state { text-align: center; padding: 80px 24px; color: var(--ink-3); }
.empty-state svg { opacity: 0.3; margin-bottom: 16px; }
.empty-state h3 { font-size: 18px; color: #1a1a1a; margin: 0 0 8px; }
.empty-state p { font-size: 14px; margin: 0 0 24px; }

/* ---- Dialog ---- */
.dialog-backdrop { position: fixed; inset: 0; z-index: 200; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; padding: 24px; }
.dialog { background: #fff; border-radius: 16px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); }
.dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.dialog-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: #1a1a1a; }
.dialog-close { background: none; border: none; font-size: 24px; color: var(--ink-4); cursor: pointer; padding: 0; line-height: 1; }
.dialog-close:hover { color: #1a1a1a; }
.dialog-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 6px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--sunken); }

.field-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-3); margin-top: 8px; }
.field-input { width: 100%; border: 1.5px solid var(--line); border-radius: 8px; padding: 10px 12px; font-size: 14px; color: #1a1a1a; outline: none; transition: border-color 0.15s; background: #fff; }
.field-input:focus { border-color: var(--brand); }

.role-options { display: flex; gap: 8px; margin-top: 4px; }
.role-chip { display: inline-flex; align-items: center; padding: 6px 16px; border: 1.5px solid var(--line); border-radius: 20px; font-size: 13px; font-weight: 500; color: var(--ink-3); cursor: pointer; transition: all 0.15s; }
.role-chip--active { border-color: var(--brand); color: var(--brand); background: rgba(90, 122, 82, 0.06); }
.role-chip:hover { border-color: var(--line-2); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

.btn-cancel { padding: 8px 18px; border: 1.5px solid var(--line); border-radius: 8px; background: #fff; font-size: 14px; color: var(--ink-3); cursor: pointer; }
.btn-cancel:hover { border-color: var(--line-2); }

.form-error { background: #fef2f2; color: #dc2626; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 4px; }

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); }
    .header-btns { width: 100%; }
  .header-btns .btn-primary,
  .header-btns .btn-secondary { flex: 1; justify-content: center; }
  .org-topbar { padding: 0 16px; }
  .org-content { padding: 24px 16px 48px; }
}
/* ── Event card sections ──────────────────────────────────────────────
   The page container is max-width 960px with 24px of padding, so the widest
   the content ever gets is 912px. Three columns with a 16px gap put each card
   at (912 - 32) / 3 ≈ 293px — wide enough for a date and a venue on one line,
   which is what decides the lower bound. Four would drop that to ~213px and
   start wrapping "14 September 2026".

   Breakpoints are on the viewport but derived from that container: content is
   viewport minus 48px until the 960px cap, so 960 is where three columns fit
   and 620 is where two stop fitting. Stated as numbers rather than auto-fill
   because "three at most" is a decision, and auto-fill would silently become
   four the day somebody widens the container. */
.ev-group { margin-bottom: 2rem; }

.ev-group-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.75rem;
}

.ev-group-count {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: #f0e2cf;
  color: #8a5300;
}

.ev-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 620px) {
  .ev-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 960px) {
  .ev-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

/* Finished events carry no stats and no hero, so they stay legible narrower
   and one more fits per row. */
@media (min-width: 620px) {
  .ev-grid--compact { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 960px) {
  .ev-grid--compact { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

</style>

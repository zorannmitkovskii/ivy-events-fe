<template>
  <div class="org-page">
    <!-- Top bar -->
    <header class="org-topbar">
      <div class="topbar-brand">
        <img src="/logoInv.svg" alt="Ivy Events" class="topbar-logo" />
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
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ t('organizerOverview.title') }}</h1>
          <p class="page-subtitle">{{ t('organizerOverview.subtitle') }}</p>
        </div>
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
      </header>

      <!-- Filters -->
      <section class="filters" :aria-label="t('organizerOverview.filtersTitle')">
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

        <!-- Events table -->
        <div class="table-wrap">
          <table class="events-table">
            <thead>
              <tr>
                <th class="col-pin"><span class="sr-only">{{ t('organizerOverview.pinnedBadge') }}</span></th>
                <th>{{ t('organizerOverview.colEvent') }}</th>
                <th>{{ t('organizerOverview.colDate') }}</th>
                <th>{{ t('organizerOverview.colStatus') }}</th>
                <th>{{ t('organizerOverview.colGuests') }}</th>
                <th>{{ t('organizerOverview.colRsvp') }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ev in enrichedEvents" :key="ev.id" class="event-row" @click="onManage(ev)">
                <td class="cell-pin">
                  <button
                    class="pin-btn"
                    :class="{ 'pin-btn--on': ev.pinned }"
                    :aria-pressed="ev.pinned"
                    :title="ev.pinned ? t('organizerOverview.unpin') : t('organizerOverview.pin')"
                    @click.stop="togglePin(ev.id)"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" :fill="ev.pinned ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
                  </button>
                </td>
                <td class="cell-event">
                  <span class="ev-name">{{ ev.name || t('organizerOverview.untitled') }}</span>
                  <span class="ev-category">{{ formatCategory(ev.categoryType) }}</span>
                </td>
                <td class="cell-date">{{ formatDate(ev.date || ev.eventDate) }}</td>
                <td><span class="status-pill" :class="'pill--' + (ev.status || 'draft').toLowerCase()">{{ statusLabel(ev.status) }}</span></td>
                <td class="cell-guests"><span class="guests-num">{{ ev.metrics?.guestCount ?? '—' }}</span></td>
                <td class="cell-rsvp">
                  <div v-if="ev.metrics && invitedCount(ev)" class="rsvp-bar-wrap">
                    <div class="rsvp-bar">
                      <div class="rsvp-seg rsvp-accepted" :style="{ width: rsvpPercent(ev, 'confirmedCount') + '%' }"></div>
                      <div class="rsvp-seg rsvp-maybe" :style="{ width: rsvpPercent(ev, 'awaitingCount') + '%' }"></div>
                      <div class="rsvp-seg rsvp-declined" :style="{ width: rsvpPercent(ev, 'declinedCount') + '%' }"></div>
                    </div>
                    <span class="rsvp-nums">{{ ev.metrics.confirmedCount }}/{{ invitedCount(ev) }}</span>
                  </div>
                  <span v-else class="rsvp-empty">—</span>
                </td>
                <td class="cell-action">
                  <button class="btn-manage" @click.stop="onManage(ev)">
                    {{ t('organizerOverview.manage') }}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { analyticsService } from '@/services/analytics.service';
import { createAdminUser } from '@/services/userService';
import { hasRole, logout } from '@/services/auth.service';
import { selectEvent } from '@/services/eventSelection.service';
import { clearOnboarding } from '@/store/onboarding.store';
import useWorkspaceEvents from '@/composables/useWorkspaceEvents';

const { t, locale } = useI18n();
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
const canManageUsers = hasRole('ADMIN') || hasRole('ORGANIZER');

const analytics = ref(null);

const statusOptions =['DRAFT', 'PENDING', 'ACTIVATED', 'ACHIVED'];
const categoryOptions = ['WEDDING', 'BIRTHDAY', 'ENGAGEMENT', 'CORPORATE', 'BABY_SHOWER', 'GALLERY', 'OTHER'];

const hasActiveFilters = computed(() => Object.values(filters).some(Boolean));

function statusLabel(status) {
  const key = `organizerOverview.statuses.${status || 'DRAFT'}`;
  const label = t(key);
  return label === key ? String(status || '').toLowerCase() : label;
}

onMounted(reload);

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
const userRoleOptions = ['USER', 'ORGANIZER'];

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

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale.value === 'mk' ? 'mk-MK' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
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
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 50;
}

.topbar-logo { height: 28px; }

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
  color: #6b7280;
  border: 1.5px solid #e5e7eb;
}

.tb-logout:hover { border-color: #d1d5db; color: #1a1a1a; }

/* ---- Content ---- */
.org-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.page-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.page-subtitle { font-size: 14px; color: #6b7280; margin: 4px 0 0; }

.header-btns { display: flex; gap: 10px; }

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #5a7a52;
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
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}

.btn-secondary:hover { border-color: #5a7a52; color: #5a7a52; }

/* ---- Loading ---- */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 0; color: #6b7280; font-size: 14px; }
.spinner { width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #5a7a52; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---- Filters ---- */
.filters { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; margin-bottom: 24px; }
.filter-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #1a1a1a;
}
.filter-input:focus { outline: 2px solid #5a7a52; outline-offset: -1px; }
.filter-date { display: flex; flex-direction: column; gap: 4px; }
.filter-date span { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
.filter-clear {
  height: 38px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 13px;
  cursor: pointer;
  text-decoration: underline;
}
.filter-clear:hover { color: #1a1a1a; }
.load-error { color: #b91c1c; font-size: 13px; margin: 0 0 16px; }

/* ---- Pin ---- */
.col-pin { width: 44px; }
.cell-pin { padding-left: 16px; }
.pin-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #c4c4c4;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.pin-btn:hover { background: #f3f4f6; color: #6b7280; }
.pin-btn--on { color: #b8954e; }
.pin-btn--on:hover { color: #9a7a3e; }

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
.summary-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 4px; }
.summary-value { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #1a1a1a; }
.summary-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }

/* ---- Table ---- */
.table-wrap { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
.events-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.events-table thead { background: #fafafa; }
.events-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
.event-row { cursor: pointer; transition: background 0.12s; }
.event-row:hover { background: rgba(90, 122, 82, 0.03); }
.event-row td { padding: 16px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
.event-row:last-child td { border-bottom: none; }
.cell-event { min-width: 180px; }
.ev-name { display: block; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
.ev-category { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
.cell-date { white-space: nowrap; color: #6b7280; }
.status-pill { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.pill--active { background: rgba(90, 122, 82, 0.12); color: #5a7a52; }
.pill--draft { background: rgba(184, 149, 78, 0.12); color: #b8954e; }
.pill--cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.cell-guests { text-align: center; }
.guests-num { font-weight: 600; color: #1a1a1a; }
.cell-rsvp { min-width: 140px; }
.rsvp-bar-wrap { display: flex; align-items: center; gap: 8px; }
.rsvp-bar { flex: 1; height: 6px; border-radius: 3px; background: #f3f4f6; display: flex; overflow: hidden; }
.rsvp-seg { height: 100%; transition: width 0.3s; }
.rsvp-accepted { background: #5a7a52; }
.rsvp-maybe { background: #b8954e; }
.rsvp-declined { background: #ef4444; }
.rsvp-nums { font-size: 12px; color: #6b7280; white-space: nowrap; }
.rsvp-empty { color: #d1d5db; }
.cell-action { text-align: right; }
.btn-manage { display: inline-flex; align-items: center; gap: 4px; padding: 6px 14px; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 13px; font-weight: 500; color: #1a1a1a; cursor: pointer; transition: all 0.15s; }
.btn-manage:hover { border-color: #5a7a52; color: #5a7a52; }

/* ---- Empty ---- */
.empty-state { text-align: center; padding: 80px 24px; color: #6b7280; }
.empty-state svg { opacity: 0.3; margin-bottom: 16px; }
.empty-state h3 { font-size: 18px; color: #1a1a1a; margin: 0 0 8px; }
.empty-state p { font-size: 14px; margin: 0 0 24px; }

/* ---- Dialog ---- */
.dialog-backdrop { position: fixed; inset: 0; z-index: 200; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; padding: 24px; }
.dialog { background: #fff; border-radius: 16px; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); }
.dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.dialog-header h3 { font-size: 18px; font-weight: 600; margin: 0; color: #1a1a1a; }
.dialog-close { background: none; border: none; font-size: 24px; color: #9ca3af; cursor: pointer; padding: 0; line-height: 1; }
.dialog-close:hover { color: #1a1a1a; }
.dialog-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 6px; }
.dialog-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid #f3f4f6; }

.field-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; margin-top: 8px; }
.field-input { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 14px; color: #1a1a1a; outline: none; transition: border-color 0.15s; background: #fff; }
.field-input:focus { border-color: #5a7a52; }

.role-options { display: flex; gap: 8px; margin-top: 4px; }
.role-chip { display: inline-flex; align-items: center; padding: 6px 16px; border: 1.5px solid #e5e7eb; border-radius: 20px; font-size: 13px; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.15s; }
.role-chip--active { border-color: #5a7a52; color: #5a7a52; background: rgba(90, 122, 82, 0.06); }
.role-chip:hover { border-color: #d1d5db; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }

.btn-cancel { padding: 8px 18px; border: 1.5px solid #e5e7eb; border-radius: 8px; background: #fff; font-size: 14px; color: #6b7280; cursor: pointer; }
.btn-cancel:hover { border-color: #d1d5db; }

.form-error { background: #fef2f2; color: #dc2626; padding: 8px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 4px; }

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); }
  .page-header { flex-direction: column; }
  .header-btns { width: 100%; }
  .header-btns .btn-primary,
  .header-btns .btn-secondary { flex: 1; justify-content: center; }
  .table-wrap { overflow-x: auto; }
  .events-table { min-width: 640px; }
  .org-topbar { padding: 0 16px; }
  .org-content { padding: 24px 16px 48px; }
}
</style>

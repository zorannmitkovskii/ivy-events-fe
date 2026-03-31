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
          <button class="btn-secondary" @click="openUserDialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            {{ t('organizerOverview.addUser') }}
          </button>
          <button class="btn-primary" @click="onCreateEvent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ t('organizerOverview.createNew') }}
          </button>
        </div>
      </header>

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
          <div class="summary-card"><span class="summary-value">{{ avgRsvpRate }}%</span><span class="summary-label">{{ t('organizerOverview.rsvpRate') }}</span></div>
        </div>

        <!-- Events table -->
        <div class="table-wrap">
          <table class="events-table">
            <thead>
              <tr>
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
                <td class="cell-event">
                  <span class="ev-name">{{ ev.name || t('organizerOverview.untitled') }}</span>
                  <span class="ev-category">{{ formatCategory(ev.categoryType) }}</span>
                </td>
                <td class="cell-date">{{ formatDate(ev.date || ev.eventDate) }}</td>
                <td><span class="status-pill" :class="'pill--' + (ev.status || 'draft').toLowerCase()">{{ (ev.status || 'DRAFT').toLowerCase() }}</span></td>
                <td class="cell-guests"><span class="guests-num">{{ ev.metrics?.totalGuests ?? '—' }}</span></td>
                <td class="cell-rsvp">
                  <div v-if="ev.metrics?.rsvp" class="rsvp-bar-wrap">
                    <div class="rsvp-bar">
                      <div class="rsvp-seg rsvp-accepted" :style="{ width: rsvpPercent(ev, 'comming') + '%' }"></div>
                      <div class="rsvp-seg rsvp-maybe" :style="{ width: rsvpPercent(ev, 'maybe') + '%' }"></div>
                      <div class="rsvp-seg rsvp-declined" :style="{ width: rsvpPercent(ev, 'decline') + '%' }"></div>
                    </div>
                    <span class="rsvp-nums">{{ ev.metrics.rsvp.comming }}/{{ ev.metrics.rsvp.total }}</span>
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
import { eventsService } from '@/services/events.service';
import { guestsService } from '@/services/guests.service';
import { createAdminUser } from '@/services/userService';
import { hasRole, logout, getFullName } from '@/services/auth.service';
import { onboardingStore, setEventId, setSelectedCategory, setEventStatus, setInvitationName, clearOnboarding } from '@/store/onboarding.store';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || 'mk');

const loading = ref(true);
const events = ref([]);
const metricsMap = ref({});

onMounted(async () => {
  if (!hasRole('ORGANIZER')) {
    router.replace({ name: 'dashboard.overview', params: { lang: lang.value } });
    return;
  }

  try {
    const res = await eventsService.getAll();
    events.value = Array.isArray(res) ? res : (res?.data || res?.content || []);
    await loadMetrics();
  } catch (e) {
    console.error('Failed to load events:', e);
  } finally {
    loading.value = false;
  }
});

async function loadMetrics() {
  const fetches = events.value.map(async (ev) => {
    const id = ev.id || ev.eventId;
    if (!id) return;
    try {
      const [counts, status] = await Promise.all([
        guestsService.getCount(id).catch(() => null),
        guestsService.getStatusCounts(id).catch(() => null),
      ]);
      metricsMap.value[id] = {
        totalGuests: Number(counts?.total || 0),
        rsvp: status ? {
          total: (status.comming || 0) + (status.maybe || 0) + (status.decline || 0) + (status.waiting || 0),
          comming: status.comming || 0,
          maybe: status.maybe || 0,
          decline: status.decline || 0,
          waiting: status.waiting || 0,
        } : null,
      };
    } catch { /* skip */ }
  });
  await Promise.all(fetches);
}

const enrichedEvents = computed(() =>
  events.value.map(ev => ({ ...ev, metrics: metricsMap.value[ev.id || ev.eventId] || null }))
);

const totalGuests = computed(() =>
  Object.values(metricsMap.value).reduce((sum, m) => sum + (m.totalGuests || 0), 0)
);

const upcomingCount = computed(() => {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return events.value.filter(ev => { const d = ev.date || ev.eventDate; return d && new Date(d) >= now; }).length;
});

const avgRsvpRate = computed(() => {
  const m = Object.values(metricsMap.value).filter(x => x.rsvp && x.rsvp.total > 0);
  if (!m.length) return 0;
  const accepted = m.reduce((s, x) => s + x.rsvp.comming, 0);
  const total = m.reduce((s, x) => s + x.rsvp.total, 0);
  return total ? Math.round((accepted / total) * 100) : 0;
});

function rsvpPercent(ev, key) {
  const r = ev.metrics?.rsvp;
  return (r && r.total) ? Math.round((r[key] / r.total) * 100) : 0;
}

function onManage(ev) {
  setEventId(ev.id || ev.eventId);
  if (ev.categoryType) setSelectedCategory(ev.categoryType);
  if (ev.status) setEventStatus(ev.status);
  if (ev.invitation?.name || ev.invitationName) setInvitationName(ev.invitation?.name || ev.invitationName);
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

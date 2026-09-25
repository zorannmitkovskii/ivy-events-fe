<template>
  <div class="dashboard-overview">
    <header class="page-head">
      <div>
        <h1>{{ title }}</h1>
        <p class="sub">{{ subtitle }}</p>
      </div>

      <div class="refresh">
        <button type="button" class="refresh-btn" :disabled="loading" @click="load">
          {{ loading ? t('adminOverview.refreshing') : t('adminOverview.refresh') }}
        </button>
        <!--
          The stamp is the point of the button. Without it a dashboard that
          silently failed to refresh looks exactly like one that just did.
        -->
        <span v-if="lastUpdated" class="stamp">
          {{ t('adminOverview.lastUpdated', { time: lastUpdatedLabel }) }}
        </span>
      </div>
    </header>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <!--
      Nothing at all is its own screen (IVY-1204). The cards below are correct
      when every figure is zero and they are useless: they describe the state
      and offer nothing that changes it.
    -->
    <EmptyDashboard
      v-if="data && isBrandNew"
      :title="t('emptyDashboard.title')"
      :body="t('emptyDashboard.body')"
      :action="createEventAction ? t('emptyDashboard.action') : ''"
      :to="createEventAction"
    />

    <!--
      Above everything but the heading, on every dashboard (2026-09-23).
      It used to fold away under the data on all but the platform screen, on
      the reasoning that most visits never touch a filter. That reasoning held
      for one screen and not for the rest: on a dashboard whose whole job is a
      range of dates, a reader who wants a different range should not have to
      scroll past the answer to the wrong question to find the control.
    -->
    <DashboardFilters v-if="showFilters" v-bind="filterBindings" />

    <!-- The platform screen reads the tiles as its way in, so they lead there. -->
    <QuickNavGrid v-if="navFirst && showNavGrid" :items="navItemsWithBadges" />

    <!-- The answer first. Everything below it is context. -->
    <section
      v-if="showTaskHealth && data && !isBrandNew"
      id="attention"
      class="attention"
      :class="{ quiet: !attentionItems.length }"
    >
      <header class="attention-head">
        <h2>
          <span v-if="attentionItems.length" class="glyph" aria-hidden="true">⚠</span>
          {{ t('adminOverview.attention') }}
        </h2>
      </header>

      <!--
        The sentence replaces the settings form that used to live here. It says
        what the threshold is while the reader is looking at what it produced;
        changing it is a settings job and lives on the settings page.
      -->
      <p v-if="attentionItems.length" class="summary">
        {{ attentionSummary }}
        <RouterLink v-if="settingsLink" :to="settingsLink" class="settings-link">
          {{ t('adminOverview.changeWindow') }}
        </RouterLink>
      </p>

      <p v-else class="empty">{{ t('adminOverview.attentionEmpty') }}</p>

      <ul v-if="attentionItems.length" class="attention-list">
        <li v-for="item in attentionItems" :key="item.eventId" class="attention-row">
          <RouterLink :to="linkFor(item.eventId)" class="name">{{ item.name }}</RouterLink>
          <span class="reason" :class="item.reason.toLowerCase()">
            <span aria-hidden="true">{{ item.reason === 'OVERDUE_TASKS' ? '▲' : '◆' }}</span>
            {{ t(`adminOverview.reason.${item.reason}`) }}
          </span>
          <span class="when">{{ whenLabel(item) }}</span>
          <span class="counts">
            {{ t('adminOverview.overdueOpen', {
              overdue: item.overdueTaskCount,
              open: item.openTaskCount,
            }) }}
          </span>
        </li>
      </ul>

      <p v-if="truncated" class="truncated">
        {{ t('adminOverview.attentionTruncated', {
          shown: attentionItems.length,
          total: data.attention.total,
        }) }}
      </p>
    </section>

    <section v-if="data && !isBrandNew" class="cards">
      <StatCard
        :label="t('adminOverview.totalEvents')"
        :value="data.totals.eventCount"
        :rows="statusRows"
        :to="eventsLink"
      />

      <StatCard
        :label="t('adminOverview.upcoming')"
        :value="data.upcoming.next30"
        :rows="upcomingRows"
        :hint="t('adminOverview.cumulative')"
        :hint-label="t('adminOverview.upcoming')"
        :to="eventsLink"
      />

      <StatCard
        v-if="showGuests"
        :label="t('adminOverview.guests')"
        :value="data.totals.guestCount"
        :rows="guestRows"
      />

      <StatCard
        v-if="showTaskHealth"
        :label="t('adminOverview.delayedTasks')"
        :value="data.totals.overdueTaskCount"
        :rows="delayedRows"
        :tone="data.totals.overdueTaskCount > 0 ? 'critical' : 'good'"
        :hint="t('adminOverview.delayedTasksNote')"
        :hint-label="t('adminOverview.delayedTasks')"
        :to="{ hash: '#attention' }"
      />

      <!-- Cards only one screen has, for the range the figures were loaded for.
           The platform adds its revenue here (IVY-1104). -->
      <slot name="cards" :filters="appliedFilters" />
    </section>

    <!-- Who is carrying the numbers above (IVY-1202). -->
    <slot :data="data" :reload="load" />

    <section v-if="data && !isBrandNew" id="charts" class="charts" :class="{ single: !showGuests }">
      <EventsByMonthChart :points="data.monthly || []" />
      <RsvpDonut
        v-if="showGuests"
        :confirmed="data.totals.confirmedCount"
        :responded="data.totals.respondedCount"
        :invited="data.totals.invitedCount"
        :rate="data.totals.responseRate"
      />
    </section>

    <QuickNavGrid v-if="!navFirst && showNavGrid" :items="navItemsWithBadges" />

  </div>
</template>

<script setup>
/**
 * The dashboard block shared by the platform and agency screens.
 *
 * <p>Extracted at the second use, not the first (IVY-1201). The two screens
 * differ in which endpoint fills them and where their links point; everything
 * else lives here, so a fix to a card or the attention rule cannot be applied
 * to one screen and forgotten on the other.
 *
 * <p>The caller passes a `loader`; this component owns loading, errors, the
 * filters and the URL sync. It knows nothing about who is looking.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import QuickNavGrid from '@/components/dashboard/QuickNavGrid.vue'
import DashboardFilters from '@/components/dashboard/DashboardFilters.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import EventsByMonthChart from '@/components/dashboard/EventsByMonthChart.vue'
import EmptyDashboard from '@/components/dashboard/EmptyDashboard.vue'
import RsvpDonut from '@/components/dashboard/RsvpDonut.vue'
import { getErrorMessage } from '@/services/apiError'
import { EventCategoryEnum } from '@/enums/EventCategory'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  /** `(filters) => Promise<ApiResponse>` — the only difference between screens. */
  navItems: { type: Array, default: () => [] },
  loader: { type: Function, required: true },
  /** Where an attention row points. */
  eventLink: { type: Function, required: true },
  /** Where the KPI cards drill down to. */
  eventsLink: { type: [String, Object], default: null },
  /** Where the at-risk window is edited, or null when this viewer cannot. */
  settingsLink: { type: [String, Object], default: null },
  /** `[{ key, icon, label, to, badgeFrom }]` — badgeFrom reads off the payload. */
  /** Where the first event is created, when this viewer may create one. */
  createEventAction: { type: [String, Object], default: null },
  /** Overdue work: the attention list and the delayed-tasks card. */
  showTaskHealth: { type: Boolean, default: true },
  /** Guest numbers: the guests card and the RSVP donut. */
  showGuests: { type: Boolean, default: true },
  /** The quick-nav tiles above everything else instead of under the charts. */
  navFirst: { type: Boolean, default: false },
  /** The filters above everything else instead of folded under the data. */
})

const EVENT_TYPES = Object.values(EventCategoryEnum)

/** The only language this product speaks that writes half past one as 1:30 PM. */
const TWELVE_HOUR_LOCALES = new Set(['en'])

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const data = ref(null)
const loading = ref(false)
const error = ref('')
const lastUpdated = ref(null)

/** The range the figures on screen were loaded for — not the one still being typed. */
const appliedFilters = ref({ from: '', to: '', categoryType: '' })

// Seeded from the URL so a filtered dashboard survives a reload and can be
// pasted to somebody else.
const filters = reactive({
  from: route.query.from || '',
  to: route.query.to || '',
  categoryType: route.query.categoryType || '',
})

const hasFilters = computed(() => Boolean(filters.from || filters.to || filters.categoryType))

const showFilters = computed(() => Boolean(data.value && !isBrandNew.value))

/** Everything the filters form needs, bound in one place wherever it is shown. */
const filterBindings = computed(() => ({
  from: filters.from,
  to: filters.to,
  categoryType: filters.categoryType,
  eventTypes: EVENT_TYPES,
  loading: loading.value,
  hasFilters: hasFilters.value,
  'onUpdate:from': (value) => { filters.from = value },
  'onUpdate:to': (value) => { filters.to = value },
  'onUpdate:categoryType': (value) => { filters.categoryType = value },
  onApply: load,
  onClear: clearFilters,
}))

/**
 * The tiles carry live counts, so they are not only navigation — that is why
 * they stayed. What changed is where: under the answer and the numbers, not
 * in front of them (IVY-1401) — unless the screen asks for them first with
 * `navFirst`, as the platform one does.
 */
const navItemsWithBadges = computed(() =>
  props.navItems.map((item) => ({
    ...item,
    badge: item.badgeFrom ? item.badgeFrom(data.value) : null,
  }))
)

const statusRows = computed(() =>
  Object.entries(data.value?.statusBreakdown ?? {})
    .map(([status, count]) => ({ label: t(`adminOverview.status.${status}`), value: count }))
)

const upcomingRows = computed(() => {
  const upcoming = data.value?.upcoming ?? {}
  return [30, 60, 90].map((days) => ({
    label: t('adminOverview.days', { n: days }),
    value: upcoming[`next${days}`] ?? 0,
  }))
})

const guestRows = computed(() => {
  const totals = data.value?.totals ?? {}
  return [
    { label: t('adminOverview.rsvpRate'), value: rsvpRate.value },
    { label: t('adminOverview.invited'), value: totals.invitedCount ?? 0 },
    { label: t('adminOverview.confirmed'), value: totals.confirmedCount ?? 0 },
  ]
})

const rsvpRate = computed(() => {
  const rate = data.value?.totals?.responseRate
  return rate === null || rate === undefined ? '—' : `${rate}%`
})

const attentionItems = computed(() => data.value?.attention?.items ?? [])

/**
 * The banner's own sentence. Says the window when there is one to say — a
 * platform view spans organizations that each chose their own, and printing a
 * single number there would state something untrue.
 */
const attentionSummary = computed(() => {
  const attention = data.value?.attention
  if (!attention) return ''
  const base = {
    overdue: attention.overdueCount ?? 0,
    atRisk: attention.atRiskCount ?? 0,
  }
  return attention.riskWindowDays
    ? t('adminOverview.attentionSummary', { ...base, days: attention.riskWindowDays })
    : t('adminOverview.attentionSummaryMixed', base)
})

const truncated = computed(() => {
  const attention = data.value?.attention
  return Boolean(attention && attention.total > attention.items.length)
})

/**
 * Nothing has happened yet — not merely nothing this month.
 *
 * Read off the unfiltered totals, so a date range that matches nothing shows
 * an empty chart rather than telling an agency with twenty events that it has
 * none. And every count has to be zero, not just the events: an agency with
 * guests or with work already flagged has a history, whatever the event total
 * says, and replacing its dashboard with a first-run screen would lose it.
 */
const isBrandNew = computed(() => {
  if (!data.value || hasFilters.value) return false
  const totals = data.value.totals || {}
  return (totals.eventCount ?? 0) === 0
    && (totals.guestCount ?? 0) === 0
    && (data.value.attention?.total ?? 0) === 0
})

const showNavGrid = computed(() => Boolean(props.navItems.length && data.value && !isBrandNew.value))

/**
 * The one card that used to end under its number, while its three
 * neighbours each carried three rows (IVY-1204).
 *
 * <p>How many events the late work sits on, which is the question a count of
 * nine overdue tasks immediately raises — nine on one wedding and nine across
 * nine are different afternoons.
 */
const delayedRows = computed(() => {
  const events = data.value?.attention?.overdueCount ?? 0
  if (!events) return []
  return [{ label: t('adminOverview.delayedOnEvents'), value: events }]
})

/**
 * The stamp in the reader's own language, to the minute (IVY-1204).
 *
 * <p>`toLocaleTimeString()` with no locale takes the browser's, which put
 * "1:13:59 PM" on a Macedonian page. The seconds went with it: this says when
 * the numbers were last fetched, and nobody times a dashboard refresh.
 */
const lastUpdatedLabel = computed(() =>
  lastUpdated.value
    ? lastUpdated.value.toLocaleTimeString(locale.value, {
        hour: '2-digit',
        minute: '2-digit',
        // Stated rather than inherited. Macedonian and Albanian are 24-hour
        // languages, and a browser without their locale data falls back to its
        // own — which is how a Macedonian dashboard came to say 01:26 PM.
        hour12: TWELVE_HOUR_LOCALES.has(locale.value),
      })
    : ''
)

async function load() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  appliedFilters.value = { from: filters.from, to: filters.to, categoryType: filters.categoryType }
  try {
    const response = await props.loader({
      from: filters.from || undefined,
      to: filters.to || undefined,
      categoryType: filters.categoryType || undefined,
    })
    // The client returns the whole ApiResponse envelope; the payload is inside
    // `data`. Same unwrap the workspace overview does.
    data.value = response?.data ?? response ?? null
    lastUpdated.value = new Date()
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(filters, syncUrl, { deep: true })

function syncUrl() {
  const query = {}
  if (filters.from) query.from = filters.from
  if (filters.to) query.to = filters.to
  if (filters.categoryType) query.categoryType = filters.categoryType
  router.replace({ query })
}

function clearFilters() {
  filters.from = ''
  filters.to = ''
  filters.categoryType = ''
  load()
}

/** Renamed off the prop so the template cannot pick the wrong one. */
function linkFor(eventId) {
  return props.eventLink(eventId)
}

function whenLabel(item) {
  if (item.daysUntil === null || item.daysUntil === undefined) {
    return t('adminOverview.undated')
  }
  if (item.daysUntil < 0) {
    return t('adminOverview.daysAgo', { n: Math.abs(item.daysUntil) })
  }
  return t('adminOverview.inDays', { n: item.daysUntil })
}

onMounted(load)

defineExpose({ reload: load })
</script>

<style scoped>
.dashboard-overview {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.page-head h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color, #0b0b0b);
}

.sub {
  margin: 4px 0 0;
  color: var(--text-muted, #52514e);
}

.refresh {
  display: flex;
  align-items: center;
  gap: 10px;
}

.refresh-btn {
  border: 1px solid var(--border-color, #cbd0d6);
  background: var(--cards-color, #fff);
  color: var(--text-color, #0b0b0b);
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.stamp {
  font-family: var(--font-ui);
  color: var(--text-muted, #52514e);
  font-size: 0.85rem;
}

.error {
  color: #b3261e;
  margin: 0;
  font-weight: 600;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  /* Equal heights: a card with fewer rows stretches rather than leaving a gap. */
  align-items: stretch;
}

.charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.charts.single {
  grid-template-columns: 1fr;
}

@media (max-width: 900px) {
  .charts {
    grid-template-columns: 1fr;
  }
}

/* Inset shadow rather than a thick left border, for the reason spelled out in
   StatCard: the browser draws that corner elliptically and the accent ends up
   outside the card (IVY-1204). */
.attention {
  background: var(--cards-color, #fff);
  border: 1px solid var(--border-color, #e6e5e1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: inset 4px 0 0 #fab219;
}

.attention.quiet {
  box-shadow: inset 4px 0 0 #0ca30c;
}

.attention-head h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color, #0b0b0b);
  display: flex;
  align-items: center;
  gap: 8px;
}

.glyph {
  color: #b07600;
}

.summary {
  font-family: var(--font-ui);
  margin: 8px 0 0;
  font-size: 0.9rem;
  color: var(--text-color, #0b0b0b);
}

.settings-link {
  margin-left: 8px;
  font-size: 0.85rem;
}

.empty {
  margin: 8px 0 0;
  color: var(--text-muted, #52514e);
}

.attention-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attention-row {
  font-family: var(--font-ui);
  display: grid;
  grid-template-columns: minmax(140px, 2fr) auto 1fr 1fr;
  gap: 10px;
  align-items: center;
  font-size: 0.9rem;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color, #eef0f3);
}

.name {
  font-weight: 600;
}

.reason {
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 2px 9px;
  justify-self: start;
  white-space: nowrap;
}

.reason.overdue_tasks {
  background: #fdecec;
  color: #8f2020;
}

.reason.at_risk {
  background: #fdf3dc;
  color: #7a5200;
}

.truncated {
  font-family: var(--font-ui);
  margin: 10px 0 0;
  font-size: 0.8rem;
  color: var(--text-muted, #52514e);
}

@media (max-width: 720px) {
  .attention-row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>

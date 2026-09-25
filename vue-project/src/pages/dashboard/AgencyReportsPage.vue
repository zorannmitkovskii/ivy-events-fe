<template>
  <div class="agency-reports">
    <PageHead :title="t('agencyScreens.reports.title')" :subtitle="t('agencyScreens.reports.subtitle')">
      <template #actions>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="!rows.length" @click="exportCsv">
          {{ t('agencyScreens.reports.export') }}
        </button>
      </template>
    </PageHead>

    <p v-if="loading" class="quiet-note">{{ t('common.loading') }}</p>
    <p v-else-if="error" class="error" role="alert">{{ error }}</p>

    <template v-else>
      <div class="kpis">
        <div class="kpi">
          <span>{{ t('agencyScreens.reports.kpiActive') }}</span>
          <strong>{{ kpis.activeEvents ?? 0 }}</strong>
          <small>{{ t('agencyScreens.reports.kpiActiveNote', { n: drafts }) }}</small>
        </div>
        <div class="kpi">
          <span>{{ t('agencyScreens.reports.kpiRsvp') }}</span>
          <strong>{{ rsvp.rate == null ? '—' : `${rsvp.rate}%` }}</strong>
          <small>{{ t('agencyScreens.reports.kpiRsvpNote', { answered: rsvp.answered, invited: rsvp.invited }) }}</small>
        </div>
        <div :class="['kpi', { danger: (kpis.overdueTasks ?? 0) > 0 }]">
          <span>{{ t('agencyScreens.reports.kpiOverdue') }}</span>
          <strong>{{ kpis.overdueTasks ?? 0 }}</strong>
          <small>{{ t('agencyScreens.reports.kpiOverdueNote') }}</small>
        </div>
        <div class="kpi">
          <span>{{ t('agencyScreens.reports.kpiSpent') }}</span>
          <strong class="money">{{ formatMoney(budget.spent, currency, locale) }}</strong>
          <small>{{ t('agencyScreens.reports.kpiSpentNote', { amount: formatMoney(budget.planned, currency, locale) }) }}</small>
        </div>
      </div>

      <div class="two-col">
        <section class="card">
          <h3>{{ t('agencyScreens.reports.byMonth') }}</h3>
          <p class="lede">{{ t('agencyScreens.reports.byMonthHint') }}</p>
          <div v-if="months.length" class="month-chart" role="img" :aria-label="t('agencyScreens.reports.byMonth')">
            <div v-for="point in months" :key="point.month" class="month">
              <b>{{ point.count }}</b>
              <i :style="{ height: `${barHeight(point.count)}px` }"></i>
              <span>{{ monthLabel(point.month) }}</span>
            </div>
          </div>
          <p v-else class="quiet-note">{{ t('agencyScreens.reports.noMonths') }}</p>
        </section>

        <section class="card">
          <h3>{{ t('agencyScreens.reports.intervention') }}</h3>
          <p class="lede">{{ t('agencyScreens.reports.interventionHint') }}</p>
          <ul class="lines">
            <li class="line">
              <div>
                <b>{{ t('agencyScreens.reports.overdueLine', { n: kpis.overdueTasks ?? 0 }) }}</b>
                <small>{{ t('agencyScreens.reports.overdueLineNote') }}</small>
              </div>
              <RouterLink class="btn btn-ghost btn-sm" :to="`/${lang}/agency/tasks`">{{ t('agencyScreens.reports.open') }}</RouterLink>
            </li>
            <li class="line">
              <div>
                <b>{{ t('agencyScreens.reports.rsvpLine', { n: kpis.awaitingRsvp ?? 0 }) }}</b>
                <small>{{ t('agencyScreens.reports.rsvpLineNote') }}</small>
              </div>
              <RouterLink class="btn btn-ghost btn-sm" :to="`/${lang}/agency/events`">{{ t('agencyScreens.reports.events') }}</RouterLink>
            </li>
            <li class="line">
              <div>
                <b>{{ t('agencyScreens.reports.budgetLine', { n: kpis.overBudgetEvents ?? 0 }) }}</b>
                <small>{{ t('agencyScreens.reports.budgetLineNote') }}</small>
              </div>
              <RouterLink class="btn btn-ghost btn-sm" :to="`/${lang}/agency/events`">{{ t('agencyScreens.reports.review') }}</RouterLink>
            </li>
          </ul>
        </section>
      </div>

      <p class="quiet-note">{{ t('agencyScreens.reports.note') }}</p>
    </template>
  </div>
</template>

<script setup>
/**
 * The agency's reports (2026 agency design, "Извештаи").
 *
 * <p>Only numbers the agency's own data can back: events, RSVP answers,
 * overdue work and budget against recorded expenses. Revenue, client payments
 * and margin are not here — they need financial data Ivy does not hold, and
 * the page says so rather than showing a guess.
 *
 * <p>Three reads, all existing: the agency home for the counts and budget,
 * the event list for the RSVP rate and the export, and the agency analytics
 * for events by month.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { agencyWorkspaceService } from '@/services/agencyWorkspace.service'
import { analyticsService } from '@/services/analytics.service'
import { getErrorMessage } from '@/services/apiError'
import { formatMoney } from '@/utils/agencyFormat.js'
import { useAgencyPreferences } from '@/composables/useAgencyPreferences'

/** The tallest bar, in pixels. */
const CHART_HEIGHT = 130
/** Months drawn — the analytics answer twelve, the screen shows the recent half year. */
const MONTHS_SHOWN = 6

const { t, locale } = useI18n()

/** Amounts are drawn in the agency's own currency, from its settings. */
const { currency, load: loadPreferences } = useAgencyPreferences()
loadPreferences()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const home = ref(null)
const rows = ref([])
const monthly = ref([])
const loading = ref(true)
const error = ref('')

const unwrap = (response) => response?.data?.data ?? response?.data ?? response ?? null

const kpis = computed(() => home.value?.kpis ?? {})
const budget = computed(() => home.value?.budget ?? { planned: 0, spent: 0 })
const drafts = computed(() => rows.value.filter((row) => row.status === 'DRAFT').length)

/** Answered over invited, across every event shown — the list's own rule. */
const rsvp = computed(() => {
  const answered = rows.value.reduce((n, row) => n + (row.confirmedCount ?? 0) + (row.declinedCount ?? 0), 0)
  const invited = answered + rows.value.reduce((n, row) => n + (row.awaitingCount ?? 0), 0)
  return { answered, invited, rate: invited ? Math.round((answered * 100) / invited) : null }
})

const months = computed(() => monthly.value.slice(-MONTHS_SHOWN))
const maxCount = computed(() => Math.max(1, ...months.value.map((point) => point.count)))

const barHeight = (count) => Math.max(4, Math.round((count / maxCount.value) * CHART_HEIGHT))

function monthLabel(month) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString(locale.value, { month: 'short' })
}

onMounted(async () => {
  try {
    const [homeResponse, eventsResponse, analyticsResponse] = await Promise.all([
      agencyWorkspaceService.home(),
      agencyWorkspaceService.events({}),
      // The chart is one panel of four; without it the page still reports.
      analyticsService.agency().catch(() => null),
    ])
    home.value = unwrap(homeResponse)
    rows.value = unwrap(eventsResponse)?.rows ?? []
    monthly.value = unwrap(analyticsResponse)?.monthly ?? []
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
})

/**
 * The file is built on the server from the same rows as the list, and handed
 * to the browser as a download. A failed export says so rather than leaving
 * the button doing nothing.
 */
async function exportCsv() {
  error.value = ''
  try {
    const blob = await agencyWorkspaceService.exportEvents()
    saveFile(blob, `agency-report-${new Date().toISOString().slice(0, 10)}.csv`)
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

function saveFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
/* `.kpis`, `.kpi` and `.card` are the design's, in `ivy/dash.css`. */
.kpi.danger strong {
  color: var(--rose-ink);
}

.kpi strong.money {
  font-size: 26px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.card h3 {
  margin: 0 0 4px;
  font-size: 19px;
}

.month-chart {
  display: flex;
  align-items: flex-end;
  gap: 18px;
  height: 180px;
  padding-top: 8px;
  border-bottom: 1px solid var(--line);
}

.month {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  height: 100%;
}

.month i {
  display: block;
  width: 60%;
  max-width: 44px;
  border-radius: 6px 6px 2px 2px;
  background: var(--ivy);
}

.month b {
  font-size: 13px;
}

.month span {
  color: var(--ink-3);
  font-size: 12px;
}

.quiet-note {
  margin-top: 14px;
  color: var(--ink-3);
  font-size: 12.5px;
}

.error {
  color: var(--rose-ink);
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>

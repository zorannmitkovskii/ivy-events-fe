<template>
  <div class="traffic-page">
    <PageHeader :title="t('siteAnalytics.title')">
      <template #actions>
        <p class="sub">{{ t('siteAnalytics.subtitle') }}</p>
      </template>
    </PageHeader>

    <nav class="periods" :aria-label="t('siteAnalytics.periodLabel')">
      <template v-for="group in PERIOD_GROUPS" :key="group.key">
        <span class="group-label">{{ t('siteAnalytics.groups.' + group.key) }}</span>
        <button
          v-for="option in group.options"
          :key="option"
          type="button"
          class="chip"
          :class="{ active: period === option }"
          :aria-pressed="period === option"
          :data-track="'traffic-period-' + option"
          @click="period = option"
        >
          {{ t('siteAnalytics.periods.' + option) }}
        </button>
      </template>
    </nav>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="muted">{{ t('siteAnalytics.loading') }}</p>

    <template v-if="report">
      <!--
        The window is printed above the figures rather than implied by the
        chosen chip. "Last week" means different things to different people and
        the dates end the argument before it starts.
      -->
      <p class="window">{{ windowLabel }}</p>

      <dl class="tiles">
        <div>
          <dt>{{ t('siteAnalytics.visitors') }}</dt>
          <dd>{{ report.visitors.toLocaleString() }}</dd>
        </div>
        <div>
          <dt>{{ t('siteAnalytics.pageViews') }}</dt>
          <dd>{{ report.pageViews.toLocaleString() }}</dd>
        </div>
        <div>
          <dt>{{ t('siteAnalytics.clicks') }}</dt>
          <dd>{{ report.clicks.toLocaleString() }}</dd>
        </div>
        <div>
          <dt>{{ t('siteAnalytics.purchases') }}</dt>
          <dd>{{ report.purchases.toLocaleString() }}</dd>
        </div>
        <div>
          <dt>{{ t('siteAnalytics.revenue') }}</dt>
          <dd>{{ money(report.revenue) }}</dd>
        </div>
        <div>
          <dt>{{ t('siteAnalytics.conversion') }}</dt>
          <dd>{{ report.conversionRate }}%</dd>
        </div>
      </dl>

      <!--
        Median beside the average, never instead of it. One tab left open over a
        weekend pulls an average into nonsense, and the gap between the two is
        what tells a reader whether to trust either.
      -->
      <p class="dwell">
        {{ t('siteAnalytics.timeOnSite') }}:
        <strong>{{ duration(report.medianVisitMs) }}</strong>
        <span class="muted"> ({{ t('siteAnalytics.median') }})</span>
        <span class="muted"> · {{ duration(report.avgVisitMs) }} {{ t('siteAnalytics.average') }}</span>
      </p>

      <section class="tables">
        <TopTable :title="t('siteAnalytics.topPages')" :rows="report.topPages" />
        <TopTable :title="t('siteAnalytics.topClicks')" :rows="report.topClicks" />
        <TopTable :title="t('siteAnalytics.topReferrers')" :rows="report.topReferrers"
                  :empty="t('siteAnalytics.noReferrers')" />
      </section>

      <p class="privacy">{{ t('siteAnalytics.privacy') }}</p>
    </template>
  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import TopTable from '@/components/admin/analytics/TopTable.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { siteAnalyticsService } from '@/services/siteAnalytics.service'
import { getErrorMessage } from '@/services/apiError'

/**
 * Site traffic (IVY-906).
 *
 * <p>Grouped by unit rather than laid out as one long row of chips, because
 * "this week" and "last week" are a pair a reader flips between and the pairing
 * should be visible.
 */
const PERIOD_GROUPS = [
  { key: 'day', options: ['TODAY', 'YESTERDAY'] },
  { key: 'week', options: ['THIS_WEEK', 'LAST_WEEK'] },
  { key: 'month', options: ['THIS_MONTH', 'LAST_MONTH'] },
  { key: 'year', options: ['THIS_YEAR', 'LAST_YEAR', 'LAST_5_YEARS'] },
]

const { t, locale } = useI18n()

const report = ref(null)
const period = ref('THIS_MONTH')
const error = ref('')
const loading = ref(false)

function unwrap(response) {
  return response?.data ?? response ?? null
}

const windowLabel = computed(() => {
  if (!report.value) return ''
  const from = new Date(report.value.from)
  const to = new Date(report.value.to)
  const fmt = new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' })
  return `${fmt.format(from)} – ${fmt.format(to)} (${report.value.zone})`
})

function money(amount) {
  const value = Number(amount ?? 0)
  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: report.value?.currency || 'MKD',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    // An unknown currency code must not blank the whole dashboard.
    return `${value.toLocaleString()} ${report.value?.currency ?? ''}`.trim()
  }
}

/** Minutes and seconds — milliseconds are not a unit anybody reads a visit in. */
function duration(ms) {
  const total = Math.round(Number(ms ?? 0) / 1000)
  if (total <= 0) return t('siteAnalytics.noData')
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`
}

onMounted(load)
watch(period, load)

async function load() {
  loading.value = true
  try {
    report.value = unwrap(await siteAnalyticsService.stats(period.value))
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.traffic-page {
  padding: 1.5rem;
}

.sub {
  color: var(--ink-2, #666);
  margin: 0.25rem 0 1rem;
}

.periods {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.group-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ink-3, #777);
  margin-left: 0.6rem;
}

.group-label:first-child {
  margin-left: 0;
}

.chip {
  border: 1px solid var(--line, #ddd);
  background: var(--card, #fff);
  color: inherit;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.chip.active {
  background: var(--ivy, #1e3d30);
  color: var(--on-ivy, #fff);
  border-color: var(--ivy, #1e3d30);
}

.window {
  color: var(--ink-2, #555);
  font-size: 0.88rem;
  margin: 0 0 1rem;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: 0 0 1rem;
}

.tiles dt {
  font-size: 0.8rem;
  color: var(--ink-3, #777);
}

.tiles dd {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.dwell {
  margin: 0 0 1.5rem;
}

.tables {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.muted {
  color: var(--ink-3, #777);
}

.error {
  color: #b3261e;
}

.privacy {
  color: var(--ink-3, #777);
  font-size: 0.82rem;
  margin-top: 1.5rem;
}
</style>

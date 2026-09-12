<template>
  <div>
    <PageHead :title="t('agencyReports.title')" :subtitle="t('agencyReports.subtitle')" />

    <p v-if="loading" class="empty">{{ t('common.loading') }}</p>

    <!--
      A refusal here is not a failure. Margins are behind a finance check, and
      an organizer without it should be told that rather than shown an error
      that reads like the page is broken.
    -->
    <p v-else-if="forbidden" class="empty">{{ t('agencyReports.financeOnly') }}</p>

    <p v-else-if="error" class="empty" role="alert">{{ error }}</p>

    <template v-else>
      <div class="kpis">
        <div class="kpi">
          <span>{{ t('agencyReports.clientSpend') }}</span>
          <strong>{{ money(numbers.clientSpend) }}</strong>
          <small>{{ t('agencyReports.wonLeads', { n: numbers.wonLeads || 0 }) }}</small>
        </div>
        <div class="kpi">
          <span>{{ t('agencyReports.agencyRevenue') }}</span>
          <strong>{{ money(numbers.agencyRevenue) }}</strong>
          <small>{{ t('agencyReports.revenueNote') }}</small>
        </div>
        <div class="kpi">
          <span>{{ t('agencyReports.margin') }}</span>
          <strong>{{ percent(numbers.margin) }}</strong>
          <small>{{ numbers.howCalculated }}</small>
        </div>
        <div class="kpi" :class="{ gold: attention.total > 0 }">
          <span>{{ t('agencyReports.atRisk') }}</span>
          <strong>{{ attention.total || 0 }}</strong>
          <small :class="{ warn: attention.total > 0 }">{{ t('agencyReports.atRiskNote') }}</small>
        </div>
      </div>

      <div class="grid">
        <section class="card">
          <div class="card-head">
            <h2>{{ t('agencyReports.revenueByMonth') }}</h2>
          </div>
          <div v-if="monthly.length" class="chart">
            <div v-for="(point, i) in monthly" :key="point.month" :class="{ hi: i === monthly.length - 1 }">
              <i :style="{ '--h': `${barHeight(point)}%` }" :title="money(point.amount)"></i>
              <span>{{ monthLabel(point.month) }}</span>
            </div>
          </div>
          <p v-else class="empty">{{ t('agencyReports.noMonthly') }}</p>
        </section>

        <section class="card">
          <div class="card-head">
            <h2>{{ t('agencyReports.health') }}</h2>
            <router-link :to="{ name: 'dashboard.organizer', params: { lang } }">
              {{ t('agencyReports.allEvents') }}
            </router-link>
          </div>
          <div class="rows">
            <div v-for="item in attention.items || []" :key="item.eventId" class="row">
              <span class="av">{{ initials(item.eventName) }}</span>
              <div>
                <b>{{ item.eventName }}</b>
                <small>{{ reasonFor(item) }}</small>
              </div>
              <span class="chip" :class="toneFor(item)">{{ t(`agencyReports.tone.${toneFor(item)}`) }}</span>
            </div>
            <p v-if="!(attention.items || []).length" class="empty">{{ t('agencyReports.allHealthy') }}</p>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { crmService } from '@/services/crm.service'
import { analyticsService } from '@/services/analytics.service'
import { getErrorMessage } from '@/services/apiError'

/*
  What the agency makes, and which events are in trouble.

  The two numbers on the left are the ones that get confused and must not be:
  the client's **spend** is what they lay out on their wedding, the agency's
  **revenue** is the fee for arranging it. The backend keeps them apart and so
  does this page.
*/

const FORBIDDEN = 403
const PERCENT = 100

const { t, locale } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const numbers = ref({})
const monthly = ref([])
const attention = ref({})
const loading = ref(true)
const forbidden = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    const profitability = await crmService.profitability()
    numbers.value = profitability?.data ?? profitability ?? {}
    monthly.value = numbers.value.monthly || []
  } catch (failure) {
    if (failure?.status === FORBIDDEN) {
      forbidden.value = true
      loading.value = false
      return
    }
    error.value = getErrorMessage(failure)
  }

  try {
    const risk = await analyticsService.agencyAttention()
    attention.value = risk?.data ?? risk ?? {}
  } catch {
    // The health panel is an extra; the numbers above it still stand.
    attention.value = {}
  }

  loading.value = false
})

const largest = computed(() => Math.max(...monthly.value.map((p) => Number(p.amount) || 0), 1))

function barHeight(point) {
  return Math.round(((Number(point.amount) || 0) / largest.value) * PERCENT)
}

function monthLabel(iso) {
  const [year, month] = String(iso).split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(locale.value, { month: 'short' })
}

function money(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat(locale.value, { notation: 'compact', maximumFractionDigits: 2 }).format(value)
}

function percent(value) {
  return value == null ? '—' : `${Math.round(value)}%`
}

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

/** Overdue and at-risk are different words on the screen for a reason. */
function toneFor(item) {
  return item.overdue ? 'risk' : 'warn'
}

function reasonFor(item) {
  return item.overdue
    ? t('agencyReports.overdue', { n: item.overdueTaskCount || 0 })
    : t('agencyReports.approaching', { n: item.daysUntil ?? 0 })
}
</script>

<style scoped>
/* `.kpis`, `.kpi`, `.grid`, `.card`, `.rows`, `.row`, `.bars` and `.chip` are
   the design's, in `ivy/dash.css`. Only the two status tones are local — the
   mockup writes "Добро / Внимание / Ризик" as plain text. */
.chip.warn {
  background: #f3ebda;
  color: #7a5a1f;
}

.chip.risk {
  background: #f3deda;
  color: #7a2b26;
}
</style>

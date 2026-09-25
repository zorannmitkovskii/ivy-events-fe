<template>
  <div class="vendor-insights">
    <PageHead :title="t('vendorWork.insights.title')" :subtitle="t('vendorWork.insights.subtitle')">
      <template #actions>
        <select v-model.number="windowDays" class="window" :aria-label="t('vendorWork.insights.window')">
          <option v-for="days in WINDOWS" :key="days" :value="days">{{ t('vendorWork.insights.lastDays', { n: days }) }}</option>
        </select>
      </template>
    </PageHead>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="!data" class="muted">{{ t('common.loading') }}</p>

    <template v-else>
      <div class="kpis">
        <div class="kpi">
          <span>{{ t('vendorWork.insights.views') }}</span>
          <strong>{{ data.profileViews ?? '—' }}</strong>
          <small>{{ t('vendorWork.insights.viewsNote') }}</small>
        </div>
        <div class="kpi">
          <span>{{ t('vendorWork.insights.inquiries') }}</span>
          <strong>{{ data.inquiries }}</strong>
          <small>{{ t('vendorWork.insights.inquiriesNote') }}</small>
        </div>
        <div class="kpi">
          <span>{{ t('vendorWork.inbox.fromMicrosite') }}</span>
          <strong>{{ data.bySource?.MICROSITE ?? 0 }}</strong>
          <small>{{ t('vendorWork.inbox.sourceNote') }}</small>
        </div>
        <div class="kpi">
          <span>{{ t('vendorWork.insights.bookings') }}</span>
          <strong>{{ data.confirmedBookings }}</strong>
          <small>{{ t('vendorWork.insights.bookingsNote') }}</small>
        </div>
      </div>

      <div class="two-col">
        <section class="card">
          <h3>{{ t('vendorWork.insights.bySource') }}</h3>
          <p class="lede">{{ t('vendorWork.insights.bySourceHint') }}</p>
          <ul class="lines">
            <li v-for="source in SOURCES" :key="source" class="line">
              <div><b>{{ t(`vendorWork.source.${source}`) }}</b><small>{{ t(`vendorWork.insights.sourceNote.${source}`) }}</small></div>
              <b>{{ data.bySource?.[source] ?? 0 }}</b>
            </li>
          </ul>
        </section>

        <section class="card">
          <h3>{{ t('vendorWork.insights.pipeline') }}</h3>
          <p class="lede">{{ t('vendorWork.insights.pipelineHint') }}</p>
          <ul class="lines">
            <li v-for="status in WORKFLOW" :key="status" class="line">
              <span>{{ t(`vendorWork.workflow.${status}`) }}</span>
              <span class="bar-cell">
                <i class="bar" :style="{ width: `${share(status)}%` }"></i>
                <b>{{ data.byWorkflow?.[status] ?? 0 }}</b>
              </span>
            </li>
            <li class="line">
              <span>{{ t('vendorWork.insights.median') }}</span>
              <b>{{ data.medianResponseMinutes == null ? t('vendorWork.insights.noData') : t('vendorWork.inbox.minutes', { n: data.medianResponseMinutes }) }}</b>
            </li>
          </ul>
        </section>
      </div>
      <p class="note">{{ t('vendorWork.insights.note') }}</p>
    </template>
  </div>
</template>

<script setup>
/**
 * What is working (2026 vendor design, "Увид"), only from numbers with a real
 * source: profile views, inquiries by where they came from, where they stand,
 * and confirmed bookings. An inquiry's status is not a sale, and the page does
 * not pretend otherwise.
 */
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { unwrap, vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { getErrorMessage } from '@/services/apiError'

const WINDOWS = [30, 90, 365]
const SOURCES = ['MICROSITE', 'IVY']
const WORKFLOW = ['NEW', 'IN_CONVERSATION', 'ANSWERED', 'BOOKED', 'CLOSED']

const { t } = useI18n()

const windowDays = ref(90)
const data = ref(null)
const error = ref('')

async function load() {
  error.value = ''
  try {
    data.value = unwrap(await vendorWorkspaceService.insights(windowDays.value))
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

function share(status) {
  const total = data.value?.inquiries || 0
  return total ? Math.round(((data.value.byWorkflow?.[status] ?? 0) * 100) / total) : 0
}

onMounted(load)
watch(windowDays, load)
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
.window {
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  font: inherit;
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

.bar-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 140px;
  justify-content: flex-end;
}

.bar {
  display: block;
  height: 6px;
  max-width: 100px;
  border-radius: 6px;
  background: var(--moss);
}

.note {
  margin-top: 14px;
  color: var(--ink-3);
  font-size: 12.5px;
}

.error {
  color: var(--rose-ink);
}

.muted {
  color: var(--ink-3);
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="calendar-overview">
    <div class="kpis">
      <div class="kpi">
        <span>{{ t('vendorWork.calendar.confirmed') }}</span>
        <strong>{{ count('BOOKING_CONFIRMED') }}</strong>
        <small>{{ t('vendorWork.calendar.nextDays', { n: WINDOW_DAYS }) }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('vendorWork.calendar.held') }}</span>
        <strong>{{ count('BOOKING_HELD') + count('HOLD') }}</strong>
        <small>{{ t('vendorWork.calendar.heldNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('vendorWork.calendar.inquiries') }}</span>
        <strong>{{ count('INQUIRY') }}</strong>
        <small>{{ t('vendorWork.calendar.inquiriesNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('vendorWork.calendar.blocked') }}</span>
        <strong>{{ count('BLOCKED') }}</strong>
        <small>{{ t('vendorWork.calendar.blockedNote') }}</small>
      </div>
    </div>

    <div class="bar">
      <ul class="legend" :aria-label="t('vendorWork.calendar.legend')">
        <li v-for="kind in LEGEND" :key="kind"><i :class="`swatch swatch--${kind.toLowerCase()}`"></i>{{ t(`vendorWork.calendar.kind.${kind}`) }}</li>
      </ul>
      <div class="view-toggle" role="group" :aria-label="t('vendorWork.calendar.viewLabel')">
        <button type="button" :class="{ on: view === 'month' }" :aria-pressed="view === 'month'" @click="$emit('update:view', 'month')">
          {{ t('vendorWork.calendar.month') }}
        </button>
        <button type="button" :class="{ on: view === 'list' }" :aria-pressed="view === 'list'" @click="$emit('update:view', 'list')">
          {{ t('vendorWork.calendar.list') }}
        </button>
      </div>
    </div>

    <section v-if="view === 'list'" class="card list" aria-labelledby="calendar-list">
      <h2 id="calendar-list">{{ t('vendorWork.calendar.upcoming') }}</h2>
      <ul v-if="entries.length" class="lines">
        <li v-for="entry in entries" :key="`${entry.kind}-${entry.refId}-${entry.date}`" class="line">
          <div>
            <b>{{ formatDay(entry.date, locale) }} · {{ entry.title || t(`vendorWork.calendar.kind.${entry.kind}`) }}</b>
            <small>{{ t(`vendorWork.calendar.kindNote.${entry.kind}`) }}</small>
          </div>
          <span :class="['pill', TONE[entry.kind]]">{{ t(`vendorWork.calendar.kind.${entry.kind}`) }}</span>
        </li>
      </ul>
      <p v-else class="empty">{{ t('vendorWork.calendar.nothing') }}</p>
    </section>
  </div>
</template>

<script setup>
/**
 * The calendar's summary and its second reading (2026 vendor design).
 *
 * <p>The month grid answers "what is on the 14th"; the list answers "what is
 * coming", which is the question a vendor asks on a Monday. Both come from
 * the same feed, which keeps a confirmed job, a held date and a mere inquiry
 * visibly different — the design's one hard rule for this screen.
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { unwrap, vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { formatDay } from '@/utils/agencyFormat.js'

defineProps({
  view: { type: String, default: 'month' },
})
defineEmits(['update:view'])

const WINDOW_DAYS = 60
const LEGEND = ['BOOKING_CONFIRMED', 'BOOKING_HELD', 'INQUIRY', 'BLOCKED']
const TONE = { BOOKING_CONFIRMED: 'green', BOOKING_HELD: 'amber', HOLD: 'amber', INQUIRY: 'slate', BLOCKED: 'slate' }

const { t, locale } = useI18n()

const entries = ref([])

const count = (kind) => entries.value.filter((entry) => entry.kind === kind).length

const isoDay = (date) => date.toISOString().slice(0, 10)

onMounted(async () => {
  const from = new Date()
  const to = new Date()
  to.setDate(to.getDate() + WINDOW_DAYS)
  try {
    const feed = unwrap(await vendorWorkspaceService.calendar(isoDay(from), isoDay(to))) ?? []
    entries.value = [...feed].sort((a, b) => a.date.localeCompare(b.date))
  } catch {
    entries.value = []
  }
})

</script>

<style scoped src="../agency/agency-panels.css"></style>

<style scoped>
.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 4px 0 12px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--ink-2);
  font-size: 13px;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.swatch--booking_confirmed {
  background: #e8f2e9;
  border: 1px solid #347555;
}

.swatch--booking_held {
  background: #fff2e0;
  border: 1px solid #9a7131;
}

.swatch--inquiry {
  border: 1px dashed #c9a24d;
}

.swatch--blocked {
  background: #eef0ec;
  border: 1px solid #647565;
}

.view-toggle {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 9px;
  overflow: hidden;
}

.view-toggle button {
  padding: 7px 14px;
  border: 0;
  background: var(--card);
  color: var(--ink-2);
  font-size: 13px;
}

.view-toggle button.on {
  background: var(--ivy);
  color: var(--on-ivy, #fff);
}

.list h2 {
  margin: 0 0 8px;
  font-size: 20px;
}
</style>

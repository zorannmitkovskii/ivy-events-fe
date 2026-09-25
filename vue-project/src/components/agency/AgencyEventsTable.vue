<template>
  <div class="tbl-wrap">
    <table class="tbl agency-events">
      <thead>
        <tr>
          <th>{{ t('agencyWork.table.event') }}</th>
          <th>{{ t('agencyWork.table.date') }}</th>
          <th>{{ isOwner ? t('agencyWork.table.lead') : t('agencyWork.table.myRole') }}</th>
          <th>{{ isOwner ? t('agencyWork.table.tasks') : t('agencyWork.table.myTasks') }}</th>
          <th>{{ t('agencyWork.table.rsvp') }}</th>
          <th v-if="isOwner">{{ t('agencyWork.table.budget') }}</th>
          <th>{{ t('agencyWork.table.nextStep') }}</th>
          <th v-if="showActions" class="r">{{ t('agencyWork.table.actions') }}</th>
          <th v-else aria-hidden="true"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.eventId"
          tabindex="0"
          class="clickable"
          :aria-label="t('agencyWork.table.open', { name: row.name })"
          @click="openEvent(row)"
          @keydown.enter.prevent="openEvent(row)"
        >
          <td>
            <b class="name">{{ row.name }}</b>
            <small class="sub">{{ subline(row) }}</small>
          </td>

          <td class="nowrap">
            <b>{{ formatDay(row.date, locale) || '—' }}</b>
            <small v-if="row.status === 'DRAFT'" class="pill slate">{{ t('agencyWork.status.DRAFT') }}</small>
            <small v-else-if="row.daysUntil != null" :class="['sub', { urgent: row.daysUntil <= riskWindowDays }]">
              {{ daysLabel(row.daysUntil) }}
            </small>
          </td>

          <td>
            <template v-if="isOwner">{{ row.lead?.name || t('agencyWork.unassigned') }}</template>
            <span v-else :class="['pill', row.myRole === 'LEAD' ? 'green' : 'slate']">
              {{ t(`agencyWork.myRole.${row.myRole || 'ASSISTANT'}`) }}
            </span>
          </td>

          <td>
            <template v-if="row.tasksTotal">
              <b>{{ t('agencyWork.table.donePercent', { n: percent(row.tasksDone, row.tasksTotal) }) }}</b>
              <span class="bar" aria-hidden="true"><i :style="{ width: `${percent(row.tasksDone, row.tasksTotal)}%` }"></i></span>
            </template>
            <span v-if="overdueOf(row)" class="pill red">{{ t(overdueKey, { n: overdueOf(row) }) }}</span>
            <span v-else class="pill green">{{ t('agencyWork.noOverdue') }}</span>
          </td>

          <td>
            <b class="rsvp">{{ row.responseRate == null ? '—' : t('agencyWork.table.answered', { n: row.responseRate }) }}</b>
            <small class="sub">{{ t('agencyWork.table.awaiting', { n: row.awaitingCount }) }}</small>
          </td>

          <td v-if="isOwner">
            <span v-if="!Number(row.plannedBudget)" class="pill slate">{{ t('agencyWork.budget.none') }}</span>
            <span v-else-if="overBy(row) > 0" class="pill red">
              {{ t('agencyWork.budget.over', { amount: formatMoney(overBy(row), currency, locale) }) }}
            </span>
            <span v-else class="pill green">
              {{ t('agencyWork.budget.used', { n: percent(row.spentBudget, row.plannedBudget) }) }}
            </span>
          </td>

          <td class="next">{{ row.nextStep?.title || '—' }}</td>

          <td v-if="showActions" class="r" @click.stop>
            <div class="actions">
              <button
                v-for="action in ACTIONS"
                :key="action.section"
                type="button"
                class="action"
                :title="t(action.labelKey)"
                :aria-label="`${t(action.labelKey)}: ${row.name}`"
                @click="openEvent(row, action.section)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" v-html="action.icon"></svg>
              </button>
            </div>
          </td>
          <td v-else class="more" aria-hidden="true">→</td>
        </tr>

        <tr v-if="!rows.length">
          <td :colspan="columnCount" class="empty">{{ emptyText || t('agencyWork.table.empty') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * The agency's events as a table — the dashboard's "active events" and the
 * event list draw the same one.
 *
 * <p>An owner reads it comparatively: who leads each event, how far along the
 * tasks are, and whether the money is holding. A member reads it for
 * themselves: their part on each event and the overdue work that is theirs.
 * The budget column is not there for a member at all; the server does not send
 * it either.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { DashIcons } from '@/utils/dashIcons.js'
import { clientLine, formatDay, formatMoney, percent } from '@/utils/agencyFormat.js'
import { useAgencyPreferences } from '@/composables/useAgencyPreferences'
import { useOpenAgencyEvent } from '@/composables/useOpenAgencyEvent'

const props = defineProps({
  rows: { type: Array, required: true },
  isOwner: { type: Boolean, default: false },
  showActions: { type: Boolean, default: false },
  emptyText: { type: String, default: '' },
  /** The agency's own "at risk" window, in days; dates inside it are drawn as urgent. */
  riskWindowDays: { type: Number, default: 30 },
})

const ACTIONS = [
  { section: 'tasks', labelKey: 'agencyWork.actions.tasks', icon: DashIcons.tasks },
  { section: 'guests', labelKey: 'agencyWork.actions.guests', icon: DashIcons.guests },
  { section: 'agenda', labelKey: 'agencyWork.actions.timeline', icon: DashIcons.agenda },
]

const { t, locale } = useI18n()

/** Amounts are drawn in the agency's own currency, from its settings. */
const { currency, load: loadPreferences } = useAgencyPreferences()
loadPreferences()
const { openEvent } = useOpenAgencyEvent()

const overdueKey = computed(() => (props.isOwner ? 'agencyWork.overdue' : 'agencyWork.myOverdue'))
const columnCount = computed(() => (props.isOwner ? 8 : 7))

const overdueOf = (row) => (props.isOwner ? row.overdueTasks : row.myOverdueTasks ?? 0)
const overBy = (row) => Number(row.spentBudget || 0) - Number(row.plannedBudget || 0)

function subline(row) {
  return [categoryLabel(row.categoryType), row.location, clientLine(row)].filter(Boolean).join(' · ')
}

function categoryLabel(category) {
  if (!category) return ''
  const key = `eventTypes.${category}`
  const label = t(key)
  return label === key ? category.charAt(0) + category.slice(1).toLowerCase() : label
}

function daysLabel(days) {
  if (days === 0) return t('agencyWork.today')
  return days > 0 ? t('agencyWork.inDays', { n: days }) : t('agencyWork.daysAgo', { n: -days })
}
</script>

<style scoped>
/* `.tbl` is the design's, in `ivy/dash.css`. The rest is this table's. */
.tbl-wrap {
  width: 100%;
  overflow-x: auto;
}

.agency-events {
  min-width: 860px;
}

.agency-events td {
  font-size: 14px;
}

.clickable {
  cursor: pointer;
}

.clickable:focus-visible {
  outline: 3px solid var(--gold);
  outline-offset: -3px;
}

.name {
  display: block;
  font-weight: 600;
}

.sub {
  display: block;
  margin-top: 3px;
  color: var(--ink-3);
  font-size: 12.5px;
}

.sub.urgent {
  color: var(--rose-ink);
  font-weight: 600;
}

.nowrap {
  white-space: nowrap;
}

.rsvp {
  color: var(--ivy);
}

.next {
  max-width: 220px;
}

.bar {
  display: block;
  width: 88px;
  height: 5px;
  margin: 6px 0;
  border-radius: 5px;
  background: var(--mist);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  border-radius: 5px;
  background: var(--moss);
}

.pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.pill.red {
  background: var(--rose);
  color: var(--rose-ink);
}

.pill.green {
  background: var(--mist);
  color: var(--ivy);
}

.pill.slate {
  background: var(--mist-2);
  color: var(--ink-2);
}

small.pill {
  margin-top: 4px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.action {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink-2);
}

.action:hover {
  color: var(--ivy);
  border-color: var(--moss);
}

.action svg {
  width: 15px;
  height: 15px;
}

.more {
  color: var(--ink-3);
  text-align: right;
}

.empty {
  padding: 28px;
  text-align: center;
  color: var(--ink-3);
}

.r {
  text-align: right;
}
</style>

<template>
  <div class="agency-events-page">
    <PageHead
      :title="isOwner ? t('agencyWork.events.ownerTitle') : t('agencyWork.events.memberTitle')"
      :subtitle="isOwner ? t('agencyWork.events.ownerSubtitle') : t('agencyWork.events.memberSubtitle')"
    >
      <template #actions>
        <RouterLink v-if="isOwner" class="btn btn-primary btn-sm" :to="`/${lang}/event-category`">{{ t('dash.newEvent') }}</RouterLink>
        <RouterLink v-else class="btn btn-primary btn-sm" :to="`/${lang}/agency/tasks`">{{ t('agencyWork.newTask') }}</RouterLink>
      </template>
    </PageHead>

    <div class="kpis">
      <div v-for="card in kpis" :key="card.key" :class="['kpi', card.tone]">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
        <small>{{ card.note }}</small>
      </div>
    </div>

    <p class="hint">
      <span :class="['pill', isOwner ? 'amber' : 'green']">{{ isOwner ? t('agencySidebar.ownerRole') : t('agencySidebar.memberRole') }}</span>
      {{ isOwner ? t('agencyWork.events.ownerHint') : t('agencyWork.events.memberHint') }}
    </p>

    <section class="card list" aria-labelledby="agency-events-list">
      <div class="card-head">
        <div>
          <h2 id="agency-events-list">{{ isOwner ? t('agencyWork.events.ownerList') : t('agencyWork.events.memberList') }}</h2>
          <p class="lede">{{ isOwner ? t('agencyWork.events.ownerListHint') : t('agencyWork.events.memberListHint') }}</p>
        </div>
        <div class="view-toggle" role="group" :aria-label="t('agencyWork.events.viewLabel')">
          <button type="button" :class="{ on: view === 'table' }" :aria-pressed="view === 'table'" @click="setView('table')">
            {{ t('agencyWork.events.viewTable') }}
          </button>
          <button type="button" :class="{ on: view === 'cards' }" :aria-pressed="view === 'cards'" @click="setView('cards')">
            {{ t('agencyWork.events.viewCards') }}
          </button>
        </div>
      </div>

      <div class="filters">
        <label class="field search-field">
          <span>{{ t('agencyWork.events.search') }}</span>
          <input v-model="filters.q" type="search" :placeholder="t('agencyWork.events.searchPlaceholder')" />
        </label>
        <label class="field">
          <span>{{ t('agencyWork.events.status') }}</span>
          <select v-model="filters.status">
            <option value="">{{ t('agencyWork.events.allStatuses') }}</option>
            <option v-for="status in STATUSES" :key="status" :value="status">{{ t(`agencyWork.status.${status}`) }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t('agencyWork.events.period') }}</span>
          <select v-model="filters.withinDays">
            <option value="">{{ t('agencyWork.events.allDates') }}</option>
            <option v-for="days in PERIODS" :key="days" :value="days">{{ t('agencyWork.deadlines.nextDays', { n: days }) }}</option>
          </select>
        </label>
        <label v-if="isOwner" class="field">
          <span>{{ t('agencyWork.table.lead') }}</span>
          <select v-model="filters.leadId">
            <option value="">{{ t('agencyWork.events.allLeads') }}</option>
            <option v-for="person in organizers" :key="person.id" :value="person.id">{{ person.name || '—' }}</option>
          </select>
        </label>
        <label v-else class="field">
          <span>{{ t('agencyWork.table.myRole') }}</span>
          <select v-model="filters.myRole">
            <option value="">{{ t('agencyWork.events.allAssigned') }}</option>
            <option value="LEAD">{{ t('agencyWork.events.iLead') }}</option>
            <option value="ASSISTANT">{{ t('agencyWork.events.iAssist') }}</option>
          </select>
        </label>
        <button type="button" class="clear" :disabled="!hasFilters" @click="clearFilters">{{ t('agencyWork.events.clear') }}</button>
      </div>

      <div class="foot">
        <span>{{ t('agencyWork.events.shown', { shown: rows.length, total: available }) }}</span>
        <span>{{ isOwner ? t('agencyWork.events.ownerFoot') : t('agencyWork.events.memberFoot') }}</span>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-else-if="loading && !loaded" class="muted">{{ t('common.loading') }}</p>
      <template v-else>
        <AgencyEventsTable
          v-if="view === 'table'"
          :rows="rows"
          :is-owner="isOwner"
          :risk-window-days="riskWindowDays"
          show-actions
          :empty-text="t('agencyWork.events.noMatch')"
        />
        <AgencyEventCards v-else :rows="rows" :is-owner="isOwner" :empty-text="t('agencyWork.events.noMatch')" />
      </template>
    </section>

    <div class="below">
      <template v-if="isOwner">
        <section class="card" aria-labelledby="agency-events-attention">
          <div class="card-head">
            <div>
              <h2 id="agency-events-attention">{{ t('agencyWork.events.needAttention') }}</h2>
              <p class="lede">{{ t('agencyWork.events.needAttentionHint') }}</p>
            </div>
          </div>
          <ul v-if="lateRows.length" class="lines">
            <li v-for="row in lateRows" :key="row.eventId" class="line">
              <div>
                <b>{{ row.name }}</b>
                <small>{{ t('agencyWork.overdue', { n: row.overdueTasks }) }}<template v-if="row.daysUntil != null"> · {{ t('agencyWork.inDays', { n: row.daysUntil }) }}</template></small>
              </div>
              <button type="button" class="text-link" @click="openEvent(row, 'tasks')">{{ t('agencyWork.open') }} →</button>
            </li>
          </ul>
          <p v-else class="empty">{{ t('agencyWork.events.noLate') }}</p>
        </section>

        <section class="card" aria-labelledby="agency-events-split">
          <div class="card-head">
            <div>
              <h2 id="agency-events-split">{{ t('agencyWork.events.distribution') }}</h2>
              <p class="lede">{{ t('agencyWork.events.distributionHint') }}</p>
            </div>
          </div>
          <ul class="lines">
            <li v-for="entry in distribution" :key="entry.id || 'none'" class="line">
              <div>
                <b>{{ entry.name || t('agencyWork.unassigned') }}</b>
                <small>{{ t('agencyWork.table.lead') }}</small>
              </div>
              <span class="pill slate">{{ t('agencyWork.events.eventCount', { n: entry.count }) }}</span>
            </li>
          </ul>
        </section>
      </template>
      <template v-else>
        <AgencyNextSteps :rows="rows" />
        <AgencyAwaitingGuests :rows="rows" />
      </template>
    </div>

    <p class="footnote">{{ isOwner ? t('agencyWork.events.ownerFootnote') : t('agencyWork.events.memberFootnote') }}</p>
  </div>
</template>

<script setup>
/**
 * The agency's events as a list (2026 design, "Настани по улога").
 *
 * <p>The owner sees every event the agency runs, filterable by who leads it,
 * with the budget beside each. A member sees the events they were put on,
 * filterable by whether they lead or assist, with their own overdue work —
 * other events are not in the response, so there is nothing here to hide.
 *
 * <p>Filtering happens on the server. The cards above the list are computed
 * from what is shown, so they move with the filters — the design asks for
 * exactly that, and it keeps "3 overdue" equal to what the rows add up to.
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import AgencyEventsTable from '@/components/agency/AgencyEventsTable.vue'
import AgencyEventCards from '@/components/agency/AgencyEventCards.vue'
import AgencyNextSteps from '@/components/agency/AgencyNextSteps.vue'
import AgencyAwaitingGuests from '@/components/agency/AgencyAwaitingGuests.vue'
import { agencyWorkspaceService } from '@/services/agencyWorkspace.service'
import { getErrorMessage } from '@/services/apiError'
import { useAgencyRole } from '@/composables/useAgencyRole'
import { useOpenAgencyEvent } from '@/composables/useOpenAgencyEvent'
import { useRoute } from 'vue-router'

const STATUSES = ['ACTIVE', 'DRAFT', 'PENDING', 'COMPLETED', 'SUSPENDED']
const PERIODS = [30, 90]
const SEARCH_DEBOUNCE_MS = 250
const VIEW_KEY = 'ivy.agencyEvents.view'

const { t } = useI18n()
const { isOwner } = useAgencyRole()
const { openEvent } = useOpenAgencyEvent()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const emptyFilters = () => ({ q: '', status: '', withinDays: '', leadId: '', myRole: '' })
const filters = reactive(emptyFilters())

const rows = ref([])
const available = ref(0)
/** The agency's "soon" window, as the server read it from the agency settings. */
const riskWindowDays = ref(30)
const organizers = ref([])
const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const view = ref(readView())

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await agencyWorkspaceService.events({ ...filters })
    const data = response?.data?.data ?? response?.data ?? {}
    rows.value = data.rows ?? []
    available.value = data.available ?? 0
    riskWindowDays.value = data.riskWindowDays ?? riskWindowDays.value
    // The lead list is the unfiltered one, so picking a lead cannot empty the dropdown.
    if (!filters.leadId) organizers.value = data.organizers ?? []
    loaded.value = true
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

let searchTimer
watch(() => filters.q, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, SEARCH_DEBOUNCE_MS)
})
watch(() => [filters.status, filters.withinDays, filters.leadId, filters.myRole], load)
onMounted(load)

const hasFilters = computed(() => Object.values(filters).some((value) => value !== ''))

function clearFilters() {
  Object.assign(filters, emptyFilters())
}

const sum = (field) => rows.value.reduce((total, row) => total + (Number(row[field]) || 0), 0)
const soon = computed(() => rows.value.filter((row) => row.status === 'ACTIVE' && row.daysUntil != null && row.daysUntil >= 0 && row.daysUntil <= riskWindowDays.value).length)

const kpis = computed(() => {
  if (isOwner.value) {
    const overBudget = rows.value.filter((row) => Number(row.plannedBudget) > 0 && Number(row.spentBudget) > Number(row.plannedBudget)).length
    return [
      { key: 'shown', label: t('agencyWork.events.kpiShown'), value: rows.value.length, note: t('agencyWork.events.kpiShownNote') },
      { key: 'soon', label: t('agencyWork.kpi.soon', { days: riskWindowDays.value }), value: soon.value, note: t('agencyWork.events.kpiSoonNote') },
      { key: 'late', label: t('agencyWork.kpi.overdue'), value: sum('overdueTasks'), note: t('agencyWork.events.kpiLateNote'), tone: sum('overdueTasks') ? 'danger' : '' },
      { key: 'budget', label: t('agencyWork.events.kpiOverBudget'), value: overBudget, note: t('agencyWork.events.kpiOverBudgetNote'), tone: overBudget ? 'warn' : '' },
    ]
  }
  return [
    { key: 'mine', label: t('agencyWork.kpi.myEvents'), value: rows.value.length, note: t('agencyWork.events.kpiShownNote') },
    { key: 'soon', label: t('agencyWork.kpi.soon', { days: riskWindowDays.value }), value: soon.value, note: t('agencyWork.events.kpiSoonNote') },
    { key: 'late', label: t('agencyWork.kpi.myOverdue'), value: sum('myOverdueTasks'), note: t('agencyWork.events.kpiMyLateNote'), tone: sum('myOverdueTasks') ? 'danger' : '' },
    { key: 'rsvp', label: t('agencyWork.kpi.awaitingRsvp'), value: sum('awaitingCount'), note: t('agencyWork.events.kpiRsvpNote'), tone: sum('awaitingCount') ? 'warn' : '' },
  ]
})

const lateRows = computed(() => rows.value.filter((row) => row.overdueTasks > 0))

/** How many of the shown events each lead carries, busiest first. */
const distribution = computed(() => {
  const byLead = new Map()
  for (const row of rows.value) {
    const id = row.lead?.id || ''
    const entry = byLead.get(id) || { id, name: row.lead?.name, count: 0 }
    entry.count += 1
    byLead.set(id, entry)
  }
  return [...byLead.values()].sort((a, b) => b.count - a.count)
})

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table'
  } catch {
    return 'table'
  }
}

function setView(next) {
  view.value = next
  try {
    localStorage.setItem(VIEW_KEY, next)
  } catch {
    // Remembering the view is a convenience; the page works without it.
  }
}
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
/* `.kpis`, `.kpi`, `.card` and `.card-head` are the design's, in `ivy/dash.css`. */
.kpi span,
.kpi small {
  font-family: var(--ui);
}

.kpi.danger strong {
  color: var(--rose-ink);
}

.kpi.warn strong {
  color: var(--gold-deep);
}

.hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  color: var(--ink-2);
  font-size: 13px;
}

.list {
  padding: 0;
  overflow: hidden;
}

.list .card-head {
  padding: 20px 20px 0;
}

.view-toggle {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 9px;
  overflow: hidden;
}

.view-toggle button {
  padding: 7px 12px;
  border: 0;
  background: var(--card);
  color: var(--ink-2);
  font-size: 13px;
}

.view-toggle button.on {
  background: var(--ivy);
  color: var(--on-ivy, #fff);
}

.filters {
  display: grid;
  grid-template-columns: minmax(180px, 1.6fr) repeat(3, minmax(130px, 1fr)) auto;
  gap: 10px;
  align-items: end;
  padding: 14px 20px;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: var(--mist-2);
}

.field span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 600;
}

.field input,
.field select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink);
  font-size: 13.5px;
}

.clear {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ivy);
  font-size: 13px;
}

.clear:disabled {
  opacity: 0.5;
}

.foot {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 20px;
  color: var(--ink-3);
  font-size: 12.5px;
}

.list :deep(.tbl-wrap),
.list :deep(.cards),
.list > .empty,
.list > .error,
.list > .muted {
  padding: 0 20px 18px;
}

.below {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.footnote {
  margin-top: 14px;
  color: var(--ink-3);
  font-size: 12px;
}

.error {
  color: var(--rose-ink);
}

@media (max-width: 1100px) {
  .filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .field.search-field {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .below {
    grid-template-columns: 1fr;
  }
}
</style>

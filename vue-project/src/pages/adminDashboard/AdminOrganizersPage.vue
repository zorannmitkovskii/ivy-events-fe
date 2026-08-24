<template>
  <div class="admin-page">
    <PageHeader :title="t('adminOrganizers.title')" :subtitle="t('adminOrganizers.subtitle')" />

    <Toolbar v-model:search="search" :search-placeholder="t('adminOrganizers.search')" />

    <!--
      Two different failures. A directory that could not be read has no table
      to show; a refused change has one, and hiding it would lose the
      administrator's place over somebody else's rule.
    -->
    <p v-if="error" class="load-error" role="alert">{{ error }}</p>
    <p v-if="actionError" class="load-error" role="alert">{{ actionError }}</p>

    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="id"
      :loading="loading"
      :error="error"
      :error-title="t('adminOrganizers.loadFailed')"
      :empty-title="t('adminOrganizers.empty')"
      :sort-key="sort"
      :sort-direction="direction"
      @sort="onSort"
    >
      <template #cell-name="{ row }">
        <button type="button" class="name-link" @click="openWorkload(row)">
          {{ row.firstName }} {{ row.lastName }}
        </button>
        <div class="text-sub">{{ row.email }}</div>
      </template>

      <template #cell-status="{ row }">
        <StatusPill
          :tone="row.status === 'ACTIVE' ? 'ok' : 'error'"
          :label="t(`adminOrganizers.statusValue.${row.status}`)"
        />
      </template>

      <template #cell-overdueTasks="{ row }">
        <span :class="{ late: row.overdueTasks > 0 }">{{ row.overdueTasks }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="td-actions">
          <select
            class="role-select"
            :value="organizationRole(row)"
            :aria-label="t('adminOrganizers.changeRole')"
            @change="changeRole(row, $event.target.value)"
          >
            <option v-for="role in ROLE_OPTIONS" :key="role" :value="role">{{ role }}</option>
          </select>
          <button type="button" class="action" @click="toggleStatus(row)">
            {{ row.status === 'ACTIVE' ? t('adminOrganizers.disable') : t('adminOrganizers.enable') }}
          </button>
        </div>
      </template>

      <!--
        A capped list that looks complete is worse than no list, so the cap
        says so here rather than passing for the whole platform.
      -->
      <template v-if="truncated || total > perPage" #footer>
        <span v-if="truncated" class="truncated" role="status">
          {{ t('adminOrganizers.truncated', { shown: rows.length, limit: POPULATION_LIMIT }) }}
        </span>
        <template v-if="total > perPage">
          <span>{{ t('adminOrganizers.showing', { from: first + 1, to: first + rows.length, total }) }}</span>
          <span class="pagination-btns">
            <button class="pg-btn" :disabled="first === 0" @click="prev">{{ t('userDirectory.previous') }}</button>
            <button class="pg-btn" :disabled="first + perPage >= total" @click="next">{{ t('userDirectory.next') }}</button>
          </span>
        </template>
      </template>
    </DataTable>

    <!-- Drill-down -->
    <div v-if="workloadOf" class="dialog-overlay" @click.self="closeWorkload">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ workloadOf.firstName }} {{ workloadOf.lastName }}</h3>
          <button class="dialog-close" @click="closeWorkload">&times;</button>
        </div>
        <div class="dialog-body">
          <p v-if="workloadLoading">{{ t('adminOrganizers.loading') }}</p>
          <p v-else-if="workloadError" class="load-error" role="alert">{{ workloadError }}</p>
          <template v-else-if="workload">
            <p class="drill-summary">
              {{ t('adminOrganizers.drillSummary', {
                events: workload.totals.eventCount,
                overdue: workload.totals.overdueTaskCount,
              }) }}
            </p>
            <ul class="drill-list">
              <li v-for="ev in workload.events" :key="ev.eventId">
                <span class="drill-name">{{ ev.name }}</span>
                <span class="drill-meta">{{ ev.date || '—' }} · {{ ev.status }}</span>
                <span class="drill-meta">
                  {{ t('adminOrganizers.drillTasks', { overdue: ev.overdueTaskCount, open: ev.openTaskCount }) }}
                </span>
              </li>
              <li v-if="workload.events.length === 0" class="drill-empty">
                {{ t('adminOrganizers.drillEmpty') }}
              </li>
            </ul>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Every organizer on the platform, and what each is carrying (IVY-1102).
 *
 * <p>Two columns need their definitions on the screen rather than in a
 * document: "assigned" is a grant and not authorship, and late work is counted
 * per event, so two organizers sharing a wedding both show its overdue tasks.
 * The definitions come from the payload, so the wording cannot drift from the
 * rule that produced the number.
 *
 * <p>Search and sort are sent to the server. Sorting the twenty rows on screen
 * would order the page rather than the platform, and the busiest organizer is
 * exactly the one who would stay hidden on page three.
 */
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { organizersService } from '@/services/organizers.service'
import { getErrorMessage } from '@/services/apiError'
import { computed } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import Toolbar from '@/components/ui/Toolbar.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import DataTable from '@/components/ui/DataTable.vue'

const ROLE_OPTIONS = ['ORG_ADMIN', 'ORGANIZER', 'USER']
const POPULATION_LIMIT = 500
const SEARCH_DEBOUNCE_MS = 300

const { t } = useI18n()

const rows = ref([])
const total = ref(0)
const truncated = ref(false)
const definitions = ref({})
const loading = ref(true)
const error = ref('')
/** A refused change, kept apart from a failed load: one hides the table, the other must not. */
const actionError = ref('')

const search = ref('')
const sort = ref('OVERDUE_TASKS')
const direction = ref('DESC')

/**
 * The two counted columns carry their definition on the screen: "assigned" is
 * a grant and not authorship, and late work is counted per event, so two
 * organizers sharing a wedding both show its overdue tasks. The wording comes
 * from the payload, so it cannot drift from the rule that produced the number.
 */
const columns = computed(() => [
  { key: 'name', label: t('adminOrganizers.organizer') },
  { key: 'status', label: t('adminOrganizers.status') },
  { key: 'activeEvents', sortAs: 'ACTIVE_EVENTS', label: t('adminOrganizers.activeEvents'), sortable: true, align: 'right', note: definitions.value.activeEvents },
  { key: 'overdueTasks', sortAs: 'OVERDUE_TASKS', label: t('adminOrganizers.overdueTasks'), sortable: true, align: 'right', note: definitions.value.overdueTasks },
  { key: 'actions', label: t('adminOrganizers.actions'), align: 'right' },
])
const first = ref(0)
const perPage = 20

let searchTimer = null

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    first.value = 0
    load()
  }, SEARCH_DEBOUNCE_MS)
})

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await organizersService.list({
      search: search.value,
      sort: sort.value,
      direction: direction.value,
      first: first.value,
      max: perPage,
    })
    const data = response?.data ?? response
    rows.value = data.rows || []
    total.value = data.total || 0
    truncated.value = Boolean(data.truncated)
    definitions.value = data.definitions || {}
  } catch (e) {
    error.value = `${t('adminOrganizers.loadFailed')} ${getErrorMessage(e)}`
    rows.value = []
  } finally {
    loading.value = false
  }
}

/**
 * DataTable reports the click; the ordering itself stays on the server, so a
 * sort orders the platform rather than the twenty rows currently on screen.
 */
function onSort({ key, direction: next }) {
  sort.value = key
  direction.value = next
  first.value = 0
  load()
}

function next() {
  first.value += perPage
  load()
}

function prev() {
  first.value = Math.max(0, first.value - perPage)
  load()
}

/** The organization seat this person holds; the select never offers ADMIN. */
function organizationRole(row) {
  return ROLE_OPTIONS.find((role) => (row.roles || []).includes(role)) || 'ORGANIZER'
}

async function changeRole(row, role) {
  actionError.value = ''
  try {
    await organizersService.setRole(row.id, role)
    await load()
  } catch (e) {
    actionError.value = getErrorMessage(e)
    await load()
  }
}

async function toggleStatus(row) {
  actionError.value = ''
  const enabled = row.status !== 'ACTIVE'
  try {
    await organizersService.setStatus(row.id, enabled)
    // Reflected without a full reload: the row is what the administrator is
    // looking at, and a whole-page refresh loses their place in the list.
    row.status = enabled ? 'ACTIVE' : 'DISABLED'
  } catch (e) {
    actionError.value = getErrorMessage(e)
  }
}

/* ---- drill-down ---- */
const workloadOf = ref(null)
const workload = ref(null)
const workloadLoading = ref(false)
const workloadError = ref('')

async function openWorkload(row) {
  workloadOf.value = row
  workload.value = null
  workloadError.value = ''
  workloadLoading.value = true
  try {
    const response = await organizersService.workload(row.id)
    workload.value = response?.data ?? response
  } catch (e) {
    workloadError.value = getErrorMessage(e)
  } finally {
    workloadLoading.value = false
  }
}

function closeWorkload() {
  workloadOf.value = null
  workload.value = null
}
</script>

<style scoped>
.admin-page { max-width: 1200px; }

.load-error {
  padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 10px; color: #dc2626; font-size: 14px; font-weight: 500;
}
.truncated { font-size: 13px; color: #92400e; background: #fffbeb;
  border: 1px solid #fde68a; border-radius: 10px; padding: 8px 12px; }
.loading { padding: 40px 0; text-align: center; color: var(--ink-3); }

.table-card { background: #fff; border-radius: 14px; border: 1px solid var(--line); overflow: hidden; }
.table { width: 100%; border-collapse: collapse; text-align: left; }
.table thead tr { background: var(--sunken); border-bottom: 1px solid var(--line); }
.table th { padding: 12px 20px; font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; vertical-align: top; }
.table td { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid var(--sunken); }
.th-right, .td-actions { text-align: right; }
.num { font-variant-numeric: tabular-nums; font-weight: 600; }
.late { color: #b91c1c; }
.empty { text-align: center; color: #556070; padding: 40px 20px !important; }

/* The column definitions have to be readable to be worth shipping: was
   var(--ink-4) at 10px, which is 2.56:1. */
.col-note { display: block; margin-top: 4px; font-size: 11px; font-weight: 400; text-transform: none; color: #556070; max-width: 24ch; }

.sort {
  background: none; border: none; padding: 0; cursor: pointer;
  font: inherit; color: inherit; text-transform: inherit; letter-spacing: inherit;
}
.sort--active { color: var(--brand-main); }
.sort:focus-visible, .name-link:focus-visible, .action:focus-visible {
  outline: 2px solid var(--brand-main); outline-offset: 2px;
}

.name-link {
  background: none; border: none; padding: 0; cursor: pointer;
  font: inherit; font-weight: 600; color: var(--brand-main); text-align: left;
}
.text-sub { font-size: 12px; color: #556070; margin-top: 2px; }

.role-select { padding: 5px 8px; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; margin-right: 8px; }
.action {
  padding: 5px 12px; border: 1px solid var(--line); border-radius: 8px;
  background: #fff; font-size: 13px; cursor: pointer;
}
.action:hover { background: var(--sunken); }

.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid var(--line); font-size: 13px; color: var(--ink-3); }
.pagination-btns { display: flex; gap: 4px; }
.pg-btn { padding: 6px 14px; border: 1px solid var(--line); border-radius: 8px; background: #fff; font-size: 13px; cursor: pointer; }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.dialog-overlay {
  position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.dialog {
  background: #fff; border-radius: 16px; width: 100%; max-width: 620px;
  max-height: 90vh; display: flex; flex-direction: column;
}
.dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--line); }
.dialog-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
.dialog-close { background: none; border: none; font-size: 24px; color: var(--ink-4); cursor: pointer; }
.dialog-body { padding: 24px; overflow-y: auto; }

.drill-summary { font-size: 14px; color: var(--ink-2); margin: 0 0 12px; }
.drill-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
.drill-list li { display: flex; flex-direction: column; gap: 2px; border-bottom: 1px solid var(--sunken); padding-bottom: 8px; }
.drill-name { font-weight: 600; }
.drill-meta { font-size: 12px; color: var(--ink-4); }
.drill-empty { color: var(--ink-4); font-size: 14px; }

@media (max-width: 720px) {
  .table { display: block; overflow-x: auto; }
}
</style>

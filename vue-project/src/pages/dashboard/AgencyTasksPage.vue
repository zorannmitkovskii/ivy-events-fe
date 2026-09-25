<template>
  <div class="agency-tasks">
    <PageHead
      :title="isOwner ? t('agencyTasks.title') : t('agencyTasks.myTitle')"
      :subtitle="isOwner ? t('agencyTasks.subtitle') : t('agencyTasks.mySubtitle')"
    />

    <div class="kpis">
      <div class="kpi">
        <span>{{ t('agencyTasks.kpi.inView') }}</span>
        <strong>{{ shown.length }}</strong>
        <small>{{ t('agencyTasks.kpi.inViewNote') }}</small>
      </div>
      <div :class="['kpi', { danger: overdueCount > 0 }]">
        <span>{{ t('agencyTasks.kpi.overdue') }}</span>
        <strong>{{ overdueCount }}</strong>
        <small>{{ t('agencyTasks.kpi.overdueNote') }}</small>
      </div>
      <div class="kpi">
        <span>{{ t('agencyTasks.kpi.week') }}</span>
        <strong>{{ weekCount }}</strong>
        <small>{{ t('agencyTasks.kpi.weekNote') }}</small>
      </div>
      <div :class="['kpi', { warn: unassignedCount > 0 }]">
        <span>{{ t('agencyTasks.kpi.unassigned') }}</span>
        <strong>{{ unassignedCount }}</strong>
        <small>{{ isOwner ? t('agencyTasks.kpi.unassignedNote') : t('agencyTasks.kpi.unassignedMemberNote') }}</small>
      </div>
    </div>

    <div class="section-line">
      <div>
        <h2>{{ isOwner ? t('agencyTasks.ownerSection') : t('agencyTasks.memberSection', { name: firstName }) }}</h2>
        <p>{{ t('agencyTasks.sectionHint') }}</p>
      </div>
      <div class="view-switch" role="group" :aria-label="t('agencyTasks.viewLabel')">
        <button type="button" :class="{ on: view === 'list' }" :aria-pressed="view === 'list'" @click="setView('list')">
          {{ t('agencyTasks.view.list') }}
        </button>
        <button type="button" :class="{ on: view === 'board' }" :aria-pressed="view === 'board'" @click="setView('board')">
          {{ t('agencyTasks.view.board') }}
        </button>
      </div>
    </div>

    <section class="card tasks-card">
      <div class="task-filters">
        <label class="task-field">
          <span>{{ t('agencyTasks.filter.status') }}</span>
          <select v-model="filters.when">
            <option value="all">{{ t('agencyTasks.filter.statusAll') }}</option>
            <option value="overdue">{{ t('agencyTasks.filter.statusOverdue') }}</option>
            <option value="week">{{ t('agencyTasks.filter.statusWeek') }}</option>
          </select>
        </label>
        <label class="task-field">
          <span>{{ t('agencyTasks.filter.event') }}</span>
          <select v-model="filters.eventId">
            <option value="">{{ t('agencyTasks.allEvents') }}</option>
            <option v-for="event in board.events" :key="event.eventId" :value="event.eventId">{{ event.name }}</option>
          </select>
        </label>
        <div class="task-field scope" role="group" :aria-label="t('agencyTasks.scopeLabel')">
          <span>{{ t('agencyTasks.scopeLabel') }}</span>
          <div class="scope-buttons">
            <button type="button" :aria-pressed="scope === 'mine'" :class="{ on: scope === 'mine' }" @click="setScope('mine')">{{ t('agencyTasks.scopeMine') }}</button>
            <button type="button" :aria-pressed="scope === 'all'" :class="{ on: scope === 'all' }" @click="setScope('all')">{{ t('agencyTasks.scopeAll') }}</button>
          </div>
        </div>
        <label v-if="isOwner && scope === 'all'" class="task-field">
          <span>{{ t('agencyTasks.filter.assignee') }}</span>
          <select v-model="filters.assignee">
            <option value="">{{ t('agencyTasks.filter.assigneeAll') }}</option>
            <option :value="UNASSIGNED">{{ t('agencyTasks.unassignedName') }}</option>
            <option v-for="person in board.team" :key="person.id" :value="person.id">{{ person.name || '—' }}</option>
          </select>
        </label>
      </div>

      <p v-if="error" class="task-error" role="alert">{{ error }}</p>
      <p v-if="loading" class="task-note">{{ t('common.loading') }}</p>

      <template v-else>
        <div v-if="view === 'list'" class="tbl-wrap">
          <table class="tbl task-table">
            <thead>
              <tr>
                <th>{{ t('agencyTasks.table.task') }}</th>
                <th>{{ t('agencyTasks.table.event') }}</th>
                <th>{{ t('agencyTasks.table.due') }}</th>
                <th>{{ t('agencyTasks.table.assignee') }}</th>
                <th>{{ t('agencyTasks.table.status') }}</th>
                <th aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in listRows" :key="task.id" :data-task="task.id">
                <td><b>{{ task.title }}</b></td>
                <td>{{ task.eventName }}</td>
                <td :class="{ late: task.overdue }">{{ task.dueAt ? formatDay(task.dueAt, locale) : t('agencyTasks.noDate') }}</td>
                <td>
                  <span class="who">
                    <span class="initials" :class="{ none: !task.assignee }" aria-hidden="true">{{ task.assignee ? initials(task.assignee.name) || '?' : '—' }}</span>
                    <select
                      v-if="isOwner"
                      :value="task.assignee?.id || ''"
                      :aria-label="t('agencyTasks.assignLabel', { title: task.title })"
                      @change="assign(task, $event.target.value || null)"
                    >
                      <option value="">{{ t('agencyTasks.unassignedName') }}</option>
                      <option v-for="person in board.team" :key="person.id" :value="person.id">{{ person.name || '—' }}</option>
                    </select>
                    <span v-else>{{ task.assignee?.name || t('agencyTasks.unassignedName') }}</span>
                  </span>
                </td>
                <td>
                  <span v-if="task.overdue" class="pill red">{{ t('agencyTasks.overdueTag') }}</span>
                  <span v-else :class="['pill', task.status === 'DONE' ? 'green' : 'slate']">{{ t(`agencyTasks.status.${task.status}`) }}</span>
                </td>
                <td class="r">
                  <button type="button" class="text-link" @click="openEvent({ eventId: task.eventId }, 'tasks')">{{ t('agencyTasks.table.open') }} →</button>
                </td>
              </tr>
              <tr v-if="!shown.length">
                <td colspan="6" class="task-note">{{ t('agencyTasks.empty') }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-else>
          <p class="task-note">{{ t('agencyTasks.keyboardHint') }}</p>
          <AgencyTaskBoard :tasks="shown" :team="board.team" :can-assign="isOwner" @move="move" @assign="assign" />
        </template>
      </template>
    </section>
  </div>
</template>

<script setup>
/**
 * The agency's tasks (2026 agency design, "Задачи" / "Мои задачи").
 *
 * <p>Every task on the viewer's events with who has it, as a list or as a
 * board moved by dragging. An owner sees the agency and hands work out; a
 * member sees their own events, opens on the tasks given to them, and can
 * widen to everything on those events — but not reassign.
 *
 * <p>Moves are applied on screen at once and put back if the server refuses,
 * so a drag feels like a drag without the board lying about what was saved.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import AgencyTaskBoard from '@/components/agency/AgencyTaskBoard.vue'
import { agencyWorkspaceService } from '@/services/agencyWorkspace.service'
import { taskBoardService } from '@/services/taskBoard.service'
import { getErrorMessage } from '@/services/apiError'
import { getFullName, getUserId } from '@/services/auth.service'
import { useAgencyRole } from '@/composables/useAgencyRole'
import { useOpenAgencyEvent } from '@/composables/useOpenAgencyEvent'
import { formatDay, initials } from '@/utils/agencyFormat.js'

const UNASSIGNED = '__none__'
const WEEK_DAYS = 7
const VIEW_KEY = 'ivy.agencyTasks.view'
const SCOPE_KEY = 'ivy.agencyTasks.scope'

const { t, locale } = useI18n()
const { isOwner } = useAgencyRole()
const { openEvent } = useOpenAgencyEvent()

const board = reactive({ tasks: [], team: [], events: [] })
const filters = reactive({ when: 'all', eventId: '', assignee: '' })
const view = ref(readView())
const scope = ref(readScope())
const loading = ref(true)
const error = ref('')
const myId = getUserId()
const firstName = (getFullName() || '').split(' ')[0]

onMounted(async () => {
  try {
    const response = await agencyWorkspaceService.tasks()
    Object.assign(board, response?.data?.data ?? response?.data ?? {})
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
})

function dueWithinWeek(task) {
  if (!task.dueAt || task.overdue) return false
  const due = new Date(task.dueAt)
  const limit = new Date()
  limit.setDate(limit.getDate() + WEEK_DAYS)
  return due >= new Date(new Date().toDateString()) && due <= limit
}

const shown = computed(() =>
  board.tasks.filter((task) => {
    // 'Mine' is one's own work — and, for an owner, the work nobody has yet: handing that out is theirs.
    if (scope.value === 'mine' && task.assignee?.id !== myId && !(isOwner.value && !task.assignee)) return false
    if (filters.when === 'overdue' && !task.overdue) return false
    if (filters.when === 'week' && !dueWithinWeek(task)) return false
    if (filters.eventId && task.eventId !== filters.eventId) return false
    if (filters.assignee === UNASSIGNED && task.assignee) return false
    if (filters.assignee && filters.assignee !== UNASSIGNED && task.assignee?.id !== filters.assignee) return false
    return true
  }),
)

/**
 * The list with finished work at the bottom, the rest in the server's
 * due-date order. Sort is stable, so only DONE moves; a task ticked off drops
 * down at once. The board needs none of this — DONE is its own column.
 */
const listRows = computed(() =>
  [...shown.value].sort((a, b) => Number(a.status === 'DONE') - Number(b.status === 'DONE')),
)

const overdueCount = computed(() => shown.value.filter((task) => task.overdue).length)
const weekCount = computed(() => shown.value.filter(dueWithinWeek).length)
const unassignedCount = computed(() => shown.value.filter((task) => !task.assignee && task.status !== 'DONE').length)

/**
 * A drop or an arrow key. Status only: across events a position means nothing,
 * so no order is sent and each event keeps its own.
 */
async function move(task, status) {
  if (!status || status === task.status) return
  const before = { status: task.status, overdue: task.overdue }
  task.status = status
  task.overdue = status === 'DONE' ? false : task.overdue
  error.value = ''
  try {
    await taskBoardService.move(task.eventId, task.id, status, null)
  } catch (failure) {
    Object.assign(task, before)
    error.value = t('agencyTasks.moveFailed', { reason: getErrorMessage(failure) })
  }
}

async function assign(task, assigneeId) {
  const before = task.assignee
  task.assignee = assigneeId ? board.team.find((person) => person.id === assigneeId) ?? { id: assigneeId, name: null } : null
  error.value = ''
  try {
    await taskBoardService.assign(task.eventId, task.id, assigneeId)
  } catch (failure) {
    task.assignee = before
    error.value = t('agencyTasks.assignFailed', { reason: getErrorMessage(failure) })
  }
}

function readView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'board' ? 'board' : 'list'
  } catch {
    return 'list'
  }
}

function readScope() {
  try {
    return localStorage.getItem(SCOPE_KEY) === 'all' ? 'all' : 'mine'
  } catch {
    return 'mine'
  }
}

function setScope(next) {
  scope.value = next
  // A filter on somebody who is hidden again would leave the list empty for no visible reason.
  if (next === 'mine') filters.assignee = ''
  try {
    localStorage.setItem(SCOPE_KEY, next)
  } catch {
    // Remembering the choice is a convenience; the page works without it.
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
/* The labels under the figures read in the UI face, as on the other agency screens. */
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

.section-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin: 24px 0 12px;
}

.section-line h2 {
  margin: 0;
  font-size: 22px;
}

.section-line p {
  margin: 3px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}

.task-field.scope {
  flex: 0 0 auto;
  min-width: 0;
}

.view-switch,
.scope-buttons {
  display: inline-flex;
  border: 1px solid var(--line);
  border-radius: 9px;
  overflow: hidden;
}

.view-switch button,
.scope-buttons button {
  padding: 7px 14px;
  border: 0;
  background: var(--card);
  color: var(--ink-2);
  font-size: 13px;
}

.view-switch button.on,
.scope-buttons button.on {
  background: var(--ivy);
  color: var(--on-ivy, #fff);
}

.tasks-card {
  padding: 0;
  overflow: hidden;
}

.task-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
  background: var(--mist-2);
}

.task-field {
  flex: 1;
  min-width: 160px;
}

.task-field > span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12px;
  font-weight: 600;
}

.task-field select {
  width: 100%;
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
  font-size: 13.5px;
}

.tbl-wrap {
  overflow-x: auto;
  padding: 0 18px 12px;
}

.task-table {
  min-width: 760px;
}

.task-table td {
  font-size: 14px;
}

.task-table td.late {
  color: var(--rose-ink);
  font-weight: 700;
}

.who {
  display: flex;
  align-items: center;
  gap: 8px;
}

.who select {
  min-height: 32px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--card);
  font: inherit;
  font-size: 13px;
}

.initials {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--mist);
  color: var(--ivy);
  font-size: 11px;
  font-weight: 700;
}

.initials.none {
  background: var(--mist-2);
  color: var(--ink-3);
}

.r {
  text-align: right;
}

.task-note {
  padding: 12px 18px 0;
  color: var(--ink-3);
  font-size: 13px;
}

.task-error {
  padding: 12px 18px 0;
  color: var(--rose-ink);
}
</style>

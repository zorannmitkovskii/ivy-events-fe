<template>
  <div>
    <PageHead
      :title="isOwner ? t('agencyCalendar.title') : t('agencyCalendar.myTitle')"
      :subtitle="t('agencyCalendar.subtitle')"
    >
      <template #actions>
        <button class="btn btn-ghost btn-sm" type="button" @click="step(-1)">{{ t('agencyCalendar.previous') }}</button>
        <button class="btn btn-ghost btn-sm" type="button" @click="goToday">{{ t('agencyCalendar.today') }}</button>
        <button class="btn btn-ghost btn-sm" type="button" @click="step(1)">{{ t('agencyCalendar.next') }}</button>
      </template>
    </PageHead>

    <!-- The Agency-Organizer design's four: what is on the calendar, what is
         close, what is due this week, and which month is showing. -->
    <div class="kpis">
      <div class="kpi"><span>{{ t('agencyCalendar.kpi.events') }}</span><strong>{{ dated.length }}</strong><small>{{ t('agencyCalendar.kpi.eventsNote') }}</small></div>
      <div class="kpi"><span>{{ t('agencyCalendar.kpi.soon', { days: riskWindowDays }) }}</span><strong>{{ soonCount }}</strong><small>{{ t('agencyCalendar.kpi.soonNote') }}</small></div>
      <div class="kpi"><span>{{ t('agencyCalendar.kpi.deadlines') }}</span><strong>{{ weekItems.filter((item) => item.kind === 'task').length }}</strong><small>{{ t('agencyCalendar.kpi.deadlinesNote') }}</small></div>
      <div class="kpi"><span>{{ t('agencyCalendar.kpi.month') }}</span><strong class="month-kpi">{{ monthLabel }}</strong><small>{{ t('agencyCalendar.kpi.monthNote') }}</small></div>
    </div>

    <div class="view-line">
      <div>
        <h2>{{ t('agencyCalendar.schedule') }}</h2>
        <p>{{ t('agencyCalendar.scheduleHint') }}</p>
      </div>
      <div class="view-switch" role="group" :aria-label="t('agencyCalendar.viewLabel')">
        <button type="button" :class="{ on: view === 'month' }" :aria-pressed="view === 'month'" @click="view = 'month'">{{ t('agencyCalendar.month') }}</button>
        <button type="button" :class="{ on: view === 'week' }" :aria-pressed="view === 'week'" @click="view = 'week'">{{ t('agencyCalendar.thisWeek') }}</button>
      </div>
    </div>

    <section v-if="view === 'week'" class="card">
      <ul v-if="weekItems.length" class="week-list">
        <li v-for="item in weekItems" :key="item.key" class="week-item">
          <div>
            <b>{{ shortDay(item.on) }} · {{ item.title }}</b>
            <small>{{ item.sub }}</small>
          </div>
          <span :class="['week-tag', item.kind]">{{ t(`agencyCalendar.kind.${item.kind}`) }}</span>
        </li>
      </ul>
      <p v-else class="week-empty">{{ t('agencyCalendar.weekEmpty') }}</p>
    </section>

    <section v-else class="card">
      <div class="card-head">
        <h2>{{ monthLabel }}</h2>
        <span class="muted small">{{ t('agencyCalendar.inMonth', { n: eventsThisMonth.length }) }}</span>
      </div>

      <div class="cal">
        <span v-for="name in weekdayNames" :key="name" class="cal-weekday">{{ name }}</span>

        <div
          v-for="cell in cells"
          :key="cell.key"
          class="cal-day"
          :class="{ out: !cell.inMonth, today: cell.isToday }"
          role="button"
          tabindex="0"
          :aria-label="t('agencyCalendar.createOn', { day: cell.key })"
          @click="startCreate(cell)"
          @keydown.enter.prevent="startCreate(cell)"
        >
          <b>{{ cell.day }}</b>
          <button
            v-for="event in cell.events"
            :key="event.id"
            type="button"
            class="cal-event"
            :title="event.name"
            @click.stop="open(event)"
          >{{ event.name || t('organizerOverview.untitled') }}</button>
          <span
            v-for="task in cell.tasks"
            :key="task.id"
            class="cal-task"
            :title="`${task.title} · ${task.eventName}`"
          >{{ task.title }}</span>
        </div>
      </div>
    </section>

    <p v-if="error" class="empty" role="alert">{{ getErrorMessage(error) }}</p>

    <CreateEventOnDayModal
      :open="creating"
      :day="creatingDay"
      @close="creating = false"
      @created="onCreated"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import useWorkspaceEvents from '@/composables/useWorkspaceEvents'
import { selectEvent } from '@/services/eventSelection.service'
import { getErrorMessage } from '@/services/apiError'
import CreateEventOnDayModal from '@/components/modals/CreateEventOnDayModal.vue'
import { agencyWorkspaceService } from '@/services/agencyWorkspace.service'
import { useAgencyRole } from '@/composables/useAgencyRole'

/*
  Every event the agency runs, on one month grid.

  New with the 2026 design, and reading the workspace endpoint rather than a
  calendar one: the agency's calendar *is* its events, and a second endpoint
  returning the same rows in a different shape would be a second set of access
  rules to keep agreeing with the first.
*/

const DAYS_IN_WEEK = 7
const WEEKS_SHOWN = 6
/** More than two deadline chips turn a day cell into a list; the week view has the rest. */
const MAX_TASKS_PER_DAY = 2

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const lang = computed(() => route.params.lang || 'mk')

const { rows, error, load } = useWorkspaceEvents()
const { isOwner } = useAgencyRole()

/** "Soon" on this screen, as on the home: the agency's risk window, sent with the task board. */
const riskWindowDays = ref(30)
const WEEK_DAYS = 7

const today = new Date()
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const view = ref('month')

/*
  Open tasks with a due date, from the agency task board's endpoint — the same
  scope as the board (the whole agency for an owner, the member's own events
  for a member), so a deadline shown here is one the viewer can act on. A
  calendar that cannot read them still shows the events.
*/
const tasks = ref([])

async function loadTasks() {
  try {
    const response = await agencyWorkspaceService.tasks()
    const board = response?.data?.data ?? response?.data ?? {}
    riskWindowDays.value = board.riskWindowDays ?? riskWindowDays.value
    tasks.value = (board.tasks ?? []).filter((task) => task.dueAt && task.status !== 'DONE')
  } catch {
    tasks.value = []
  }
}

onMounted(() => {
  load()
  loadTasks()
})

const soonCount = computed(() =>
  dated.value.filter((entry) => {
    const days = daysFromToday(entry.on)
    return days >= 0 && days <= riskWindowDays.value
  }).length,
)

/** The week view: events and deadlines in the next seven days, soonest first. */
const weekItems = computed(() => {
  const inWeek = (on) => {
    const days = daysFromToday(on)
    return days >= 0 && days <= WEEK_DAYS
  }
  const events = dated.value
    .filter((entry) => inWeek(entry.on))
    .map((entry) => ({ key: `e-${entry.event.id}`, kind: 'event', on: entry.on, title: entry.event.name, sub: t('agencyCalendar.kind.event') }))
  const deadlines = tasks.value
    .map((task) => ({ task, on: new Date(task.dueAt) }))
    .filter(({ on }) => inWeek(on))
    .map(({ task, on }) => ({
      key: `t-${task.id}`,
      kind: 'task',
      on,
      title: task.title,
      sub: [task.eventName, task.assignee?.name].filter(Boolean).join(' · '),
    }))
  return [...events, ...deadlines].sort((a, b) => a.on - b.on)
})

function daysFromToday(on) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const day = new Date(on.getFullYear(), on.getMonth(), on.getDate())
  return Math.round((day - start) / 86400000)
}

const shortDay = (on) => on.toLocaleDateString(locale.value, { day: 'numeric', month: 'short' })

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' }),
)

/** Monday first, in the reader's own language. */
const weekdayNames = computed(() => {
  const monday = new Date(2024, 0, 1)
  return Array.from({ length: DAYS_IN_WEEK }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toLocaleDateString(locale.value, { weekday: 'short' })
  })
})

const dated = computed(() =>
  rows.value
    .map((r) => r.event)
    .filter(Boolean)
    .map((event) => ({ event, on: dateOf(event) }))
    .filter((entry) => entry.on),
)

const eventsThisMonth = computed(() =>
  dated.value.filter(
    (entry) =>
      entry.on.getFullYear() === cursor.value.getFullYear() &&
      entry.on.getMonth() === cursor.value.getMonth(),
  ),
)

/** Six weeks from the Monday on or before the first of the month. */
const cells = computed(() => {
  const first = cursor.value
  const start = new Date(first)
  const weekdayFromMonday = (first.getDay() + 6) % DAYS_IN_WEEK
  start.setDate(first.getDate() - weekdayFromMonday)

  return Array.from({ length: DAYS_IN_WEEK * WEEKS_SHOWN }, (_, i) => {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    return {
      key: day.toISOString().slice(0, 10),
      day: day.getDate(),
      inMonth: day.getMonth() === first.getMonth(),
      isToday: sameDay(day, today),
      events: dated.value.filter((entry) => sameDay(entry.on, day)).map((entry) => entry.event),
      tasks: tasks.value.filter((task) => sameDay(new Date(task.dueAt), day)).slice(0, MAX_TASKS_PER_DAY),
    }
  })
})

function dateOf(event) {
  const raw = event.date || event.eventDate
  return raw ? new Date(raw) : null
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  )
}

function step(months) {
  const next = new Date(cursor.value)
  next.setMonth(next.getMonth() + months)
  cursor.value = next
}

function goToday() {
  cursor.value = new Date(today.getFullYear(), today.getMonth(), 1)
}

/**
 * Opening an event from here also makes it the current one, so the sidebar of
 * the event shell agrees with the page that just loaded.
 *
 * A button and not a link: choosing the event is a side effect, and a `:to`
 * that had to run it would be running it on every render of the grid.
 */
const creating = ref(false)
const creatingDay = ref('')

/*
  A click on empty space in a day opens the dialog for that day. A click on
  an event inside it opens the event — that one stops propagation, or the
  two gestures would both fire and the dialog would appear behind a page
  that is already navigating away.
*/
function startCreate(cell) {
  creatingDay.value = cell.key
  creating.value = true
}

function onCreated() {
  // Reload rather than splice the new event in: the calendar reads dates
  // off the same list the month totals do, and two places holding a
  // half-updated list is how a count stops matching what is drawn.
  load()
}

function open(event) {
  selectEvent(event)
  router.push(`/${lang.value}/dashboard/events/overview`)
}
</script>

<style scoped>
/* `.card`, `.card-head` and `.cal` are the design's, in `ivy/dash.css`; the
   day cell is what the mockup fills by hand and this fills from the data. */
.cal {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.kpi .month-kpi {
  font-size: 22px;
  text-transform: capitalize;
}

.view-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin: 22px 0 12px;
}

.view-line h2 {
  margin: 0;
  font-size: 22px;
}

.view-line p {
  margin: 3px 0 0;
  color: var(--ink-3);
  font-size: 13px;
}

.view-switch {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 9px;
  overflow: hidden;
}

.view-switch button {
  padding: 7px 14px;
  border: 0;
  background: var(--card);
  color: var(--ink-2);
  font-size: 13px;
}

.view-switch button.on {
  background: var(--ivy);
  color: var(--on-ivy, #fff);
}

.week-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.week-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--line);
}

.week-item:first-child {
  border-top: 0;
}

.week-item small {
  display: block;
  margin-top: 3px;
  color: var(--ink-3);
  font-size: 12.5px;
}

.week-tag {
  padding: 3px 8px;
  border-radius: 7px;
  background: var(--mist);
  color: var(--ivy);
  font-size: 12px;
  font-weight: 700;
}

.week-tag.task {
  background: var(--gold-soft);
  color: var(--gold-deep);
}

.week-empty {
  color: var(--ink-3);
}

.cal-task {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--gold-soft);
  color: var(--gold-deep);
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal-weekday {
  padding: 4px 6px 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-3);
}

.cal-day {
  min-height: 96px;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
}

.cal-day b {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

.cal-day.out {
  background: var(--mist-2);
  opacity: 0.6;
}

.cal-day.today {
  border-color: var(--ivy);
  box-shadow: inset 0 0 0 1px var(--ivy);
}

.cal-event {
  display: block;
  width: 100%;
  text-align: left;
  margin-bottom: 4px;
  padding: 3px 7px;
  border-radius: 6px;
  background: var(--mist);
  color: var(--ivy);
  font-size: 12.5px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cal-event:hover {
  background: var(--ivy);
  color: var(--on-ivy);
  text-decoration: none;
}

@media (max-width: 860px) {
  .cal-day {
    min-height: 64px;
    padding: 5px;
  }
}
</style>

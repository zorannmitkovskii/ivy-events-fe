<template>
  <div>
    <PageHead :title="t('agencyCalendar.title')" :subtitle="t('agencyCalendar.subtitle')">
      <template #actions>
        <button class="btn btn-ghost btn-sm" type="button" @click="step(-1)">{{ t('agencyCalendar.previous') }}</button>
        <button class="btn btn-ghost btn-sm" type="button" @click="goToday">{{ t('agencyCalendar.today') }}</button>
        <button class="btn btn-ghost btn-sm" type="button" @click="step(1)">{{ t('agencyCalendar.next') }}</button>
      </template>
    </PageHead>

    <section class="card">
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
        >
          <b>{{ cell.day }}</b>
          <button
            v-for="event in cell.events"
            :key="event.id"
            type="button"
            class="cal-event"
            :title="event.name"
            @click="open(event)"
          >{{ event.name || t('organizerOverview.untitled') }}</button>
        </div>
      </div>
    </section>

    <p v-if="error" class="empty" role="alert">{{ getErrorMessage(error) }}</p>
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

/*
  Every event the agency runs, on one month grid.

  New with the 2026 design, and reading the workspace endpoint rather than a
  calendar one: the agency's calendar *is* its events, and a second endpoint
  returning the same rows in a different shape would be a second set of access
  rules to keep agreeing with the first.
*/

const DAYS_IN_WEEK = 7
const WEEKS_SHOWN = 6

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const lang = computed(() => route.params.lang || 'mk')

const { rows, error, load } = useWorkspaceEvents()

const today = new Date()
const cursor = ref(new Date(today.getFullYear(), today.getMonth(), 1))

onMounted(load)

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

<template>
  <div class="table-wrap">
    <table class="events-table">
      <thead>
        <tr>
          <th
            v-for="column in visibleColumns"
            :key="column.key"
            :class="[column.align, { sorted: sortKey === column.key }]"
            :aria-sort="ariaSort(column.key)"
          >
            <button type="button" class="th-btn" @click="sortBy(column.key)">
              {{ t(`organizerOverview.${column.label}`) }}
              <span v-if="sortKey === column.key" class="caret" aria-hidden="true">
                {{ ascending ? '▲' : '▼' }}
              </span>
            </button>
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="event in sorted"
          :key="event.id"
          :class="{ done: isDone(event), urgent: urgentIds.has(event.id) }"
          tabindex="0"
          @click="$emit('open', event)"
          @keydown.enter="$emit('open', event)"
        >
          <td class="name">
            <span v-if="event.pinned" class="pin" :title="t('organizerOverview.pinnedBadge')">★</span>
            {{ event.name || t('organizerOverview.untitled') }}
          </td>

          <td class="num">{{ dateLabel(event) }}</td>
          <td>{{ placeOf(event) || '—' }}</td>
          <td class="num">{{ event.metrics?.guestCount ?? '—' }}</td>

          <td class="num">
            <!-- The bar carries the comparison, the number carries the value.
                 A column of bare percentages gets read one row at a time. -->
            <span v-if="rsvpOf(event) !== null" class="rsvp">
              <i :style="{ '--fill': rsvpOf(event) + '%' }"></i>
              {{ rsvpOf(event) }}%
            </span>
            <span v-else>—</span>
          </td>

          <td class="num">
            <span :class="{ overdue: overdueOf(event) > 0 }">{{ overdueOf(event) }}</span>
          </td>

          <td v-if="showOrganizer">{{ organizerOf(event) || '—' }}</td>
        </tr>

        <tr v-if="!sorted.length">
          <td :colspan="visibleColumns.length" class="empty-cell">
            {{ t('organizerOverview.noneMatch') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * The agency's events as one sortable list.
 *
 * <p>The card view groups by what needs attention, which answers "what do I do
 * today". This answers the other question an agency running thirty weddings
 * has: comparing them. Urgency is not lost — a row that needs attention keeps
 * its marker — but the order is the reader's to choose.
 */

const props = defineProps({
  events: { type: Array, default: () => [] },
  /** Ids the card view would have put under "needs attention". */
  urgentIds: { type: Set, default: () => new Set() },
  /** Keycloak user id -> display name, for the organizer column. */
  organizerNames: { type: Object, default: () => ({}) },
  isDone: { type: Function, required: true },
  rsvpPercent: { type: Function, required: true },
  invitedCount: { type: Function, required: true },
})

defineEmits(['open'])

const { t, locale } = useI18n()

const COLUMNS = [
  { key: 'name', label: 'colEvent' },
  { key: 'date', label: 'colDate', align: 'num' },
  { key: 'place', label: 'colPlace' },
  { key: 'guests', label: 'colGuests', align: 'num' },
  { key: 'rsvp', label: 'colRsvp', align: 'num' },
  { key: 'overdue', label: 'colOverdue', align: 'num' },
  { key: 'organizer', label: 'colOrganizer' },
]

/*
  The organizer column exists for an agency, which has more than one. The team
  endpoint behind it is ORG_ADMIN-only, so an organizer looking at their own
  workspace gets no names back — and a column of dashes is worse than no column.
*/
const showOrganizer = computed(() => Object.keys(props.organizerNames).length > 0)

const visibleColumns = computed(() =>
  COLUMNS.filter((column) => column.key !== 'organizer' || showOrganizer.value))

const sortKey = ref('date')
const ascending = ref(true)

function sortBy(key) {
  if (sortKey.value === key) {
    ascending.value = !ascending.value
    return
  }
  sortKey.value = key
  ascending.value = true
}

function ariaSort(key) {
  if (sortKey.value !== key) return 'none'
  return ascending.value ? 'ascending' : 'descending'
}

function dateOf(event) {
  const raw = event.date || event.eventDate
  if (!raw) return null
  const time = new Date(raw).getTime()
  return Number.isNaN(time) ? null : time
}

/**
 * Dates through Intl, with a fallback for a language the runtime carries no
 * data for. Chrome ships none for Albanian, and the silent result is an
 * Albanian page printing an English month.
 */
function dateLabel(event) {
  const time = dateOf(event)
  if (time === null) return t('organizerOverview.noDate')

  const date = new Date(time)
  if (!Intl.DateTimeFormat.supportedLocalesOf([locale.value]).length) {
    return date.toISOString().slice(0, 10)
  }
  return date.toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' })
}

function placeOf(event) {
  return event.location?.city || event.location?.name || ''
}

function overdueOf(event) {
  return event.metrics?.overdueTaskCount || 0
}

/** Null means nobody has been invited, which is not a response rate of zero. */
function rsvpOf(event) {
  return props.invitedCount(event) ? props.rsvpPercent(event, 'confirmedCount') : null
}

/**
 * Who is running this event.
 *
 * <p>Read off `createdBy` for now. The access model grants OWNER to whoever
 * created the event, which for an agency's events is the organizer who set it
 * up — but nothing re-points it when the work is handed over. Once events carry
 * an explicit organizer grant this reads that instead, and the column stops
 * being right by coincidence.
 */
function organizerOf(event) {
  return props.organizerNames[event.createdBy] || ''
}

const sorted = computed(() => {
  const direction = ascending.value ? 1 : -1

  return [...props.events].sort((left, right) => {
    // A row with nothing in the sorted column sinks to the bottom whichever
    // way the column points — "we have not scheduled it" is not an extreme
    // value, and reversing the sort should not promote it to the top.
    const blank = compareBlanks(left, right)
    if (blank !== null) return blank

    return direction * compare(left, right)
  })
})

/** Whether the column being sorted on has no value at all for this event. */
function isBlank(event) {
  switch (sortKey.value) {
    case 'date':
      return dateOf(event) === null
    case 'rsvp':
      return rsvpOf(event) === null
    case 'place':
      return !placeOf(event)
    case 'organizer':
      return !organizerOf(event)
    // A guest count or an overdue count of zero is a measurement, not a gap.
    default:
      return false
  }
}

function compareBlanks(left, right) {
  const a = isBlank(left)
  const b = isBlank(right)
  if (a && b) return 0
  if (a) return 1
  if (b) return -1
  return null
}

function compare(left, right) {
  switch (sortKey.value) {
    case 'date':
      return dateOf(left) - dateOf(right)
    case 'guests':
      return (left.metrics?.guestCount || 0) - (right.metrics?.guestCount || 0)
    case 'rsvp':
      return rsvpOf(left) - rsvpOf(right)
    case 'overdue':
      return overdueOf(left) - overdueOf(right)
    case 'place':
      return placeOf(left).localeCompare(placeOf(right), locale.value)
    case 'organizer':
      return organizerOf(left).localeCompare(organizerOf(right), locale.value)
    default:
      return (left.name || '').localeCompare(right.name || '', locale.value)
  }
}
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  margin-bottom: 2rem;
}

.events-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  text-align: left;
  padding: 11px 14px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}

th {
  background: #faf8f4;
  position: sticky;
  top: 56px; /* clears the sticky topbar */
  z-index: 10;
}

.th-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.th-btn:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
th.sorted .th-btn { color: #1a1a1a; }
.caret { font-size: 9px; }

td.num { font-variant-numeric: tabular-nums; }
td.name { font-weight: 500; color: #1a1a1a; white-space: normal; min-width: 200px; }

tbody tr { cursor: pointer; }
tbody tr:hover { background: #faf8f4; }
tbody tr:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; }
tbody tr:last-child td { border-bottom: none; }

/* A finished event stays findable, it just stops competing for attention. */
tr.done { color: var(--ink-4); }
tr.done td.name { color: var(--ink-3); font-weight: 400; }

/* What the card view says loudly, kept inside the row rather than rebuilt as a
   second "needs attention" section above the table. */
tr.urgent td.name { box-shadow: inset 3px 0 0 #b8954e; }

.pin { color: #b8954e; margin-right: 3px; }
.overdue { color: #b91c1c; font-weight: 600; }

.rsvp { display: inline-flex; align-items: center; gap: 7px; }

.rsvp i {
  width: 42px;
  height: 5px;
  border-radius: 3px;
  background: var(--line);
  position: relative;
  display: inline-block;
}

.rsvp i::after {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: var(--fill);
  border-radius: 3px;
  background: var(--brand);
}

.empty-cell {
  text-align: center;
  padding: 48px 16px;
  color: var(--ink-3);
  white-space: normal;
}
</style>

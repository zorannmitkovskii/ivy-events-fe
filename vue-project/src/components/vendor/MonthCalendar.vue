<template>
  <div class="calendar">
    <header class="calendar-head">
      <button class="nav-btn" :aria-label="t('vendorPortal.previousMonth')" @click="shiftMonth(-1)">‹</button>
      <h2 class="month-name">{{ monthLabel }}</h2>
      <button class="nav-btn" :aria-label="t('vendorPortal.nextMonth')" @click="shiftMonth(1)">›</button>
      <button class="today-btn" @click="goToday">{{ t('vendorPortal.today') }}</button>
    </header>

    <div class="weekdays">
      <span v-for="day in weekdayNames" :key="day" class="weekday">{{ day }}</span>
    </div>

    <div class="grid">
      <button
        v-for="cell in cells"
        :key="cell.key"
        type="button"
        class="day"
        :class="{
          'day--outside': !cell.inMonth,
          'day--today': cell.isToday,
          'day--taken': cell.bookings.length > 0,
          'day--selected': cell.key === selectedKey
        }"
        @click="$emit('select', cell.date, cell.bookings)"
      >
        <span class="day-number">{{ cell.date.getDate() }}</span>

        <!-- Titles, not dots. A venue looking at March wants to know which
             wedding is on the 14th, not merely that something is. -->
        <span
          v-for="booking in cell.bookings.slice(0, MAX_LABELS)"
          :key="booking.id"
          class="pill"
          :class="booking.status.toLowerCase()"
        >
          {{ booking.title || booking.eventName || t('vendorPortal.untitled') }}
        </span>
        <span v-if="cell.bookings.length > MAX_LABELS" class="more">
          +{{ cell.bookings.length - MAX_LABELS }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  bookings: { type: Array, default: () => [] },
  selectedKey: { type: String, default: null }
});

const emit = defineEmits(["select", "range-change"]);

const { t, locale } = useI18n();

const MAX_LABELS = 2;
const DAYS_IN_WEEK = 7;
const WEEKS_SHOWN = 6;

const cursor = ref(startOfMonth(new Date()));

const monthLabel = computed(() =>
  cursor.value.toLocaleDateString(locale.value, { month: "long", year: "numeric" })
);

/**
 * Monday first. Every calendar hanging in a restaurant in this part of the
 * world starts on Monday, and a Sunday-first grid makes people misread which
 * column is Saturday — the column that matters most to a venue.
 */
const weekdayNames = computed(() => {
  const reference = new Date(2024, 0, 1); // a Monday
  return Array.from({ length: DAYS_IN_WEEK }, (unused, index) => {
    const day = new Date(reference);
    day.setDate(reference.getDate() + index);
    return day.toLocaleDateString(locale.value, { weekday: "short" });
  });
});

const cells = computed(() => {
  const first = cursor.value;
  const offset = (first.getDay() + 6) % DAYS_IN_WEEK; // Monday = 0
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  const byDay = groupByDay(props.bookings);
  const todayKey = dayKey(new Date());

  return Array.from({ length: WEEKS_SHOWN * DAYS_IN_WEEK }, (unused, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dayKey(date);
    return {
      key,
      date,
      inMonth: date.getMonth() === first.getMonth(),
      isToday: key === todayKey,
      bookings: byDay.get(key) ?? []
    };
  });
});

/**
 * A booking is placed on every day it touches, not only the day it starts.
 * A party that runs past midnight occupies both dates as far as the room is
 * concerned, and showing it on one would make the next day look free.
 */
function groupByDay(bookings) {
  const map = new Map();
  for (const booking of bookings) {
    const start = new Date(booking.startsAt);
    const end = new Date(booking.endsAt);
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      const key = dayKey(day);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(booking);
    }
  }
  return map;
}

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(delta) {
  cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1);
}

function goToday() {
  cursor.value = startOfMonth(new Date());
}

// The grid shows leading and trailing days of neighbouring months, so the
// parent has to fetch a little more than the month itself or those days would
// always look free.
watch(
  cursor,
  (month) => {
    const first = cells.value[0].date;
    const last = cells.value[cells.value.length - 1].date;
    emit("range-change", dayKey(first), dayKey(last));
  },
  { immediate: true }
);
</script>

<style scoped>
.calendar {
  background: #fff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 0.75rem;
}

.calendar-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.month-name {
  flex: 1;
  margin: 0;
  font-size: 1rem;
  text-transform: capitalize;
}

.nav-btn,
.today-btn {
  min-height: 40px;
  min-width: 40px;
  border: 1px solid #e8e4dc;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.today-btn {
  padding: 0 0.875rem;
  min-width: auto;
}

.weekdays,
.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.weekday {
  text-align: center;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #6b665e;
  padding-bottom: 0.25rem;
}

.day {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 2px;
  min-height: 84px;
  padding: 4px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  font: inherit;
  overflow: hidden;
}

.day--outside {
  background: #faf9f6;
  color: #b3aea4;
}

.day--today .day-number {
  background: #1f3d2b;
  color: #fff;
  border-radius: 999px;
  padding: 0 6px;
}

/* The whole point of the screen: a taken Saturday is visible at a glance,
   without reading a single label. */
.day--taken {
  background: #f2f6f3;
  border-color: #c5d6cb;
}

.day--selected {
  outline: 2px solid #1f3d2b;
  outline-offset: -2px;
}

.day-number {
  font-size: 0.8rem;
  font-weight: 600;
  align-self: flex-start;
}

.pill {
  font-size: 0.68rem;
  line-height: 1.3;
  padding: 1px 5px;
  border-radius: 4px;
  background: #dbe6de;
  color: #1f3d2b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pill.confirmed {
  background: #1f3d2b;
  color: #fff;
}

.pill.cancelled {
  background: transparent;
  color: #b3aea4;
  text-decoration: line-through;
}

.more {
  font-size: 0.65rem;
  color: #6b665e;
}

@media (max-width: 640px) {
  .day {
    min-height: 62px;
  }

  .pill {
    font-size: 0.6rem;
  }
}
</style>

<template>
  <section>
    <header class="page-head">
      <div>
        <h1>{{ t('vendorPortal.calendar') }}</h1>
        <p class="subtitle">{{ t('vendorPortal.calendarSubtitle') }}</p>
      </div>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <MonthCalendar
      :bookings="bookings"
      :selected-key="selectedKey"
      @select="onSelectDay"
      @range-change="onRangeChange"
    />

    <section v-if="selectedDate" class="day-panel">
      <header class="day-head">
        <h2>{{ selectedLabel }}</h2>
        <button class="btn-secondary" @click="clearSelection">{{ t('vendorPortal.close') }}</button>
      </header>

      <p v-if="!selectedBookings.length" class="free">{{ t('vendorPortal.dayFree') }}</p>

      <ul v-else class="bookings">
        <li v-for="booking in selectedBookings" :key="booking.id" class="booking">
          <div class="booking-head">
            <div>
              <h3>{{ booking.title || booking.eventName || t('vendorPortal.untitled') }}</h3>
              <p class="when">{{ formatHours(booking) }}</p>
            </div>
            <span class="status" :class="booking.status.toLowerCase()">
              {{ t(`vendorPortal.status.${booking.status}`) }}
            </span>
          </div>

          <!-- Guest numbers exist only once the booking is tied to a real
               event. A slot held after a phone call has nobody to count yet. -->
          <div v-if="booking.eventId" class="guests">
            <button v-if="!summaries[booking.id]" class="btn-secondary" @click="loadSummary(booking)">
              {{ t('vendorPortal.showGuests') }}
            </button>

            <div v-else class="summary">
              <p v-if="summaries[booking.id].packageName" class="package-name">
                {{ t('vendorPortal.cooking') }}: <strong>{{ summaries[booking.id].packageName }}</strong>
              </p>
              <p v-else class="package-name muted">{{ t('vendorPortal.noPackageChosen') }}</p>

              <div class="counts">
                <span class="count strong">
                  <strong>{{ summaries[booking.id].attending }}</strong>
                  {{ t('vendorPortal.attending') }}
                </span>
                <span class="count">{{ summaries[booking.id].pending }} {{ t('vendorPortal.pending') }}</span>
                <span class="count">{{ summaries[booking.id].declined }} {{ t('vendorPortal.declined') }}</span>
                <span class="count">{{ summaries[booking.id].children }} {{ t('vendorPortal.children') }}</span>
              </div>

              <ul v-if="summaries[booking.id].dietary.length" class="dietary">
                <li v-for="entry in summaries[booking.id].dietary" :key="entry.name">
                  {{ entry.name }}: <strong>{{ entry.guests }}</strong>
                </li>
              </ul>
            </div>
          </div>

          <div class="booking-actions">
            <button
              v-if="booking.status !== 'CONFIRMED'"
              class="btn-secondary"
              @click="setStatus(booking, 'CONFIRMED')"
            >
              {{ t('vendorPortal.confirm') }}
            </button>
            <button
              v-if="booking.status !== 'CANCELLED'"
              class="btn-danger"
              @click="setStatus(booking, 'CANCELLED')"
            >
              {{ t('vendorPortal.cancelBooking') }}
            </button>
          </div>
        </li>
      </ul>

      <form class="new-booking" @submit.prevent="create">
        <h3 class="new-title">{{ t('vendorPortal.holdThisDate') }}</h3>
        <div class="new-row">
          <input v-model="draft.title" :placeholder="t('vendorPortal.bookingTitle')" class="title-input" />
          <input v-model="draft.startTime" type="time" />
          <input v-model="draft.endTime" type="time" />
          <button class="btn-primary" type="submit" :disabled="saving">{{ t('vendorPortal.hold') }}</button>
        </div>
      </form>
    </section>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import MonthCalendar from "@/components/vendor/MonthCalendar.vue";
import { vendorPortalService } from "@/services/vendorPortal.service";

const { t, locale } = useI18n();

const bookings = ref([]);
const summaries = reactive({});
const error = ref(null);
const saving = ref(false);

const selectedDate = ref(null);
const selectedBookings = ref([]);

const draft = reactive({ title: "", startTime: "18:00", endTime: "23:59" });

const selectedKey = computed(() => (selectedDate.value ? dayKey(selectedDate.value) : null));

const selectedLabel = computed(() =>
  selectedDate.value
    ? selectedDate.value.toLocaleDateString(locale.value, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : ""
);

function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Sent with the browser's own offset rather than as bare local time: the
 * backend stores an instant, and a wedding booked at 18:00 in Skopje must not
 * become 16:00 because the server runs in UTC.
 */
function toInstant(dateKey, time) {
  return new Date(`${dateKey}T${time}`).toISOString();
}

function formatHours(booking) {
  const options = { hour: "2-digit", minute: "2-digit" };
  const start = new Date(booking.startsAt).toLocaleTimeString(locale.value, options);
  const end = new Date(booking.endsAt).toLocaleTimeString(locale.value, options);
  return `${start}–${end}`;
}

/** The calendar tells us which window it is showing; we fetch exactly that. */
async function onRangeChange(fromKey, toKey) {
  error.value = null;
  try {
    const { data } = await vendorPortalService.listBookings(
      toInstant(fromKey, "00:00"),
      toInstant(toKey, "23:59")
    );
    bookings.value = data;
    refreshSelection();
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}

function onSelectDay(date, dayBookings) {
  selectedDate.value = date;
  selectedBookings.value = dayBookings;
}

function clearSelection() {
  selectedDate.value = null;
  selectedBookings.value = [];
}

/** After a write the list is new; the open day has to point at the new objects. */
function refreshSelection() {
  if (!selectedDate.value) return;
  const key = selectedKey.value;
  selectedBookings.value = bookings.value.filter((booking) => {
    const start = new Date(booking.startsAt);
    const end = new Date(booking.endsAt);
    return dayKey(start) <= key && key <= dayKey(end);
  });
}

async function reload() {
  const first = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1);
  const last = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 2, 0);
  await onRangeChange(dayKey(first), dayKey(last));
}

async function create() {
  if (!selectedDate.value) return;
  saving.value = true;
  error.value = null;
  try {
    await vendorPortalService.createBooking({
      title: draft.title,
      startsAt: toInstant(selectedKey.value, draft.startTime),
      endsAt: toInstant(selectedKey.value, draft.endTime),
      status: "HELD"
    });
    draft.title = "";
    await reload();
  } catch (e) {
    // The backend refuses an overlap and its message names the clashing date,
    // which is more useful than "could not save".
    error.value = e?.response?.data?.message ?? e.message;
  } finally {
    saving.value = false;
  }
}

async function setStatus(booking, status) {
  try {
    await vendorPortalService.updateBooking(booking.id, {
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status,
      title: booking.title,
      note: booking.note,
      eventId: booking.eventId,
      packageId: booking.packageId,
      floorPlanId: booking.floorPlanId
    });
    await reload();
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}

async function loadSummary(booking) {
  try {
    const { data } = await vendorPortalService.guestSummary(booking.id);
    summaries[booking.id] = data;
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}
</script>

<style scoped>
.page-head {
  margin-bottom: 1.25rem;
}

h1 {
  font-size: 1.2rem;
  margin: 0;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #6b665e;
  font-size: 0.9rem;
}

.day-panel {
  margin-top: 1.25rem;
  background: #fff;
  border: 1px solid #e8e4dc;
  border-radius: 12px;
  padding: 1rem;
}

.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.day-head h2 {
  margin: 0;
  font-size: 1rem;
  text-transform: capitalize;
}

.free {
  color: #6b665e;
}

.bookings {
  list-style: none;
  margin: 0;
  padding: 0;
}

.booking {
  border: 1px solid #e8e4dc;
  border-radius: 10px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.booking-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.booking-head h3 {
  margin: 0;
  font-size: 0.95rem;
}

.when {
  margin: 0.125rem 0 0;
  color: #6b665e;
  font-size: 0.85rem;
}

.status {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: #f4f1ea;
  color: #6b665e;
  white-space: nowrap;
}

.status.confirmed {
  background: #1f3d2b;
  color: #fff;
}

.status.cancelled {
  text-decoration: line-through;
}

.guests {
  margin-top: 0.625rem;
}

.package-name {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
}

.package-name.muted {
  color: #6b665e;
}

.counts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: #6b665e;
}

.count.strong {
  color: #1d1b18;
}

.dietary {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  font-size: 0.85rem;
  color: #6b665e;
}

.booking-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.625rem;
}

.new-booking {
  border-top: 1px solid #e8e4dc;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
}

.new-title {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: #6b665e;
}

.new-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.title-input {
  flex: 1;
  min-width: 12rem;
}

input {
  padding: 0.5rem 0.625rem;
  min-height: 44px;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  font: inherit;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  min-height: 44px;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
}

.btn-primary {
  background: #1f3d2b;
  border: none;
  color: #fff;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #e8e4dc;
}

.btn-danger {
  background: transparent;
  border: 1px solid #a4292c;
  color: #a4292c;
}

.error {
  color: #a4292c;
}
</style>

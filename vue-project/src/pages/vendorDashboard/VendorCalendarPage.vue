<template>
  <section>
    <PageHeader :title="t('vendorPortal.calendar')" :subtitle="t('vendorPortal.calendarSubtitle')" />

    <p v-if="error" class="error">{{ error }}</p>

    <VendorCalendarOverview v-model:view="view" />

    <MonthCalendar
      v-show="view === 'month'"
      :bookings="bookings"
      :markers="markers"
      :selected-key="selectedKey"
      @select="onSelectDay"
      @range-change="onRangeChange"
    />

    <section v-if="selectedDate" class="day-panel">
      <header class="day-head">
        <h2>{{ selectedLabel }}</h2>
        <button class="btn-secondary" @click="clearSelection">{{ t('vendorPortal.close') }}</button>
      </header>

      <!-- Blocks before bookings: "you are away this week" is the thing that
           changes whether the rest of the panel matters. -->
      <ul v-if="selectedBlocks.length" class="blocks">
        <li v-for="block in selectedBlocks" :key="block.id" class="block">
          <span class="block-status" :class="block.status.toLowerCase()">
            {{ t(`vendorPortal.availability.${block.status}`) }}
          </span>
          <span class="block-reason">{{ block.reason || t('vendorPortal.availability.noReason') }}</span>
          <button
            v-if="block.status === 'HOLD'"
            class="btn-secondary"
            @click="confirmHold(block)"
          >
            {{ t('vendorPortal.availability.confirm') }}
          </button>
          <button class="link-btn" @click="releaseBlock(block)">
            {{ t('vendorPortal.availability.release') }}
          </button>
        </li>
      </ul>

      <!--
        Two states, not three. "Available" was in this list as if a vendor
        marked a day free the way they mark it taken — but free is the absence
        of a row, not a row of its own, and choosing it wrote one that said
        nothing. A day already blocked is freed by releasing the block above,
        which is the only way that leaves the calendar with one truth.
      -->
      <form class="block-form" @submit.prevent="blockDay">
        <select
          v-model="blockDraft.status"
          class="field"
          :aria-label="t('vendorPortal.availability.status')"
        >
          <option value="UNAVAILABLE">{{ t('vendorPortal.availability.UNAVAILABLE') }}</option>
          <option value="HOLD">{{ t('vendorPortal.availability.HOLD') }}</option>
        </select>

        <!--
          A holiday is a week, not a day. The start is the day already
          selected in the calendar; this is the last day it covers, left
          empty for the single-day case so the common one stays one click.
        -->
        <label class="until">
          <span class="until-label">{{ t('vendorPortal.availability.until') }}</span>
          <input
            v-model="blockDraft.until"
            type="date"
            class="field"
            :min="selectedKey"
            :aria-label="t('vendorPortal.availability.until')"
          />
        </label>

        <input
          v-model="blockDraft.reason"
          type="text"
          class="field reason"
          :placeholder="t('vendorPortal.availability.reasonPlaceholder')"
          :aria-label="t('vendorPortal.availability.reasonPlaceholder')"
        />
        <button class="btn-secondary" type="submit">
          {{ blockDraft.until ? t('vendorPortal.availability.blockRange') : t('vendorPortal.availability.blockDay') }}
        </button>
      </form>

      <p v-if="!selectedBookings.length && !selectedBlocks.length" class="free">{{ t('vendorPortal.dayFree') }}</p>

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
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import MonthCalendar from "@/components/vendor/MonthCalendar.vue";
import VendorCalendarOverview from "@/components/vendor/VendorCalendarOverview.vue";
import { vendorPortalService, vendorAvailabilityService } from "@/services/vendorPortal.service";
import { unwrap as unwrapFeed, vendorWorkspaceService } from "@/services/vendorWorkspace.service";

const { t, locale } = useI18n();

/** Kinds from the calendar feed drawn as markers; bookings have their own pills. */
const MARKER_KINDS = new Set(["INQUIRY", "HOLD", "BLOCKED"]);

const view = ref("month");
const bookings = ref([]);
const markers = ref([]);

// The rest of the calendar: weeks away, days kept clear, dates pencilled in.
// Loaded with the bookings and for the same window, so one range change fetches
// both and they cannot show different months.
const blocks = ref([]);
const blockDraft = reactive({ status: "UNAVAILABLE", reason: "", until: "" });
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
 * One layer, not a destructure.
 *
 * <p>The vendor-portal endpoints answer with a bare list while the rest of the
 * API wraps everything in {@code ApiResponse}. `response.data` reads
 * `undefined` off an array, and the calendar then draws an empty month over a
 * fully booked one.
 */
function unwrap(response) {
  return response?.data ?? response ?? null;
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
/**
 * Inquiries, holds and blocks for the same window, as markers on the grid.
 * Separate from the bookings call so a feed that fails to load leaves the
 * bookings — the part that is actual work — on screen.
 */
async function loadMarkers(fromKey, toKey) {
  try {
    const feed = unwrapFeed(await vendorWorkspaceService.calendar(fromKey, toKey)) ?? [];
    markers.value = feed.filter((entry) => MARKER_KINDS.has(entry.kind));
  } catch {
    markers.value = [];
  }
}

async function onRangeChange(fromKey, toKey) {
  error.value = null;
  currentWindow = { from: fromKey, to: toKey };
  try {
    const windowStart = toInstant(fromKey, "00:00");
    const windowEnd = toInstant(toKey, "23:59");

    // Both in one go, for the same window. Two calls with two ranges is how a
    // calendar comes to show September's bookings over October's holidays.
    const [bookingResponse, calendarResponse] = await Promise.all([
      vendorPortalService.listBookings(windowStart, windowEnd),
      vendorAvailabilityService.calendar(windowStart, windowEnd),
    ]);

    bookings.value = unwrap(bookingResponse) ?? [];
    blocks.value = calendarResponse?.data?.blocks ?? calendarResponse?.data?.data?.blocks ?? [];
    refreshSelection();
    loadMarkers(fromKey, toKey);
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}

/**
 * The blocks that touch the selected day.
 *
 * <p>Overlap, not "starts on": a week away has one row and covers seven days,
 * and a day inside it must show it.
 */
const selectedBlocks = computed(() => {
  if (!selectedDate.value) return [];

  const dayStart = new Date(selectedDate.value);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return blocks.value.filter((block) =>
    new Date(block.startsAt) < dayEnd && new Date(block.endsAt) > dayStart);
});

/**
 * Blocks the whole selected day.
 *
 * <p>Sends the date and the browser's zone, not a pair of instants — the day
 * the clocks change is 23 or 25 hours long, and the server is the one that
 * knows which.
 */
async function blockDay() {
  error.value = null;

  // `date` for one day, `from`/`to` for a stretch — the endpoint takes either,
  // and the server builds the boundaries in the vendor's own zone. Sending a
  // range of one day instead would work, but it loses the distinction the API
  // makes, and with it the server's "whole day" handling.
  const span = blockDraft.until && blockDraft.until !== selectedKey.value
    ? { from: selectedKey.value, to: blockDraft.until }
    : { date: selectedKey.value };

  try {
    await vendorAvailabilityService.block({
      ...span,
      status: blockDraft.status,
      reason: blockDraft.reason || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    blockDraft.reason = "";
    blockDraft.until = "";
    await reloadCurrentWindow();
  } catch (e) {
    error.value = e?.detail ?? e?.response?.data?.message ?? e.message;
  }
}

async function confirmHold(block) {
  error.value = null;
  try {
    await vendorAvailabilityService.confirmHold(block.id);
    await reloadCurrentWindow();
  } catch (e) {
    // The server refuses an expired hold and says why — that message is more
    // useful than anything this page could invent.
    error.value = e?.detail ?? e?.response?.data?.message ?? e.message;
  }
}

async function releaseBlock(block) {
  error.value = null;
  try {
    await vendorAvailabilityService.release(block.id);
    await reloadCurrentWindow();
  } catch (e) {
    error.value = e?.detail ?? e?.response?.data?.message ?? e.message;
  }
}

/** The window the calendar last asked for, so an action can refresh exactly
 *  what is on screen rather than guessing at a month. */
let currentWindow = null;

async function reloadCurrentWindow() {
  if (currentWindow) {
    await onRangeChange(currentWindow.from, currentWindow.to);
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
      packageId: booking.packageId
    });
    await reload();
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}

async function loadSummary(booking) {
  try {
    summaries[booking.id] = unwrap(await vendorPortalService.guestSummary(booking.id));
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message;
  }
}
</script>

<style scoped>

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

/*
  The block form's own row.

  The select used to have no rule at all, so it kept the browser's default
  height and sat some twenty pixels shorter than the inputs and the button
  beside it. `.field` is what every control in this row now shares, height
  included — `appearance: none` is needed because a native select ignores
  padding on Windows and would go back to its own size.
*/
.block-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.75rem;
}

.block-form .field {
  min-height: 44px;
  padding: 0.5rem 0.625rem;
  border: 1px solid #e8e4dc;
  border-radius: 8px;
  font: inherit;
  background: #fff;
  color: inherit;
  box-sizing: border-box;
}

select.field {
  appearance: none;
  padding-right: 2rem;
  cursor: pointer;
  /* The chevron, drawn rather than fetched, so nothing can block it. */
  background-image: linear-gradient(45deg, transparent 50%, #6b665e 50%),
                    linear-gradient(135deg, #6b665e 50%, transparent 50%);
  background-position: calc(100% - 1.05rem) 1.2rem, calc(100% - 0.8rem) 1.2rem;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
}

.block-form .reason {
  flex: 1;
  min-width: 10rem;
}

.until {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.until-label {
  font-size: 0.8rem;
  color: #6b665e;
  white-space: nowrap;
}

.block-form .btn-secondary {
  min-height: 44px;
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

/**
 * The basics of an event asked before the design is chosen (INV-104):
 * names or a title, date, time, the event's timezone and a location.
 *
 * Dates and times here are the wall clock where the event happens. Every check
 * against "now" converts that wall clock through the event's own IANA zone —
 * never through the browser's — so somebody in Berlin planning a wedding in
 * Skopje is told the truth about what is in the past.
 */
import { EventCategoryEnum } from "@/enums/EventCategory";

export const DEFAULT_TIMEZONE = "Europe/Skopje";

/** Zones offered first; the browser's own zone is added when it differs. */
const COMMON_TIMEZONES = [
  "Europe/Skopje",
  "Europe/Tirane",
  "Europe/Belgrade",
  "Europe/Sofia",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Vienna",
  "Europe/Berlin",
  "Europe/Zurich",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Toronto",
  "Australia/Sydney",
];

export function isValidTimeZone(tz) {
  if (!tz || typeof tz !== "string") return false;
  // Region ids only (Area/Location): a fixed offset has no daylight saving.
  if (!/^[A-Za-z]+(?:\/[A-Za-z0-9_+-]+)+$/.test(tz)) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

export function timezoneOptions(current) {
  const list = [...COMMON_TIMEZONES];
  for (const extra of [browserTimeZone(), current]) {
    if (extra && isValidTimeZone(extra) && !list.includes(extra)) list.push(extra);
  }
  return list;
}

/** Couples are named; every other event has a title. */
export function usesCoupleNames(category) {
  return !category || category === EventCategoryEnum.WEDDING || category === EventCategoryEnum.ANNIVERSARY;
}

/**
 * The words for the two names (INV-101). A wedding has a bride and a groom; an
 * anniversary has two partners — asking it for a "bride" would put wedding
 * fields on an event that is not a wedding. Keys under
 * `onboarding.eventBasics.{fields,placeholders,errors}`.
 */
export function coupleNameKeys(category) {
  return category === EventCategoryEnum.ANNIVERSARY
    ? { first: "partnerOne", second: "partnerTwo" }
    : { first: "brideName", second: "groomName" };
}

export function emptyBasics() {
  return {
    brideName: "",
    groomName: "",
    title: "",
    date: "",
    time: "",
    timezone: DEFAULT_TIMEZONE,
    location: { name: "", address: "" },
  };
}

/** Accepts the older shape (location as a string, no time/zone) and fills the gaps. */
export function normalizeBasics(raw) {
  const base = emptyBasics();
  if (!raw || typeof raw !== "object") return base;
  const loc = raw.location;
  // A damaged save (INV-302) can hold anything: only strings are taken.
  const s = (v) => (typeof v === "string" ? v : "");
  return {
    brideName: s(raw.brideName),
    groomName: s(raw.groomName),
    title: s(raw.title),
    date: /^\d{4}-\d{2}-\d{2}$/.test(s(raw.date)) ? raw.date : "",
    time: /^\d{2}:\d{2}$/.test(s(raw.time)) ? raw.time : "",
    timezone: isValidTimeZone(raw.timezone) ? raw.timezone : DEFAULT_TIMEZONE,
    location:
      typeof loc === "string"
        ? { name: loc, address: "" }
        : { name: s(loc?.name), address: s(loc?.address) },
  };
}

/* ------------------------------------------------------------------ */
/*  Wall clock ↔ instant in a named zone                               */
/* ------------------------------------------------------------------ */

function zoneOffsetMs(epochMs, tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(epochMs));
  const v = {};
  for (const p of parts) v[p.type] = p.value;
  const asUtc = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour % 24, +v.minute, +v.second);
  return asUtc - Math.floor(epochMs / 1000) * 1000;
}

/** Epoch ms of `date` (YYYY-MM-DD) at `time` (HH:mm) on the wall clock of `tz`. */
export function zonedWallClockToEpoch(date, time, tz = DEFAULT_TIMEZONE) {
  const [y, mo, d] = String(date).split("-").map(Number);
  const [h, mi] = String(time || "00:00").split(":").map(Number);
  if (![y, mo, d, h, mi].every(Number.isFinite)) return NaN;
  const zone = isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = zoneOffsetMs(guess, zone);
  let epoch = guess - first;
  const second = zoneOffsetMs(epoch, zone);
  if (second !== first) epoch = guess - second;
  return epoch;
}

/** The wall clock of an instant in `tz`, as "YYYY-MM-DDTHH:mm:00". */
export function epochToZonedWallClock(instant, tz = DEFAULT_TIMEZONE) {
  const epoch = instant instanceof Date ? instant.getTime() : new Date(instant).getTime();
  if (!Number.isFinite(epoch)) return "";
  const zone = isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
  const shifted = new Date(epoch + zoneOffsetMs(epoch, zone));
  const pad = (n) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:00`;
}

/** True when the wall-clock moment in the event's zone is already over. */
export function isPastInZone(date, time, tz, now = Date.now()) {
  const epoch = zonedWallClockToEpoch(date, time || "00:00", tz);
  return Number.isFinite(epoch) && epoch < now;
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

/**
 * Field → message key for each problem; empty object when the basics are
 * enough to personalise an invitation.
 */
export function validateBasics(basics, category, now = Date.now()) {
  const b = normalizeBasics(basics);
  const errors = {};
  if (usesCoupleNames(category)) {
    const words = coupleNameKeys(category);
    if (!b.brideName.trim()) errors.brideName = `onboarding.eventBasics.errors.${words.first}`;
    if (!b.groomName.trim()) errors.groomName = `onboarding.eventBasics.errors.${words.second}`;
  } else if (!b.title.trim()) {
    errors.title = "onboarding.eventBasics.errors.title";
  }
  if (!b.date) errors.date = "onboarding.eventBasics.errors.date";
  if (!b.time) errors.time = "onboarding.eventBasics.errors.time";
  if (!isValidTimeZone(basics?.timezone || b.timezone)) errors.timezone = "onboarding.eventBasics.errors.timezone";
  if (!b.location.name.trim()) errors.location = "onboarding.eventBasics.errors.location";
  if (b.date && b.time && !errors.timezone && isPastInZone(b.date, b.time, b.timezone, now)) {
    errors.date = "onboarding.eventBasics.errors.past";
  }
  return errors;
}

/**
 * What is wrong with an RSVP deadline (YYYY-MM-DD, meant as the end of that day
 * where the event is): "past", "afterEvent" or null.
 */
export function rsvpDeadlineProblem(deadline, eventDate, eventTime, tz, now = Date.now()) {
  if (!deadline || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return null;
  const endOfDay = zonedWallClockToEpoch(deadline, "23:59", tz) + 59_999;
  if (endOfDay < now) return "past";
  if (eventDate && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    const start = zonedWallClockToEpoch(eventDate, eventTime || "23:59", tz);
    if (zonedWallClockToEpoch(deadline, "00:00", tz) > start) return "afterEvent";
  }
  return null;
}

/** Days before the event the reply-by date falls when no deadline is set. */
export const RSVP_DEFAULT_DAYS_BEFORE = 14;

/**
 * INV-401: the date the guests are asked to reply by (YYYY-MM-DD) — the
 * deadline the organiser set, otherwise 14 days before the event's date
 * (what the public invitation always showed without one). "" when neither is
 * known. Calendar arithmetic only; no zone is involved.
 */
export function rsvpReplyByDate(deadline, eventDateTime) {
  const d = /^\d{4}-\d{2}-\d{2}/.exec(deadline || "")?.[0];
  if (d) return d;
  const e = /^(\d{4})-(\d{2})-(\d{2})/.exec(eventDateTime || "");
  if (!e) return "";
  const day = new Date(Date.UTC(+e[1], +e[2] - 1, +e[3] - RSVP_DEFAULT_DAYS_BEFORE));
  return day.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/*  Basics → invitation                                                */
/* ------------------------------------------------------------------ */

/**
 * The editor's "info" block (the shape `useWeddingInvitation` keeps in the
 * local draft) for these basics. A title-only event puts its title where the
 * names go and leaves the second name empty.
 */
export function basicsToInvitationInfo(basics, category) {
  const b = normalizeBasics(basics);
  const couple = usesCoupleNames(category);
  return {
    brideName: couple ? b.brideName.trim() : b.title.trim(),
    groomName: couple ? b.groomName.trim() : "",
    weddingDateTime: b.date ? `${b.date}T${b.time || "00:00"}:00` : "",
    eventTimezone: b.timezone,
    venue: b.location.name.trim(),
    location: b.location.address.trim(),
  };
}

/** The display line for cards and headers: "Ана & Марко". */
export function basicsDisplayName(basics, category) {
  const b = normalizeBasics(basics);
  if (!usesCoupleNames(category)) return b.title.trim();
  return [b.brideName.trim(), b.groomName.trim()].filter(Boolean).join(" & ");
}

export function hasBasics(basics, category) {
  return Object.keys(validateBasics(basics, category, -Infinity)).length === 0;
}

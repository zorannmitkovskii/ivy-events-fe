/**
 * Builds the EventFullCreateDto payload for POST /v1/api/events/full
 *
 * Maps FE page state → BE DTO shape.
 */
import { getUsername } from "@/services/auth.service";

/**
 * What an existing event's editor reads from the event itself
 * (/public/invitation-page): its names, date, time, zone, place, greeting,
 * category and the invitation's settings. INV-403: when that read failed the
 * editor holds the design's demo values there, so these are left out of the
 * save (the server keeps what it has — null = unchanged).
 */
export const EVENT_READ_FIELDS = Object.freeze([
  "name", "categoryType", "date", "time", "timezone",
  "groomName", "brideName", "groom", "bride",
  "location", "message", "messageI18n",
  "showAgenda", "showOurStory", "showEventDetails",
  "rsvpConfig", "entry", "theme",
  "sectionOrder", "sectionVisibility", "sectionLayouts",
]);

export function buildEventFullPayload({
  config,
  rootBg,
  palette,
  fonts,
  buttonStyle,
  cardStyle,
  spacingPreset,
  rsvpConfig,
  entryType,
  entryDesign,
  sectionOrder,
  sectionVisibility,
  sectionLayouts,
  eventDetailItems,
  agendaItems,
  ourStoryItems,
  invitationName,
  lang,
  heroFamily,
  detailsFamily,
  scheduleFamily,
  storyFamily,
  categoryType,
  typeCode,
  timezone,
  // INV-403: false — the event could not be read; see EVENT_READ_FIELDS.
  eventLoaded = true,
}) {
  // Extract raw font name from CSS font-family like "'Cormorant Garamond', serif"
  const extractFont = (css) => (css || "").replace(/^'|'.*$/g, "");

  // Build sectionOrder map { key: index }
  const orderMap = {};
  if (Array.isArray(sectionOrder)) {
    sectionOrder.forEach((key, i) => {
      orderMap[key] = i;
    });
  }

  // Build visibility map (missing keys default to true)
  const visMap = {};
  if (sectionVisibility) {
    Object.entries(sectionVisibility).forEach(([k, v]) => {
      visMap[k] = v !== false;
    });
  }

  // The start as the wall clock where the event is (INV-104): date, time and
  // the event's zone travel separately and the server derives the instant —
  // never from the browser's offset.
  const wall = config.weddingDateTime || "";
  const time = /T(\d{2}:\d{2})/.exec(wall)?.[1] || "";
  // A title-only event (a birthday, a conference) has no second name.
  const name = config.groomName
    ? `${config.brideName || ""} & ${config.groomName}`
    : config.brideName || "";

  const payload = {
    // The server requires a name; the same placeholder the bare create used.
    name: name.trim() || "New Event",
    categoryType: categoryType || "WEDDING",
    ...(typeCode ? { typeCode } : {}),
    date: wall.split("T")[0] || "",
    ...(time ? { time } : {}),
    timezone: timezone || config.eventTimezone || "Europe/Skopje",
    lang: lang || "en",
    username: getUsername(),
    invitationName: invitationName || "",

    groomName: config.groomName || "",
    brideName: config.brideName || "",
    groom: { name: config.groomName || "" },
    bride: { name: config.brideName || "" },

    location:
      config.venue || config.locationLat
        ? {
            name: config.venue || "",
            addressLine: config.locationAddress || config.location || "",
            latitude: config.locationLat || null,
            longitude: config.locationLng || null,
            googleMapsUrl: config.locationMapUrl || config.heroMapUrl || "",
          }
        : null,

    message: config.heroLabel || "",
    messageI18n: null,

    showAgenda: visMap.agendaList !== false,
    showOurStory: visMap.ourStoryList !== false,
    showEventDetails: visMap.details !== false,

    // INV-402: `null` = this section was not read from the server. It is left
    // out (the server keeps what it has); an empty list would erase it.
    eventDetails: eventDetailItems === null ? undefined : (eventDetailItems || []).map((item) => ({
      id: item.id && !item.id.startsWith("_local_") ? item.id : undefined,
      type: item.type || "",
      eventDate: item.eventDate || null,
      time: item.time || "",
      description: item.description || "",
      visibility: item.visibility || "PUBLIC",
      location: item.location || null,
    })),

    agendas: agendaItems === null ? undefined : (agendaItems || []).map((item) => ({
      id: item.id && !item.id.startsWith("_local_") ? item.id : undefined,
      type: item.agendaType || item.type || "",
      time: item.time || item.startTime || "",
      description: item.description || "",
    })),

    ourStories: ourStoryItems === null ? undefined : (ourStoryItems || []).map((item, i) => ({
      id: item.id && !item.id.startsWith("_local_") ? item.id : undefined,
      type: item.type || "",
      description: item.description || "",
      descriptionI18n: item.descriptionI18n || null,
      storyDate: item.storyDate || item.date || null,
      displayOrder: i + 1,
      showTitle: item.showTitle !== false,
    })),

    rsvpConfig: {
      deadline: rsvpConfig?.deadline || "",
      maxGuests: rsvpConfig?.maxGuests || 5,
      contactMethod: rsvpConfig?.contactMethod || "email",
      borderRadius: rsvpConfig?.borderRadius || "8px",
    },

    entry: {
      type: entryType || "envelop",
      design: entryDesign || "classic",
    },

    theme: {
      rootBg: rootBg || "",
      palette: {
        accent: palette?.accent || "",
        secondary: palette?.secondary || "",
        text: palette?.text || "",
      },
      fonts: {
        heading: extractFont(fonts?.heading),
        body: extractFont(fonts?.body),
      },
      buttonStyle: {
        bg: buttonStyle?.bg || "",
        text: buttonStyle?.text || "",
        radius: buttonStyle?.radius || "8px",
      },
      cardStyle: {
        sectionBg: cardStyle?.sectionBg || "",
        cardBg: cardStyle?.cardBg || "",
        cardShadow: cardStyle?.cardShadow || "subtle",
        cardRadius: cardStyle?.cardRadius || "",
        cardBorder: cardStyle?.cardBorder || "0px",
      },
      spacingPreset: spacingPreset || "balanced",
      heroFamily: heroFamily || "",
      detailsFamily: detailsFamily || "",
      scheduleFamily: scheduleFamily || "",
      storyFamily: storyFamily || "",
    },

    sectionOrder: orderMap,
    sectionVisibility: visMap,
    sectionLayouts: sectionLayouts ? { ...sectionLayouts } : {},
  };
  if (!eventLoaded) EVENT_READ_FIELDS.forEach((key) => delete payload[key]);
  return payload;
}

/**
 * Builds the EventFullCreateDto payload for POST /v1/api/events/full
 *
 * Maps FE page state → BE DTO shape.
 */
export function buildEventFullPayload({
  config,
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

  return {
    name: `${config.brideName || ""} & ${config.groomName || ""}`,
    categoryType: "WEDDING",
    status: "DRAFT",
    date: config.weddingDateTime || "",
    lang: lang || "en",
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

    eventDetails: (eventDetailItems || []).map((item) => ({
      id: item.id && !item.id.startsWith("_local_") ? item.id : undefined,
      type: item.type || "",
      eventDate: item.eventDate || "",
      time: item.time || "",
      description: item.description || "",
      visibility: item.visibility || "PUBLIC",
      location: item.location || null,
    })),

    agendas: (agendaItems || []).map((item) => ({
      id: item.id && !item.id.startsWith("_local_") ? item.id : undefined,
      type: item.agendaType || item.type || "",
      time: item.time || item.startTime || "",
      description: item.description || "",
    })),

    ourStories: (ourStoryItems || []).map((item, i) => ({
      id: item.id && !item.id.startsWith("_local_") ? item.id : undefined,
      type: item.type || "",
      description: item.description || "",
      descriptionI18n: item.descriptionI18n || null,
      storyDate: item.storyDate || item.date || "",
      displayOrder: i + 1,
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
    },

    sectionOrder: orderMap,
    sectionVisibility: visMap,
    sectionLayouts: sectionLayouts ? { ...sectionLayouts } : {},
  };
}

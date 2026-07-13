/**
 * schema.org JSON-LD builders.
 *
 * Each builder validates that schema.org-required fields are present. Missing
 * required fields yield a null return (never a partial/invalid schema in the
 * DOM), and — in dev — a console warning describing which field was missing.
 *
 * Required-field references:
 *   Organization: https://schema.org/Organization (recommended: name, url, logo)
 *   WebSite:      https://schema.org/WebSite (required: name, url)
 *   Service:      https://schema.org/Service (required: name, provider)
 *   Event:        https://schema.org/Event (required: name, startDate, location)
 *   LocalBusiness:https://schema.org/LocalBusiness (required: name, address)
 */

const SCHEMA_CONTEXT = 'https://schema.org';
export const DEFAULT_BASE_URL = 'https://ivyevents.mk';
const DEFAULT_SITE_NAME = 'Ivy Events';

function isDev() {
  return typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
}

function invalid(schemaType, field) {
  if (isDev()) {
    console.warn(`[jsonLd] ${schemaType} missing required field "${field}" — not emitting.`);
  }
  return null;
}

function nonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * schema.org/Organization.
 * Recommended: name, url, logo, sameAs (social profiles).
 */
export function organizationSchema({
  name = DEFAULT_SITE_NAME,
  url = DEFAULT_BASE_URL,
  logo,
  description,
  sameAs = [],
} = {}) {
  if (!nonEmptyString(name)) return invalid('Organization', 'name');
  if (!nonEmptyString(url)) return invalid('Organization', 'url');

  const out = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Organization',
    name,
    url,
  };
  if (nonEmptyString(logo)) out.logo = logo;
  if (nonEmptyString(description)) out.description = description;
  if (Array.isArray(sameAs) && sameAs.length > 0) {
    out.sameAs = sameAs.filter(nonEmptyString);
  }
  return out;
}

/**
 * schema.org/WebSite. Optionally includes a SearchAction (site search box).
 * When {@code searchUrlTemplate} contains {@code {search_term_string}} the
 * SearchAction is emitted; otherwise it is omitted (placeholder-ready).
 */
export function webSiteSchema({
  name = DEFAULT_SITE_NAME,
  url = DEFAULT_BASE_URL,
  searchUrlTemplate,
} = {}) {
  if (!nonEmptyString(name)) return invalid('WebSite', 'name');
  if (!nonEmptyString(url)) return invalid('WebSite', 'url');

  const out = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'WebSite',
    name,
    url,
  };

  if (nonEmptyString(searchUrlTemplate) && searchUrlTemplate.includes('{search_term_string}')) {
    out.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrlTemplate,
      },
      'query-input': 'required name=search_term_string',
    };
  }
  return out;
}

/**
 * schema.org/Service — one per category landing page.
 * Required: name, provider. Provider defaults to the Ivy Events Organization.
 */
export function serviceSchema({
  name,
  description,
  serviceType,
  areaServed,
  url,
  image,
  provider,
} = {}) {
  if (!nonEmptyString(name)) return invalid('Service', 'name');

  const resolvedProvider = provider ?? { '@type': 'Organization', name: DEFAULT_SITE_NAME, url: DEFAULT_BASE_URL };
  if (!resolvedProvider || !nonEmptyString(resolvedProvider.name)) {
    return invalid('Service', 'provider.name');
  }

  const out = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Service',
    name,
    provider: resolvedProvider,
  };
  if (nonEmptyString(description)) out.description = description;
  if (nonEmptyString(serviceType)) out.serviceType = serviceType;
  if (nonEmptyString(areaServed)) out.areaServed = areaServed;
  if (nonEmptyString(url)) out.url = url;
  if (nonEmptyString(image)) out.image = image;
  return out;
}

/**
 * schema.org/Event.
 * Required: name, startDate (ISO-8601), location (with name).
 *
 * SECURITY / PRIVACY: this builder is intentionally strict — the caller must
 * pass an explicit {@code isPublic: true}. Any other value (undefined, false,
 * null) causes the schema to be dropped, so private/draft events cannot leak
 * through a bug in the caller.
 */
export function eventSchema({
  isPublic,
  name,
  startDate,
  endDate,
  location,
  image,
  url,
  description,
  eventAttendanceMode,
  eventStatus,
  organizer,
} = {}) {
  if (isPublic !== true) {
    // Do NOT warn — private events are the common case and should silently no-op.
    return null;
  }
  if (!nonEmptyString(name)) return invalid('Event', 'name');
  if (!nonEmptyString(startDate)) return invalid('Event', 'startDate');
  if (!location) return invalid('Event', 'location');

  const loc = normalizeLocation(location);
  if (!loc) return invalid('Event', 'location.name');

  const out = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'Event',
    name,
    startDate,
    location: loc,
  };
  if (nonEmptyString(endDate)) out.endDate = endDate;
  if (nonEmptyString(image)) out.image = image;
  if (nonEmptyString(url)) out.url = url;
  if (nonEmptyString(description)) out.description = description;
  if (nonEmptyString(eventAttendanceMode)) out.eventAttendanceMode = eventAttendanceMode;
  if (nonEmptyString(eventStatus)) out.eventStatus = eventStatus;
  if (organizer && nonEmptyString(organizer.name)) {
    out.organizer = { '@type': 'Organization', name: organizer.name };
    if (nonEmptyString(organizer.url)) out.organizer.url = organizer.url;
  }
  return out;
}

/**
 * Preset Service schemas for the six event category landing pages.
 * Names/descriptions are English-first; page components pass the {@code lang}
 * to point the {@code url} at the localized route.
 */
const CATEGORY_SERVICES = {
  weddings: {
    name: 'Digital Wedding Invitations & Planning',
    description: 'Elegant digital wedding invitations, RSVP tracking, seating charts, and planning tools tailored for weddings.',
    serviceType: 'Wedding Invitations',
  },
  'kids-birthdays': {
    name: 'Kids Birthday Invitations',
    description: 'Playful digital birthday invitations and RSVP tools designed for kids parties.',
    serviceType: 'Kids Birthday Invitations',
  },
  'adult-birthdays': {
    name: 'Adult Birthday Invitations',
    description: 'Sophisticated digital invitations and RSVP management for milestone and adult birthday celebrations.',
    serviceType: 'Adult Birthday Invitations',
  },
  business: {
    name: 'Corporate & Business Event Invitations',
    description: 'Professional digital invitations, RSVP tracking, and guest management for corporate events and conferences.',
    serviceType: 'Corporate Event Invitations',
  },
  baby: {
    name: 'Baby Shower Invitations',
    description: 'Beautiful digital baby shower invitations with RSVP tracking and personalized designs.',
    serviceType: 'Baby Shower Invitations',
  },
  holiday: {
    name: 'Holiday Party Invitations',
    description: 'Festive digital holiday party invitations with RSVP tracking and themed templates.',
    serviceType: 'Holiday Party Invitations',
  },
};

/**
 * Build the preset Service schema for a category landing page.
 * @param {string} categoryKey - one of the CATEGORY_SERVICES keys
 * @param {{ lang?: string, baseUrl?: string, areaServed?: string }} [opts]
 */
export function categoryServiceSchema(categoryKey, { lang = 'mk', baseUrl = DEFAULT_BASE_URL, areaServed = 'North Macedonia' } = {}) {
  const preset = CATEGORY_SERVICES[categoryKey];
  if (!preset) return invalid('Service', `category "${categoryKey}"`);
  return serviceSchema({
    ...preset,
    areaServed,
    url: `${baseUrl}/${lang}/category/${categoryKey}`,
  });
}

/**
 * schema.org/LocalBusiness — reserved for future vendor profile pages.
 * Required: name, address.
 */
export function localBusinessSchema({
  name,
  address,
  telephone,
  url,
  image,
  priceRange,
  description,
  openingHours,
  geo,
  aggregateRating,
} = {}) {
  if (!nonEmptyString(name)) return invalid('LocalBusiness', 'name');
  if (!address) return invalid('LocalBusiness', 'address');

  const addr = normalizeAddress(address);
  if (!addr) return invalid('LocalBusiness', 'address.streetAddress');

  const out = {
    '@context': SCHEMA_CONTEXT,
    '@type': 'LocalBusiness',
    name,
    address: addr,
  };
  if (nonEmptyString(telephone)) out.telephone = telephone;
  if (nonEmptyString(url)) out.url = url;
  if (nonEmptyString(image)) out.image = image;
  if (nonEmptyString(priceRange)) out.priceRange = priceRange;
  if (nonEmptyString(description)) out.description = description;
  if (Array.isArray(openingHours) && openingHours.length > 0) {
    out.openingHoursSpecification = openingHours;
  }
  if (geo && Number.isFinite(geo.latitude) && Number.isFinite(geo.longitude)) {
    out.geo = { '@type': 'GeoCoordinates', latitude: geo.latitude, longitude: geo.longitude };
  }
  if (aggregateRating
      && Number.isFinite(aggregateRating.ratingValue)
      && Number.isFinite(aggregateRating.reviewCount)) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount,
    };
  }
  return out;
}

function normalizeLocation(location) {
  if (typeof location === 'string') {
    return nonEmptyString(location) ? { '@type': 'Place', name: location } : null;
  }
  if (!location || !nonEmptyString(location.name)) return null;
  const out = { '@type': 'Place', name: location.name };
  if (location.address) {
    const addr = normalizeAddress(location.address);
    if (addr) out.address = addr;
  }
  return out;
}

function normalizeAddress(address) {
  if (typeof address === 'string') {
    return nonEmptyString(address) ? { '@type': 'PostalAddress', streetAddress: address } : null;
  }
  if (!address) return null;
  const hasAny = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']
      .some(k => nonEmptyString(address[k]));
  if (!hasAny) return null;
  const out = { '@type': 'PostalAddress' };
  for (const k of ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']) {
    if (nonEmptyString(address[k])) out[k] = address[k];
  }
  return out;
}

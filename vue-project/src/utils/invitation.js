/**
 * Shared helpers for invitation pages.
 * Extracted from ModernCollage so every theme can reuse them.
 */

/**
 * Build a multi-line HTML address from a location object.
 * Joins name, addressLine and city with `<br>`.
 */
export function buildLocationAddress(loc) {
  if (!loc) return '';
  return [loc.name || loc.venueName, loc.addressLine || loc.address, loc.city].filter(Boolean).join('<br>');
}

/**
 * Return the best map URL for a location object.
 * Prefers `googleMapsUrl`, falls back to a lat/lng URL.
 */
export function buildMapUrl(loc) {
  if (!loc) return '';
  if (loc.googleMapsUrl || loc.mapUrl) return loc.googleMapsUrl || loc.mapUrl;
  if (loc.latitude != null && loc.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }
  return '';
}

/**
 * Format a start/end time pair into a display string.
 * Returns "14:00 - 15:30" or just "14:00".
 */
export function formatTimeRange(startTime, endTime) {
  if (!startTime) return '';
  if (endTime) return `${startTime} - ${endTime}`;
  return startTime;
}

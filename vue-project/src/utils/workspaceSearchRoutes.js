/**
 * Where a top-bar search hit leads, per console.
 *
 * <p>Kept apart from the combobox so the rules sit in one place and can be
 * read — and tested — without mounting a layout.
 */

/** @returns the path to open, or null for a kind the agency console does not search */
export function agencyRouteFor(hit, lang = 'mk') {
  switch (hit?.kind) {
    case 'EVENT':
      return `/${lang}/dashboard/events/overview`
    case 'TASK':
      return `/${lang}/agency/tasks`
    case 'LEAD':
      return `/${lang}/agency/pipeline`
    default:
      return null
  }
}

/** @returns the location to open, or null for a kind the vendor console does not search */
export function vendorRouteFor(hit, lang = 'mk') {
  switch (hit?.kind) {
    case 'INQUIRY':
      return { path: `/${lang}/vendor/inbox`, query: { inquiry: hit.id } }
    case 'PACKAGE':
      return `/${lang}/vendor/packages`
    case 'BOOKING':
      return `/${lang}/vendor/calendar`
    default:
      return null
  }
}

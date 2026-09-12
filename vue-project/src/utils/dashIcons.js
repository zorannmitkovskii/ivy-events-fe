/**
 * The dashboard sidebar's icon set, taken from the 2026 mockups.
 *
 * <p>Inner paths only, no `<svg>` wrapper — `DashNavItem` supplies that, with
 * the viewBox, the fill and the stroke width the design sets. This is why they
 * are not in `utils/icons.js`: those entries are whole `<svg>` elements with
 * their own attributes, and dropping one into the sidebar gives a 24px icon
 * with the wrong stroke inside a 19px box.
 *
 * <p>Drawn on a 24×24 grid, stroked rather than filled, so `currentColor`
 * carries the sidebar's own text colour and its hover and active states.
 */
export const DashIcons = {
  overview: '<path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',

  guests:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6 6 0 0 1 3.5 6.5"/>',

  team:
    '<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0"/>',

  tasks: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/>',

  budget: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',

  seating:
    '<circle cx="12" cy="12" r="5"/><circle cx="12" cy="3.5" r="1.5"/><circle cx="12" cy="20.5" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="20.5" cy="12" r="1.5"/>',

  vendors: '<path d="M3 9h18l-1.5 11h-15zM8 9V6a4 4 0 0 1 8 0v3"/>',

  agenda: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',

  gallery:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 9"/>',

  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',

  reports: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',

  messages: '<path d="M4 5h16v11H8l-4 4z"/>',

  payments:
    '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0M12 5v2m0 10v2"/>',

  reviews: '<path d="m12 3 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 18.3l-6.1 3.3 1.4-6.8L2.2 10.1l6.9-.8Z"/>',

  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5A7 7 0 0 0 19 12z"/>',

  // Sections the mockups have no row for, drawn to match.
  link: '<path d="M10 13.5a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7l-1.4 1.4M14 10.5a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.4-1.4"/>',

  checkIn: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',

  catering:
    '<path d="M4 20h16M6 20v-4a6 6 0 0 1 12 0v4M12 6V3"/><path d="M9 10h6"/>',

  quotes: '<path d="M6 3h9l5 5v13H6z"/><path d="M14 3v6h6M9 13h7M9 17h5"/>',

  postEvent: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',

  support: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3"/><path d="M12 17h.01"/>',

  portfolio:
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',

  packages: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9"/>',
}

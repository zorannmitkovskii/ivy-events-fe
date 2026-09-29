/**
 * The vendor portal's sections, each tied to the capability that unlocks it.
 *
 * <p>One list, used twice: the layout draws the tabs a vendor has, and the
 * route guard turns away a direct URL to one they do not. Two lists would
 * drift, and the drift would look like a bug in whichever half was newer.
 *
 * <p>Two independent gates sit on these rows and both must pass. The
 * <b>capability</b> says the tab exists for this trade at all — a
 * photographer has no room to lay out. The <b>privilege</b> says this
 * particular member of the business may open it, which is the owner's
 * decision about their own staff.
 *
 * <p>Grouped as the 2026 vendor design groups them — work, presentation,
 * management — and in that order. The home comes first for everybody: it is
 * where the new inquiries are, which is the thing a vendor opens the portal
 * for. Rows with {@code nav: false} are real screens reached from inside
 * another one (the approval application from the profile, per-member
 * privileges from the team), so the guard still needs an opinion on them.
 */
export const VENDOR_GROUPS = ["work", "presentation", "management"];

export const VENDOR_TABS = [
  { name: "vendor.home", group: "work", privilege: "vendor:overview", label: "vendorWork.nav.home", capability: null },
  // Ungated: an inquiry can reach any approved vendor whatever they do, so an
  // inbox is not something a capability should be able to hide.
  { name: "vendor.inbox", group: "work", privilege: "vendor:inquiries", label: "vendorWork.nav.inbox", capability: null },
  { name: "vendor.calendar", group: "work", privilege: "vendor:calendar", label: "vendorWork.nav.calendar", capability: "CALENDAR" },

  { name: "vendor.portfolio", group: "presentation", privilege: "vendor:portfolio", label: "vendorWork.nav.portfolio", capability: "GALLERY" },
  { name: "vendor.packages", group: "presentation", privilege: "vendor:packages", label: "vendorPortal.packages", capability: "PACKAGES" },
  { name: "vendor.profile", group: "presentation", privilege: "vendor:profile", label: "vendorWork.nav.profile", capability: null },
  { name: "vendor.microsite", group: "presentation", privilege: "vendor:profile", label: "vendorWork.nav.microsite", capability: null },

  { name: "vendor.team", group: "management", privilege: "vendor:team", label: "vendorWork.nav.team", capability: null },
  { name: "vendor.insights", group: "management", privilege: "vendor:overview", label: "vendorWork.nav.insights", capability: null },

  // Reached from the profile ("submit for approval") and from the team page.
  { name: "vendor.application", group: "presentation", privilege: "vendor:settings", label: "vendorPortal.application", capability: null, nav: false },
  { name: "vendor.privileges", group: "management", privilege: "vendor:team", label: "privileges.title", capability: null, nav: false },
];

/** Where a vendor lands when they open the portal: the first tab their trade has. */
export function firstTabFor(capabilities = []) {
  const tab = VENDOR_TABS.find(
    (candidate) => candidate.nav !== false && (candidate.capability === null || capabilities.includes(candidate.capability)),
  );
  return tab ? tab.name : "vendor.home";
}

/** Screens outside the sidebar that still belong to one privilege. */
const EXTRA_ROUTE_PRIVILEGES = { "vendor.microsite.preview": "vendor:profile" };

/** The privilege a staff member needs to open this route, or null when none does. */
export function privilegeForRoute(routeName) {
  return VENDOR_TABS.find((tab) => tab.name === routeName)?.privilege ?? EXTRA_ROUTE_PRIVILEGES[routeName] ?? null;
}

/**
 * Where a staff member goes when they open a screen they were not given: the
 * first tab they may open. Null when they may open none.
 */
export function firstAllowedTab(canOpen, capabilities = null) {
  const tab = VENDOR_TABS.find(
    (candidate) =>
      candidate.nav !== false &&
      canOpen(candidate.privilege) &&
      (capabilities === null || candidate.capability === null || capabilities.includes(candidate.capability)),
  );
  return tab ? tab.name : null;
}

export function capabilityForRoute(routeName) {
  return VENDOR_TABS.find((tab) => tab.name === routeName)?.capability ?? null;
}

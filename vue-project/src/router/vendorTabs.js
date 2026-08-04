/**
 * The vendor portal's sections, each tied to the capability that unlocks it.
 *
 * <p>One list, used twice: the layout draws the tabs a vendor has, and the
 * route guard turns away a direct URL to one they do not. Two lists would
 * drift, and the drift would look like a bug in whichever half was newer.
 *
 * <p>Order is the tab order. Calendar sits last because it is the only one
 * every vendor has, and putting the trade-specific work first is what makes
 * the portal look built for them.
 */
export const VENDOR_TABS = [
  { name: "vendor.packages", label: "vendorPortal.packages", capability: "PACKAGES" },
  { name: "vendor.floorPlans", label: "vendorPortal.floorPlans", capability: "FLOOR_PLANS" },
  { name: "vendor.portfolio", label: "vendorPortal.portfolio", capability: "GALLERY" },
  { name: "vendor.calendar", label: "vendorPortal.calendar", capability: "CALENDAR" },

  // No capability: every vendor has an application, and any approved vendor may
  // have a microsite, whatever trade they are in. Placed after the
  // capability-gated ones so firstTabFor still lands somebody on their work
  // rather than on a form.
  { name: "vendor.application", label: "vendorPortal.application", capability: null },
  { name: "vendor.microsite", label: "vendorPortal.microsite", capability: null }
];

/** Where a vendor lands when they open the portal: their first available tab. */
export function firstTabFor(capabilities = []) {
  const tab = VENDOR_TABS.find((candidate) => capabilities.includes(candidate.capability));
  return tab ? tab.name : "vendor.calendar";
}

export function capabilityForRoute(routeName) {
  return VENDOR_TABS.find((tab) => tab.name === routeName)?.capability ?? null;
}

import { describe, expect, it } from "vitest";
import { VENDOR_TABS, capabilityForRoute, firstTabFor } from "@/router/vendorTabs";

/**
 * The tab list is used twice — the layout draws from it and the route guard
 * enforces it — so what matters is that both readings agree, and that a vendor
 * is never sent somewhere they cannot go.
 */
describe("vendor tabs", () => {
  it("sends a restaurant to its packages first, not to the calendar", () => {
    expect(firstTabFor(["CALENDAR", "PACKAGES", "FLOOR_PLANS", "GALLERY"]))
      .toBe("vendor.packages");
  });

  it("sends a photographer to their portfolio, skipping the tabs they lack", () => {
    expect(firstTabFor(["CALENDAR", "GALLERY", "MEDIA_LINKS"])).toBe("vendor.portfolio");
  });

  it("falls back to the calendar, which every vendor has", () => {
    expect(firstTabFor([])).toBe("vendor.calendar");
    expect(firstTabFor()).toBe("vendor.calendar");
  });

  it("never lands a vendor on a tab their capabilities do not include", () => {
    const capabilitySets = [
      ["CALENDAR"],
      ["CALENDAR", "GALLERY"],
      ["CALENDAR", "MEDIA_LINKS", "GALLERY"],
      ["CALENDAR", "PACKAGES", "FLOOR_PLANS", "GALLERY"]
    ];

    for (const capabilities of capabilitySets) {
      const landing = firstTabFor(capabilities);
      const needed = capabilityForRoute(landing);
      expect(capabilities).toContain(needed);
    }
  });

  it("maps every tab back to the capability that unlocks it", () => {
    for (const tab of VENDOR_TABS) {
      expect(capabilityForRoute(tab.name)).toBe(tab.capability);
    }
  });

  it("does not claim a capability for a route outside the portal", () => {
    expect(capabilityForRoute("dashboard.overview")).toBeNull();
  });
});

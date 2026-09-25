import { describe, expect, it } from "vitest";
import { VENDOR_GROUPS, VENDOR_TABS, capabilityForRoute, firstTabFor } from "@/router/vendorTabs";

/**
 * The tab list is used twice — the layout draws from it and the route guard
 * enforces it — so what matters is that both readings agree, and that a vendor
 * is never sent somewhere they cannot go.
 *
 * <p>Since the 2026 vendor design every vendor lands on the home: it is where
 * new inquiries are, whatever the trade.
 */
describe("vendor tabs", () => {
  it("lands every vendor on the home, whatever their trade", () => {
    expect(firstTabFor(["CALENDAR", "PACKAGES", "GALLERY"])).toBe("vendor.home");
    expect(firstTabFor(["CALENDAR", "GALLERY", "MEDIA_LINKS"])).toBe("vendor.home");
    expect(firstTabFor([])).toBe("vendor.home");
    expect(firstTabFor()).toBe("vendor.home");
  });

  it("never lands a vendor on a tab their capabilities do not include", () => {
    const capabilitySets = [
      [],
      ["CALENDAR"],
      ["CALENDAR", "GALLERY"],
      ["CALENDAR", "MEDIA_LINKS", "GALLERY"],
      ["CALENDAR", "PACKAGES", "GALLERY"]
    ];

    for (const capabilities of capabilitySets) {
      const needed = capabilityForRoute(firstTabFor(capabilities));
      expect(needed === null || capabilities.includes(needed)).toBe(true);
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

  it("no longer offers a floor-plan tab", () => {
    // The room is the couple's seating editor's job. Asserted on the list
    // rather than on one capability set, because a tab nobody can reach is
    // still a tab the guard has to have an opinion about.
    expect(VENDOR_TABS.map((tab) => tab.name)).not.toContain("vendor.floorPlans");
    expect(VENDOR_TABS.map((tab) => tab.capability)).not.toContain("FLOOR_PLANS");
  });

  it("leaves the screens every vendor has ungated by trade", () => {
    // Null is what makes the route guard skip the capability check.
    for (const name of ["vendor.home", "vendor.inbox", "vendor.profile", "vendor.microsite",
      "vendor.team", "vendor.insights", "vendor.application"]) {
      expect(capabilityForRoute(name)).toBeNull();
    }
  });

  it("puts every drawn tab in one of the design's three groups, in order", () => {
    const drawn = VENDOR_TABS.filter((tab) => tab.nav !== false);

    expect(drawn.every((tab) => VENDOR_GROUPS.includes(tab.group))).toBe(true);
    expect(drawn.map((tab) => tab.name)).toEqual([
      "vendor.home", "vendor.inbox", "vendor.calendar",
      "vendor.portfolio", "vendor.packages", "vendor.profile", "vendor.microsite",
      "vendor.team", "vendor.insights",
    ]);
  });

  it("keeps the application and per-member privileges routable but out of the sidebar", () => {
    const hidden = VENDOR_TABS.filter((tab) => tab.nav === false).map((tab) => tab.name);

    expect(hidden).toEqual(["vendor.application", "vendor.privileges"]);
  });
});

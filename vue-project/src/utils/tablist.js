/**
 * The keys of a WAI-ARIA tab list (INV-503): arrows move between the tabs and
 * select them, Home / End go to the first / last. Returns the tab to select,
 * or null when the key is not one of them.
 */
export function tabFromKey(key, tabs, current) {
  if (!tabs?.length) return null;
  const i = Math.max(0, tabs.indexOf(current));
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return tabs[(i + 1) % tabs.length];
    case "ArrowLeft":
    case "ArrowUp":
      return tabs[(i - 1 + tabs.length) % tabs.length];
    case "Home":
      return tabs[0];
    case "End":
      return tabs[tabs.length - 1];
    default:
      return null;
  }
}

/**
 * Handles a keydown on a tab: selects the tab the key leads to and moves the
 * focus onto it (`root` holds the tabs, each with `data-tab="<key>"` or the
 * given attribute).
 */
export function onTablistKeydown(event, { tabs, current, select, root, attr = "data-tab" }) {
  const next = tabFromKey(event.key, tabs, current);
  if (next === null) return;
  event.preventDefault();
  select(next);
  const host = root || event.currentTarget;
  host?.querySelector?.(`[${attr}="${next}"]`)?.focus();
}

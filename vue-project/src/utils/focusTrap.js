/**
 * Keyboard focus inside a dialog (INV-503): what can take focus, and Tab /
 * Shift+Tab kept inside. Used by BaseModal and the editor's phone sheet.
 */
const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/** The elements in `root` a keyboard can reach, in document order. */
export function focusableIn(root) {
  if (!root) return [];
  return [...root.querySelectorAll(FOCUSABLE)].filter(
    (el) => !el.closest("[inert]") && !el.hidden && el.getAttribute("aria-hidden") !== "true"
      && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none"
  );
}

/**
 * Keeps Tab inside `root`: from the last element to the first and back.
 * Returns true when it moved the focus itself.
 */
export function trapTab(event, root) {
  if (event.key !== "Tab" || !root) return false;
  const items = focusableIn(root);
  if (!items.length) {
    event.preventDefault();
    return true;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const outside = !root.contains(active);
  if (event.shiftKey && (active === first || outside)) {
    event.preventDefault();
    last.focus();
    return true;
  }
  if (!event.shiftKey && (active === last || outside)) {
    event.preventDefault();
    first.focus();
    return true;
  }
  return false;
}

/** Focus `el` if it is still on the page; true when it did. */
export function focusIfConnected(el) {
  if (!el || typeof el.focus !== "function" || !el.isConnected) return false;
  el.focus();
  return true;
}

/** Whether nothing in particular has the focus (it fell back to the page). */
export function focusIsLost() {
  const active = document.activeElement;
  return !active || active === document.body || active === document.documentElement;
}

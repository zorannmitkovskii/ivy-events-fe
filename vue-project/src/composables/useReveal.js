import { onMounted, nextTick } from "vue";

/**
 * The 2026 redesign's reveal-on-scroll: `.reveal` fades and rises into
 * `.reveal.visible` once it is a seventh of the way into the viewport.
 *
 * Distinct from {@link useScrollReveal}, which does the same job for the older
 * `[data-reveal]` → `.revealed` convention and takes a container ref. This one
 * is document-wide and needs no ref, because the marketing sections that use
 * it are siblings on the page rather than children of one wrapper.
 *
 * One observer for the whole document, shared: every landing section calls
 * this, and a dozen observers each watching the same page would each fire on
 * the same scroll. Elements are unobserved the moment they appear — the
 * animation runs once, on the way down, and does not undo itself on the way
 * back up.
 */
let observer = null;
const seen = new WeakSet();

function ensureObserver() {
  if (observer || typeof IntersectionObserver === "undefined") return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.14 }
  );

  return observer;
}

export function observeReveals(root = document) {
  const io = ensureObserver();

  // No IntersectionObserver — show everything rather than leave the page
  // blank, since `.reveal` starts at opacity 0.
  if (!io) {
    root.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
    return;
  }

  root.querySelectorAll(".reveal").forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);
    io.observe(el);
  });
}

export function useReveal() {
  onMounted(() => nextTick(() => observeReveals()));
}

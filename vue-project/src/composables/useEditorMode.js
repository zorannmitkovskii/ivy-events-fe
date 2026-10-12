import { ref } from "vue";

/**
 * INV-103 — quick start and advanced settings of the invitation editor.
 *
 * The mode only decides which controls are shown. It never touches the
 * invitation: every value (content, RSVP, palette, fonts, layouts, entry
 * animation) lives in the one editor state (`useWeddingInvitation`) whatever
 * the mode, so switching keeps everything and a hidden advanced value is
 * still saved and rendered.
 *
 * Quick:    Info, the content sections (hero photo, details, schedule, story,
 *           story photos) and RSVP — enough for a working invitation.
 * Advanced: also the sections marked `advanced: true` (entry animation and its
 *           collage, colours / palette and custom colours, fonts) and, where
 *           the design offers it, each section's Layout sub-tab.
 *
 * INV-501 — the controls are grouped by task, the same on the sidebar and in
 * the sheet: the basic tasks first (Info; Content = the invitation's sections,
 * then RSVP; Preview as guest is the editor's own action), the rare style
 * controls apart in the Style tab (the opening animation with its collage
 * photos, then colours and fonts; layouts stay a sub-tab of the section they
 * lay out). Which group a control is in is a flag on SIDEBAR_SECTIONS
 * (`group`); the section's own `tab` is data (it orders the saved
 * `sectionOrder`) and is not changed by the grouping.
 *
 * One mode for the desktop sidebar and the phone sheet; remembered per browser
 * (a view preference, not invitation data).
 */

export const EDITOR_MODES = Object.freeze({ QUICK: "quick", ADVANCED: "advanced" });
export const EDITOR_MODE_STORAGE_KEY = "invitation_editor_mode_v1";

function readStoredMode() {
  try {
    const stored = localStorage.getItem(EDITOR_MODE_STORAGE_KEY);
    return stored === EDITOR_MODES.ADVANCED ? EDITOR_MODES.ADVANCED : EDITOR_MODES.QUICK;
  } catch {
    return EDITOR_MODES.QUICK;
  }
}

const editorMode = ref(readStoredMode());

/**
 * The task groups of the editor, in order (INV-501). `tab` is where the group
 * shows; an `advanced` group only in the advanced settings.
 */
export const EDITOR_GROUPS = Object.freeze([
  Object.freeze({ key: "content", tab: "sections", advanced: false }),
  Object.freeze({ key: "rsvp", tab: "sections", advanced: false }),
  Object.freeze({ key: "animation", tab: "style", advanced: true }),
  Object.freeze({ key: "look", tab: "style", advanced: true }),
]);

const GROUP_BY_KEY = Object.fromEntries(EDITOR_GROUPS.map((g) => [g.key, g]));

/** The group of a control (one without a known group: by its data tab). */
export function groupOf(section) {
  const known = GROUP_BY_KEY[section?.group];
  if (known) return known;
  return section?.tab === "style" ? GROUP_BY_KEY.look : GROUP_BY_KEY.content;
}

/** The editor tab a control shows in. */
export function tabOf(section) {
  return groupOf(section).tab;
}

/**
 * Whether a control gets the show/hide switch: not a mandatory section, and
 * not one whose visibility the invitation does not draw (`switch: false` —
 * story photos, collage photos (shown by the gallery opening), colours,
 * fonts). The saved visibility of those is left as it is.
 */
export function hasVisibilitySwitch(section) {
  return !!section && !section.mandatory && section.switch !== false;
}

/** A control that only the advanced settings show. */
export function isAdvancedSection(section) {
  return !!section?.advanced || groupOf(section).advanced;
}

/** The tabs of the editor in a mode, in order. */
export function tabsForMode(mode) {
  return mode === EDITOR_MODES.ADVANCED ? ["info", "sections", "style"] : ["info", "sections"];
}

/**
 * The sections of one tab shown in a mode, group by group (in the groups'
 * order); within a group they keep the order they were given in.
 */
export function sectionsForMode(sections, mode, tab) {
  return groupedSectionsForMode(sections, mode, tab).flatMap((g) => g.sections);
}

/** The same, as the groups shown in that tab: [{ key, advanced, sections }]. */
export function groupedSectionsForMode(sections, mode, tab) {
  const shown = (sections || []).filter((s) =>
    tabOf(s) === tab && (mode === EDITOR_MODES.ADVANCED || !isAdvancedSection(s)));
  return EDITOR_GROUPS
    .filter((g) => g.tab === tab)
    .map((g) => ({ key: g.key, advanced: g.advanced, sections: shown.filter((s) => groupOf(s) === g) }))
    .filter((g) => g.sections.length > 0);
}

/**
 * The sub-tabs of a section: always its content; its Layout picker only in the
 * advanced settings and only where the design offers layouts (the builder).
 */
export function sectionSubTabs(section, { mode, layoutsAvailable } = {}) {
  const tabs = ["content"];
  if (mode === EDITOR_MODES.ADVANCED && layoutsAvailable && section?.layout) tabs.push("layout");
  return tabs;
}

export function useEditorMode() {
  function setEditorMode(mode) {
    const next = mode === EDITOR_MODES.ADVANCED ? EDITOR_MODES.ADVANCED : EDITOR_MODES.QUICK;
    editorMode.value = next;
    try {
      localStorage.setItem(EDITOR_MODE_STORAGE_KEY, next);
    } catch {
      /* private mode / storage full: the mode still applies to this visit */
    }
  }
  return { editorMode, setEditorMode, isAdvanced: () => editorMode.value === EDITOR_MODES.ADVANCED };
}

/** Test helper: back to the stored (or default) mode. */
export function resetEditorModeForTests() {
  editorMode.value = readStoredMode();
}

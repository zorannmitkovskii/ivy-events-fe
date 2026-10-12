import { checkContrast } from "@/composables/useBrandContrast";

/** #abc → #aabbcc (presets use the short form); anything else as it is. */
function fullHex(value) {
  const m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(typeof value === "string" ? value.trim() : "");
  return m ? `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}` : value;
}

/**
 * What guests read on the invitation's colours (INV-503): body text on the
 * page, the sections and the cards as they are drawn, and the button label on
 * the button. WCAG 4.5:1 (IVY-1004's check). A colour that is not a plain hex
 * (a gradient, rgba) is unknown — left out rather than called "low".
 *
 * @returns {{ key: string, ratio: number, passes: boolean }[]}
 */
export function readabilityChecks({ text, rootBg, sectionBg, cardBg, buttonText, buttonBg }) {
  return [
    { key: "textOnBackground", fg: text, bg: rootBg },
    { key: "textOnSections", fg: text, bg: sectionBg },
    { key: "textOnCards", fg: text, bg: cardBg },
    { key: "buttonText", fg: buttonText, bg: buttonBg },
  ]
    .map(({ key, fg, bg }) => ({ key, ...checkContrast(fullHex(fg), fullHex(bg)) }))
    .filter((c) => c.ratio !== null);
}

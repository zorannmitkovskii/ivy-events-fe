/**
 * Chart colours, validated rather than chosen by eye.
 *
 * <p>These are categorical slots 1–3 of the reference palette, run through the
 * palette validator in both modes: worst all-pairs colour-vision-deficiency
 * separation ΔE 9.2 light / 9.4 dark against a target of 8, worst normal-vision
 * ΔE 24.0 / 20.9 against a floor of 15.
 *
 * <p><b>Status colours are deliberately not used for the donut.</b> Green for
 * confirmed and red for declined is the obvious mapping and it fails: those two
 * measure ΔE 4.1 under deuteranopia, so roughly one man in twelve sees one
 * slice. Status hues stay where they carry an icon and a word beside them — the
 * delayed-tasks card and the attention pills — and the chart uses hues that
 * survive on their own.
 *
 * <p>Aqua sits at 2.74:1 on the light surface, under the 3:1 bar. The relief is
 * the legend with visible values, which is why the donut ships one rather than
 * relying on the slice alone.
 */
const LIGHT = {
  surface: '#fcfcfb',
  text: '#0b0b0b',
  muted: '#52514e',
  grid: '#e6e5e1',
  series: ['#2a78d6', '#eb6834', '#1baf7a'],
};

const DARK = {
  surface: '#1a1a19',
  text: '#ffffff',
  muted: '#c3c2b7',
  grid: '#3a3a37',
  series: ['#3987e5', '#d95926', '#199e70'],
};

/** Status hues. Fixed, never themed, and never used as a series colour. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

/**
 * The viewer's theme, with the explicit toggle winning over the OS setting in
 * both directions.
 */
export function isDarkMode() {
  if (typeof document === 'undefined') return false;
  const stamped = document.documentElement.getAttribute('data-theme');
  if (stamped === 'dark') return true;
  if (stamped === 'light') return false;
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function vizPalette() {
  return isDarkMode() ? DARK : LIGHT;
}

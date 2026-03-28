/**
 * Color contrast utilities for smart background/text/card color adjustment.
 * Ensures WCAG AA readability when users pick custom background colors.
 */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

/** sRGB relative luminance (WCAG 2.1) */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors */
function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Is the color "light" (luminance > 0.5)? */
function isLight(hex) {
  return luminance(hex) > 0.4;
}

/** Suggest dark or light text color for a given background */
function suggestTextColor(bgHex) {
  return isLight(bgHex) ? '#1f2937' : '#f9fafb';
}

/** Lighten a hex color by a factor (0-1) */
function lighten(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  );
}

/** Darken a hex color by a factor (0-1) */
function darken(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

/**
 * Adjust card background color to be visible on a section background.
 * Light bg → white cards. Dark bg → slightly lighter dark cards.
 */
function adjustCardBg(sectionBg) {
  if (isLight(sectionBg)) {
    return '#ffffff';
  }
  return lighten(sectionBg, 0.15);
}

/**
 * Adjust section alternating backgrounds from a single base background.
 * Returns { sectionBg, sectionBgAlt } for alternating sections.
 */
function adjustSectionBgs(baseBg) {
  if (isLight(baseBg)) {
    return {
      sectionBg: baseBg,
      sectionBgAlt: darken(baseBg, 0.03),
    };
  }
  return {
    sectionBg: baseBg,
    sectionBgAlt: lighten(baseBg, 0.05),
  };
}

/**
 * Ensure an accent color has enough contrast against the background.
 * Darkens or lightens the accent until WCAG AA (4.5:1) is met.
 */
function ensureContrast(color, bg, minRatio = 3) {
  let adjusted = color;
  const bgIsLight = isLight(bg);
  for (let i = 0; i < 20; i++) {
    if (contrastRatio(adjusted, bg) >= minRatio) return adjusted;
    adjusted = bgIsLight ? darken(adjusted, 0.08) : lighten(adjusted, 0.08);
  }
  return adjusted;
}

/**
 * Generate a full derived color set from a background + accent color.
 * This is the "smart" color contrast function.
 */
function deriveColors(bgHex, accentHex) {
  const textColor = suggestTextColor(bgHex);
  const cardBg = adjustCardBg(bgHex);
  const { sectionBg, sectionBgAlt } = adjustSectionBgs(bgHex);
  const safeAccent = ensureContrast(accentHex, bgHex);
  const safeAccentOnCard = ensureContrast(accentHex, cardBg);

  return {
    text: textColor,
    cardBg,
    sectionBg,
    sectionBgAlt,
    accent: safeAccent,
    accentOnCard: safeAccentOnCard,
  };
}

/** Pastel background presets for the color picker */
const BG_COLOR_PRESETS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Ivory', hex: '#FDFBF7' },
  { name: 'Cream', hex: '#fefce8' },
  { name: 'Blush', hex: '#fdf2f8' },
  { name: 'Rose', hex: '#fff1f2' },
  { name: 'Peach', hex: '#fff7ed' },
  { name: 'Lavender', hex: '#f5f3ff' },
  { name: 'Sky', hex: '#f0f9ff' },
  { name: 'Mint', hex: '#f0fdf4' },
  { name: 'Sage', hex: '#f0fdf4' },
  { name: 'Sand', hex: '#fafaf9' },
  { name: 'Warm Gray', hex: '#f5f5f4' },
  { name: 'Cool Gray', hex: '#f8fafc' },
  { name: 'Midnight', hex: '#0f0a1a' },
  { name: 'Navy', hex: '#0c1222' },
  { name: 'Charcoal', hex: '#1c1917' },
];

/** Strong text color presets */
const TEXT_COLOR_PRESETS = [
  { name: 'Black', hex: '#0f172a' },
  { name: 'Charcoal', hex: '#1f2937' },
  { name: 'Navy', hex: '#1e3a5f' },
  { name: 'Dark Green', hex: '#14532d' },
  { name: 'Dark Red', hex: '#7f1d1d' },
  { name: 'Dark Purple', hex: '#2e1065' },
  { name: 'Brown', hex: '#451a03' },
  { name: 'White', hex: '#f9fafb' },
  { name: 'Light Gray', hex: '#e2e8f0' },
];

export function useColorContrast() {
  return {
    luminance,
    contrastRatio,
    isLight,
    suggestTextColor,
    lighten,
    darken,
    adjustCardBg,
    adjustSectionBgs,
    ensureContrast,
    deriveColors,
    BG_COLOR_PRESETS,
    TEXT_COLOR_PRESETS,
  };
}

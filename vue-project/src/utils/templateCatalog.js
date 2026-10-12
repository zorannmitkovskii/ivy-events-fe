/**
 * What a design in the catalogue offers, for the cards on /event-invitations
 * (INV-201) — so designs can be compared before one is picked.
 *
 * Only what the code really draws is said. The server's template metadata is
 * a name, a path, a thumbnail and one admin-typed description; it has no
 * style or section attributes. So the traits come from the renderer a design
 * opens in (`UnifiedWeddingInvitation`): its preset (`config/designPresets`)
 * and the per-family components it picks
 * (`components/invitations/wedding/heroes/index.js`). A template whose path is
 * not one of those presets — e.g. one an admin adds for another category —
 * gets no traits and no made-up description; the card shows the server's
 * description as typed, if there is one.
 */
import { DESIGN_PRESETS } from '@/config/designPresets/index.js';

/*
 * Per family, as UnifiedWeddingInvitation renders it by default:
 *  - layout:    HERO_COMPONENTS — chateau and collage fall back to the coastal
 *               hero (photo beside the text).
 *  - story:     STORY_COMPONENTS — StoryGallery has a photo per chapter;
 *               the Parisian story one photo with paragraphs; the Persian
 *               story and Editorial chapters text cards plus up to 4 photos.
 *  - programme: SCHEDULE_COMPONENTS.
 */
const FAMILY_TRAITS = {
  coastal:   { layout: 'split',      story: 'photoPerChapter', programme: 'cards' },
  chateau:   { layout: 'split',      story: 'photoPerChapter', programme: 'cards' },
  collage:   { layout: 'split',      story: 'photoPerChapter', programme: 'horizontal' },
  parisian:  { layout: 'fullPhoto',  story: 'onePhoto',        programme: 'alternating' },
  persian:   { layout: 'glassPanel', story: 'textAndPhotos',   programme: 'vertical' },
  editorial: { layout: 'editorial',  story: 'textAndPhotos',   programme: 'table' },
};

/** The opening animation, from the preset's entry type/design (InvitationEntry). */
function openingOf(preset) {
  const design = preset.entryDesign || '';
  if (design.includes('curtain')) return 'curtain';
  switch (preset.entryType) {
    case 'envelop': return 'envelope';
    case 'door': return 'doors';
    case 'heart': return 'heart';
    case 'gallery': return 'gallery';
    case 'wax': return 'wax';
    default: return '';
  }
}

/** The order the traits are listed in on a card. */
export const TRAIT_KINDS = ['layout', 'story', 'programme', 'opening'];

/** The preset id for a template path ('invitations/coastal-breeze' → 'coastal-breeze'). */
export function presetIdOf(path) {
  if (!path) return '';
  const id = String(path).split('/').filter(Boolean).pop() || '';
  return Object.prototype.hasOwnProperty.call(DESIGN_PRESETS, id) ? id : '';
}

/**
 * The traits of a template, or null when its path is not a design the code
 * knows. `traits` are i18n keys under onboarding.invitations.card.traits.
 *
 * @returns {{ presetId: string, descriptionKey: string,
 *             traits: { kind: string, value: string }[] } | null}
 */
export function templateTraits(path) {
  const presetId = presetIdOf(path);
  if (!presetId) return null;
  const preset = DESIGN_PRESETS[presetId];
  const family = FAMILY_TRAITS[preset.family] || {};
  const values = { ...family, opening: openingOf(preset) };
  return {
    presetId,
    descriptionKey: `onboarding.invitations.card.designs.${presetId}`,
    traits: TRAIT_KINDS.filter((k) => values[k]).map((kind) => ({ kind, value: values[kind] })),
  };
}

/**
 * True when every template listed opens in the shared wedding renderer, which
 * always has event details, programme, story and RSVP. Only then can the
 * catalogue say so for all of them.
 */
export function allShareRendererSections(paths) {
  return paths.length > 0 && paths.every((p) => !!presetIdOf(p));
}

export const FAMILY_TRAITS_FOR_TEST = FAMILY_TRAITS;

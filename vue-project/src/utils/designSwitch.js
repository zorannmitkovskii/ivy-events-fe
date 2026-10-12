/**
 * Changing the design of an invitation that is already being edited
 * (INV-203).
 *
 * A design is only how the invitation looks: the route's `:design` picks a
 * preset (`config/designPresets`) and the renderer draws the same content with
 * that preset's components. Names, date, place, details, programme, story,
 * photos and RSVP settings are not part of a preset, so a change of design
 * keeps all of them. What can differ is whether the new design has a place
 * for a piece of content — that is said here, from what the renderer
 * (`UnifiedWeddingInvitation` + `components/invitations/wedding/heroes`)
 * really draws, so the editor can explain it instead of letting it vanish.
 */
import { DESIGN_PRESETS } from '@/config/designPresets/index.js';
import { presetIdOf, templateTraits } from '@/utils/templateCatalog';
import { isExampleItem } from '@/utils/creationSteps';

/** The builder ("build your own"): a design whose style is the person's own. */
export const BUILDER_DESIGN_ID = 'my-wedding';

/*
 * Per story family, what the story section draws:
 *  - StoryGallery (coastal, chateau, collage): a photo, date, title and text
 *    per chapter — no separate story photos.
 *  - Parisian: one photo (the first story photo) and the chapters as
 *    paragraphs — no chapter photos or dates.
 *  - Persian: chapter titles and text plus up to 4 story photos — no chapter
 *    photos or dates.
 *  - Editorial: chapter title, date and text plus up to 4 story photos; the
 *    renderer always passes story photos, so chapter photos are not drawn.
 */
const STORY_RENDERING = {
  coastal:   { storyPhotos: 0, chapterPhotos: true,  dates: true },
  chateau:   { storyPhotos: 0, chapterPhotos: true,  dates: true },
  collage:   { storyPhotos: 0, chapterPhotos: true,  dates: true },
  parisian:  { storyPhotos: 1, chapterPhotos: false, dates: false },
  persian:   { storyPhotos: 4, chapterPhotos: false, dates: false },
  editorial: { storyPhotos: 4, chapterPhotos: false, dates: true },
};

/** The order the hidden content is listed in. */
export const HIDDEN_KINDS = ['storyPhotos', 'chapterPhotos', 'storyDates', 'collagePhotos'];

/**
 * The person's content the current look does not draw. It stays saved; the
 * editor says it is not shown.
 *
 * @param {{ storyFamily: string, entryType: string, entryVisible?: boolean }} look
 * @param {{ storyPhotos?: number, chapterPhotos?: number, storyDates?: number, collagePhotos?: number }} own
 *        how many of each the person has added (not a design's examples)
 * @returns {{ kind: string, count: number, shown?: number }[]}
 */
export function hiddenContentFor(look = {}, own = {}) {
  const story = STORY_RENDERING[look.storyFamily] || STORY_RENDERING.coastal;
  const out = [];
  const storyPhotos = own.storyPhotos || 0;
  if (storyPhotos > story.storyPhotos) {
    out.push({ kind: 'storyPhotos', count: storyPhotos, shown: story.storyPhotos });
  }
  if ((own.chapterPhotos || 0) > 0 && !story.chapterPhotos) {
    out.push({ kind: 'chapterPhotos', count: own.chapterPhotos });
  }
  if ((own.storyDates || 0) > 0 && !story.dates) {
    out.push({ kind: 'storyDates', count: own.storyDates });
  }
  // Collage photos are drawn only by the gallery opening (InvitationEntry).
  const gallery = look.entryType === 'gallery' && look.entryVisible !== false;
  if ((own.collagePhotos || 0) > 0 && !gallery) {
    out.push({ kind: 'collagePhotos', count: own.collagePhotos });
  }
  return HIDDEN_KINDS.flatMap((k) => out.filter((x) => x.kind === k));
}

// The example photos every design puts in its sample story chapters (all from
// images.unsplash.com; a person's own photo is a file they picked or one
// uploaded to our storage).
const SAMPLE_STORY_IMAGES = new Set(
  Object.values(DESIGN_PRESETS).flatMap((p) => (p.defaultItems?.ourStory || []).map((s) => s.imageUrl).filter(Boolean)),
);

/** True for a story photo that is a design's example, not the person's. */
export function isSampleStoryImage(url) {
  return !url || SAMPLE_STORY_IMAGES.has(url) || /^https:\/\/images\.unsplash\.com\//.test(url);
}

/** Chapter photos and dates the person gave their story (examples left out). */
export function ownStoryCounts(items = []) {
  const own = (items || []).filter((s) => s && !isExampleItem(s, 'ourStory'));
  return {
    chapterPhotos: own.filter((s) => !isSampleStoryImage(s.imageUrl)).length,
    storyDates: own.filter((s) => String(s.storyDate || s.date || '').trim()).length,
  };
}

/** How many of `size` slots hold the person's photo (picked now or saved before). */
export function countOwnSlots(size, ...sources) {
  let n = 0;
  for (let i = 0; i < size; i++) {
    if (sources.some((src) => (Array.isArray(src) ? src[i] : src?.[i]))) n++;
  }
  return n;
}

/**
 * The designs offered for a switch: the category's templates the renderer can
 * draw (a known preset), once each, in the catalogue's order.
 *
 * @returns {{ presetId: string, templateId: string, name: string,
 *             descriptionKey: string, thumbnailUrl: string }[]}
 */
export function switchableDesigns(templates = []) {
  const seen = new Set();
  const out = [];
  for (const tpl of templates || []) {
    if (!tpl || tpl.active === false) continue;
    const presetId = presetIdOf(tpl.path);
    if (!presetId || seen.has(presetId)) continue;
    seen.add(presetId);
    out.push({
      presetId,
      templateId: tpl.id || presetId,
      name: tpl.name || DESIGN_PRESETS[presetId].name,
      descriptionKey: templateTraits(tpl.path)?.descriptionKey || '',
      thumbnailUrl: tpl.thumbnailImage || `/thumbnails/${presetId}.svg`,
    });
  }
  return out;
}

/** The name to show for the current design (builder included). */
export function designName(designId, designs = []) {
  const listed = designs.find((d) => d.presetId === designId);
  if (listed) return listed.name;
  return DESIGN_PRESETS[designId]?.name || '';
}

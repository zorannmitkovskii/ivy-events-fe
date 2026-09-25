/**
 * Blog post tags, normalized the way the backend normalizes them (IVY-906).
 *
 * Mirrors `BlogTags.java` so the editor shows the tag that will be saved, not
 * one the server quietly rewrites. The limits come from the database column:
 * ten tags of 28 characters and their separators fit in 300.
 */
export const MAX_TAGS = 10
export const MAX_TAG_LENGTH = 28

export function normalizeTag(raw) {
  return String(raw ?? '')
    .replace(/,/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/**
 * Adds what was typed to the tags a post already has.
 *
 * A comma separates tags while typing, so "сала, ресторан" is two. Repeats and
 * blanks are dropped. Returns the tags to keep and, when something was
 * refused, why — so the input can say so instead of losing the text.
 *
 * @returns {{ tags: string[], error: null | { key: 'tooLong' | 'tooMany', max: number } }}
 */
export function addTags(existing, typed) {
  const tags = [...existing]
  for (const part of String(typed ?? '').split(',')) {
    const tag = normalizeTag(part)
    if (!tag || tags.includes(tag)) continue
    if (tag.length > MAX_TAG_LENGTH) return { tags, error: { key: 'tooLong', max: MAX_TAG_LENGTH } }
    if (tags.length >= MAX_TAGS) return { tags, error: { key: 'tooMany', max: MAX_TAGS } }
    tags.push(tag)
  }
  return { tags, error: null }
}

/**
 * Small pieces the blog's pages and cards share: a post's category in the
 * reader's language, and the tint drawn behind a post that has no photo.
 */

const COVER_TINTS = ['c-sage', 'c-sand', 'c-rose', 'c-sky', 'c-night']

/** An unknown category prints nothing rather than `blog.categoryFOO`. */
export function blogCategoryLabel(category, t, te) {
  if (!category) return ''
  const key = `blog.category${category}`
  return te(key) || te(key, 'en') ? t(key) : ''
}

/** A stable number from a slug, so a post keeps its drawing wherever it shows. */
export function slugSeed(slug = '') {
  let sum = 0
  for (const char of slug) sum += char.charCodeAt(0)
  return sum
}

export function blogTint(seed) {
  return COVER_TINTS[seed % COVER_TINTS.length]
}

/** The three article designs; anything else is shown as a guide. */
export const LAYOUTS = ['GUIDE', 'INSPIRATION', 'PRODUCT']

export function layoutOf(post) {
  return LAYOUTS.includes(post?.layout) ? post.layout : 'GUIDE'
}

import { describe, it, expect } from 'vitest'
import { MAX_TAGS, MAX_TAG_LENGTH, addTags, normalizeTag } from '@/utils/blogTags'

/**
 * Tags as the editor types them (IVY-906). The rules mirror `BlogTags.java`,
 * so the chip on screen is the tag that gets saved.
 */

describe('normalizeTag', () => {
  it('trims, collapses spaces and lower-cases', () => {
    expect(normalizeTag('  Мала   САЛА ')).toBe('мала сала')
  })
})

describe('addTags', () => {
  it('splits on commas and drops repeats and blanks', () => {
    expect(addTags(['сала'], 'Свадба, сала , свадба, ,')).toEqual({ tags: ['сала', 'свадба'], error: null })
  })

  it('refuses a tag that is too long and says how long is allowed', () => {
    expect(addTags([], 'а'.repeat(MAX_TAG_LENGTH + 1))).toEqual({
      tags: [],
      error: { key: 'tooLong', max: MAX_TAG_LENGTH },
    })
  })

  it('refuses a tag past the limit and keeps the ones already there', () => {
    const full = Array.from({ length: MAX_TAGS }, (_, i) => `таг${i}`)

    expect(addTags(full, 'уште')).toEqual({ tags: full, error: { key: 'tooMany', max: MAX_TAGS } })
  })
})

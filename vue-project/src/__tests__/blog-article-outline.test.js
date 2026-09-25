import { describe, it, expect } from 'vitest'
import { outlineArticle, slugify, toggleChecklistItem } from '@/utils/articleOutline'
import { renderPostBody } from '@/utils/blogHtml'

/**
 * The article's table of contents and checklist (2026 blog design).
 *
 * The TOC is read off the body's own headings, never stored; what is pinned
 * here is that every heading gets a readable, unique anchor and that the
 * checklist items become toggles a reader can reach with the keyboard.
 */

describe('outlineArticle', () => {
  it('lists every h2 with an anchor made from its words, in any script', () => {
    const { html, headings } = outlineArticle('<h2>Почни со целта</h2><p>а</p><h2>Budget first</h2>')

    expect(headings).toEqual([
      { id: 'почни-со-целта', text: 'Почни со целта' },
      { id: 'budget-first', text: 'Budget first' },
    ])
    expect(html).toContain('<h2 id="почни-со-целта">')
  })

  it('keeps two headings with the same words apart', () => {
    const { headings } = outlineArticle('<h2>Совет</h2><h2>Совет</h2><h2>!!!</h2>')

    expect(headings.map((heading) => heading.id)).toEqual(['совет', 'совет-2', 'section-3'])
  })

  it('ignores h3, which is a subsection and not a stop in the contents', () => {
    expect(outlineArticle('<h3>Мал наслов</h3>').headings).toEqual([])
  })

  it('turns checklist items into unticked toggles and lazy-loads photos', () => {
    const { html } = outlineArticle('<ul class="checklist"><li>прва</li></ul><ul><li>обична</li></ul><figure><img src="https://x/a.jpg"></figure>')

    expect(html).toContain('<li role="checkbox" aria-checked="false" tabindex="0">прва</li>')
    expect(html).toContain('<li>обична</li>')
    expect(html).toContain('loading="lazy"')
  })

  it('returns an empty outline for an empty body', () => {
    expect(outlineArticle('')).toEqual({ html: '', headings: [] })
    expect(outlineArticle(null)).toEqual({ html: '', headings: [] })
  })
})

describe('toggleChecklistItem', () => {
  it('ticks and unticks an item, and leaves anything else alone', () => {
    document.body.innerHTML = outlineArticle('<ul class="checklist"><li>прва</li></ul><p>текст</p>').html
    const item = document.querySelector('li')

    expect(toggleChecklistItem(item)).toBe(true)
    expect(item.getAttribute('aria-checked')).toBe('true')
    expect(item.classList.contains('done')).toBe(true)

    toggleChecklistItem(item)
    expect(item.getAttribute('aria-checked')).toBe('false')

    expect(toggleChecklistItem(document.querySelector('p'))).toBe(false)
    expect(toggleChecklistItem(null)).toBe(false)
  })
})

describe('slugify', () => {
  it('lowercases, drops punctuation and joins words with hyphens', () => {
    expect(slugify('  RSVP: од покана до одговор! ')).toBe('rsvp-од-покана-до-одговор')
  })
})

describe('the article body on its way to the page', () => {
  it('keeps the design blocks through the second sanitizer', () => {
    const body = '<aside class="callout"><p>совет</p></aside><ul class="checklist"><li>а</li></ul>'
      + '<blockquote class="pullquote"><p>ц</p></blockquote>'
      + '<figure class="gallery"><img src="https://x/a.jpg" alt="а"><figcaption>п</figcaption></figure>'

    const rendered = renderPostBody(body)

    expect(rendered).toContain('<aside class="callout">')
    expect(rendered).toContain('<ul class="checklist">')
    expect(rendered).toContain('<blockquote class="pullquote">')
    expect(rendered).toContain('<img src="https://x/a.jpg" alt="а">')
  })

  it('still strips what the editor cannot make', () => {
    expect(renderPostBody('<figure><img src="x" onerror="steal()"></figure><script>1</script>'))
      .not.toMatch(/onerror|script/)
  })
})

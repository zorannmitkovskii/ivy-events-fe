import { describe, it, expect } from 'vitest'
import { renderPostBody, visibleText } from '@/utils/blogHtml'

/**
 * A blog post body on the reader's page (IVY-906).
 *
 * <p>The backend cleans a body before storing it; these pin the second lock —
 * that the page itself never renders what the editor cannot make — and that a
 * post written before the editor still reads as paragraphs.
 */

describe('renderPostBody', () => {
  it('keeps the formatting the editor makes', () => {
    const html = '<h2>Сала</h2><p><strong>Прво</strong> <em>гостите</em></p>'
      + '<ul><li>една</li></ul><ol><li>две</li></ol><blockquote><p>цитат</p></blockquote>'

    expect(renderPostBody(html)).toBe(html)
  })

  it('removes scripts, event handlers and script links but keeps their words', () => {
    const rendered = renderPostBody(
      '<p onclick="steal()">текст</p><script>alert(1)</script><a href="javascript:alert(1)">клик</a>',
    )

    expect(rendered).not.toMatch(/script|onclick|javascript/i)
    expect(rendered).toContain('текст')
    expect(rendered).toContain('клик')
  })

  it('keeps an ordinary link and its rel', () => {
    const html = '<p><a href="https://ivyevents.mk" rel="noopener nofollow">Ivy</a></p>'

    expect(renderPostBody(html)).toBe(html)
  })

  it('turns a plain-text post from before the editor into escaped paragraphs', () => {
    expect(renderPostBody('Прв ред\nвтор\n\na < b и 3 > 2')).toBe('<p>Прв ред<br>втор</p><p>a &lt; b и 3 &gt; 2</p>')
  })

  it('renders nothing for a post with no body', () => {
    expect(renderPostBody(null)).toBe('')
    expect(renderPostBody('')).toBe('')
  })
})

describe('visibleText', () => {
  it('keeps the words of neighbouring blocks apart, as a reader sees them', () => {
    expect(visibleText('<h2>Сала</h2><p>две</p><ul><li>една</li><li>три</li></ul>')).toBe('Сала две една три')
  })

  it('counts words, not markup', () => {
    expect(visibleText('<p><strong>две</strong>   зборови</p>')).toBe('две зборови')
    expect(visibleText('<p></p>')).toBe('')
    expect(visibleText(null)).toBe('')
  })
})

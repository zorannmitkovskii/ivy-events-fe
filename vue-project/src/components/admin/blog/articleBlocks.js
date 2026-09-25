import { Node, mergeAttributes } from '@tiptap/vue-3'

/**
 * The 2026 blog design's blocks, as editor nodes (tip, checklist, pull quote,
 * photo, photo strip).
 *
 * Each one writes exactly the HTML the backend safelist keeps
 * (`ContentHtml.java`) and reads it back, so a post saved and opened again
 * shows the same blocks. Told apart from the plain list and quote by a class,
 * with a higher parse priority than StarterKit's own rule for the same tag —
 * otherwise a saved checklist would reopen as an ordinary bullet list.
 */

const BEFORE_STARTER_KIT = 60

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML: () => [{ tag: 'aside', priority: BEFORE_STARTER_KIT }],
  renderHTML: ({ HTMLAttributes }) => ['aside', mergeAttributes(HTMLAttributes, { class: 'callout' }), 0],
})

export const Checklist = Node.create({
  name: 'checklist',
  group: 'block list',
  content: 'listItem+',
  parseHTML: () => [{ tag: 'ul.checklist', priority: BEFORE_STARTER_KIT }],
  renderHTML: ({ HTMLAttributes }) => ['ul', mergeAttributes(HTMLAttributes, { class: 'checklist' }), 0],
})

export const PullQuote = Node.create({
  name: 'pullquote',
  group: 'block',
  content: 'paragraph+',
  defining: true,
  parseHTML: () => [{ tag: 'blockquote.pullquote', priority: BEFORE_STARTER_KIT }],
  renderHTML: ({ HTMLAttributes }) => ['blockquote', mergeAttributes(HTMLAttributes, { class: 'pullquote' }), 0],
})

/**
 * A photo, or a strip of photos, with one caption. One unit in the editor:
 * the images and the caption are chosen together in the toolbar's form, and
 * changing them means replacing the block.
 */
export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: { default: [], rendered: false },
      caption: { default: '', rendered: false },
      gallery: { default: false, rendered: false },
    }
  },

  parseHTML() {
    return [{
      tag: 'figure',
      getAttrs: (element) => ({
        images: [...element.querySelectorAll('img')].map((image) => ({
          src: image.getAttribute('src'),
          alt: image.getAttribute('alt') || '',
        })),
        caption: element.querySelector('figcaption')?.textContent?.trim() || '',
        gallery: element.classList.contains('gallery'),
      }),
    }]
  },

  renderHTML({ node }) {
    const { images, caption, gallery } = node.attrs
    return [
      'figure',
      gallery ? { class: 'gallery' } : {},
      ...images.map((image) => ['img', { src: image.src, alt: image.alt || '' }]),
      ...(caption ? [['figcaption', {}, caption]] : []),
    ]
  },
})

export const ARTICLE_BLOCKS = [Callout, Checklist, PullQuote, Figure]

/** What each toolbar button inserts, given the texts to start from. */
export const insert = {
  callout(editor, { title, text }) {
    return editor.chain().focus().insertContent({
      type: 'callout',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: title, marks: [{ type: 'bold' }] }] },
        { type: 'paragraph', content: [{ type: 'text', text }] },
      ],
    }).run()
  },

  checklist(editor, { item }) {
    return editor.chain().focus().insertContent({
      type: 'checklist',
      content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }] }],
    }).run()
  },

  pullquote(editor, { text }) {
    return editor.chain().focus().insertContent({
      type: 'pullquote',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    }).run()
  },

  figure(editor, { images, caption, gallery }) {
    return editor.chain().focus().insertContent({
      type: 'figure',
      attrs: { images, caption: caption || '', gallery: Boolean(gallery) },
    }).run()
  },
}

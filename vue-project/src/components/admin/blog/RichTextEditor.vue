<template>
  <div class="rte">
    <!-- mousedown.prevent keeps focus and the selection in the text while a
         tool is clicked; otherwise the button takes focus, the editor gets it
         back a frame later, and the first letter typed after "H2" is lost. -->
    <div class="rte-bar" role="toolbar" :aria-label="t('adminBlog.editor.toolbar')">
      <button
        v-for="tool in TOOLS"
        :key="tool.key"
        type="button"
        class="rte-btn"
        :class="{ on: isActive(tool) }"
        :aria-pressed="isActive(tool)"
        :aria-label="t(`adminBlog.editor.${tool.key}`)"
        :title="t(`adminBlog.editor.${tool.key}`)"
        :disabled="!editor"
        @mousedown.prevent
        @click="tool.run(editor)"
      >{{ tool.glyph }}</button>

      <button
        type="button"
        class="rte-btn"
        :class="{ on: editor?.isActive('link') }"
        :aria-pressed="Boolean(editor?.isActive('link'))"
        :aria-expanded="linkOpen"
        :aria-label="t('adminBlog.editor.link')"
        :title="t('adminBlog.editor.link')"
        :disabled="!editor"
        @mousedown.prevent
        @click="openLink"
      >🔗</button>

      <!-- The 2026 article blocks: a tip, a checklist, a pull quote, and a
           photo or a strip of photos with a caption. -->
      <span class="rte-sep" aria-hidden="true"></span>
      <button
        v-for="block in BLOCKS"
        :key="block.key"
        type="button"
        class="rte-btn"
        :class="{ on: editor?.isActive(block.node) }"
        :aria-label="t(`adminBlog.editor.${block.key}`)"
        :title="t(`adminBlog.editor.${block.key}`)"
        :disabled="!editor"
        @mousedown.prevent
        @click="insertBlock(block.key)"
      >{{ block.glyph }}</button>
      <button
        v-for="kind in MEDIA"
        :key="kind.key"
        type="button"
        class="rte-btn"
        :aria-label="t(`adminBlog.editor.${kind.key}`)"
        :title="t(`adminBlog.editor.${kind.key}`)"
        :aria-expanded="mediaOpen === kind.key"
        :disabled="!editor"
        @mousedown.prevent
        @click="openMedia(kind.key)"
      >{{ kind.glyph }}</button>
    </div>

    <!-- Photos are uploaded like the cover and placed as one block with their
         caption. The alt text is asked for here because nobody adds it later. -->
    <form v-if="mediaOpen" class="rte-link rte-media" @submit.prevent="applyMedia">
      <input
        ref="mediaInput"
        type="file"
        accept="image/*"
        :multiple="mediaOpen === 'gallery'"
        :aria-label="t('adminBlog.editor.mediaFiles')"
        @change="onMediaFiles"
      />
      <input v-model="mediaAlt" type="text" maxlength="160" :placeholder="t('adminBlog.editor.mediaAlt')" :aria-label="t('adminBlog.editor.mediaAlt')" />
      <input v-model="mediaCaption" type="text" maxlength="200" :placeholder="t('adminBlog.editor.mediaCaption')" :aria-label="t('adminBlog.editor.mediaCaption')" />
      <button type="submit" class="btn btn-primary btn-sm" :disabled="uploading || !mediaFiles.length">
        {{ uploading ? t('adminBlog.editor.mediaUploading') : t('adminBlog.editor.mediaInsert') }}
      </button>
      <button type="button" class="btn btn-ghost btn-sm" @click="closeMedia">{{ t('adminBlog.editor.mediaCancel') }}</button>
      <small v-if="mediaError" class="rte-error" role="alert">{{ mediaError }}</small>
    </form>

    <!-- Inline rather than window.prompt: a browser dialog blocks the page and
         cannot say why an address was not accepted. -->
    <form v-if="linkOpen" class="rte-link" @submit.prevent="applyLink">
      <input
        ref="linkInput"
        v-model="linkUrl"
        type="url"
        inputmode="url"
        :aria-label="t('adminBlog.editor.linkUrl')"
        :placeholder="t('adminBlog.editor.linkUrl')"
      />
      <button type="submit" class="btn btn-primary btn-sm">{{ t('adminBlog.editor.linkApply') }}</button>
      <button v-if="editor?.isActive('link')" type="button" class="btn btn-ghost btn-sm" @click="removeLink">
        {{ t('adminBlog.editor.linkRemove') }}
      </button>
    </form>

    <EditorContent :editor="editor" class="rte-body" />
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { ARTICLE_BLOCKS, insert } from '@/components/admin/blog/articleBlocks'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'

/**
 * The blog post body editor (IVY-906).
 *
 * Offers exactly what the backend keeps — headings two and three, bold,
 * italic, both lists, quotes and links, and the 2026 design's blocks (tip,
 * checklist, pull quote, photo, photo strip — `articleBlocks.js`).
 * StarterKit's other marks and nodes are switched off rather than left in:
 * text formatted with a tool the server then strips looks right in the editor
 * and wrong on the site.
 */
const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
})

const LINK_PROTOCOLS = ['http', 'https', 'mailto']
const HAS_PROTOCOL = /^(https?:|mailto:)/i

const TOOLS = [
  { key: 'h2', glyph: 'H2', mark: ['heading', { level: 2 }], run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { key: 'h3', glyph: 'H3', mark: ['heading', { level: 3 }], run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { key: 'bold', glyph: 'B', mark: ['bold'], run: (e) => e.chain().focus().toggleBold().run() },
  { key: 'italic', glyph: 'I', mark: ['italic'], run: (e) => e.chain().focus().toggleItalic().run() },
  { key: 'bulletList', glyph: '•', mark: ['bulletList'], run: (e) => e.chain().focus().toggleBulletList().run() },
  { key: 'orderedList', glyph: '1.', mark: ['orderedList'], run: (e) => e.chain().focus().toggleOrderedList().run() },
  { key: 'blockquote', glyph: '❝', mark: ['blockquote'], run: (e) => e.chain().focus().toggleBlockquote().run() },
]

/** The design's blocks, inserted with starter text the editor then overwrites. */
const BLOCKS = [
  { key: 'callout', glyph: '💡', node: 'callout' },
  { key: 'checklist', glyph: '☑', node: 'checklist' },
  { key: 'pullquote', glyph: '❞', node: 'pullquote' },
]
/** A strip is two photos side by side in the design; more wrap onto a row. */
const MEDIA = [
  { key: 'figure', glyph: '🖼' },
  { key: 'gallery', glyph: '▦' },
]
const MAX_GALLERY_IMAGES = 4

const { t } = useI18n()

const mediaOpen = ref(null)
const mediaFiles = ref([])
const mediaAlt = ref('')
const mediaCaption = ref('')
const mediaError = ref('')
const uploading = ref(false)
const mediaInput = ref(null)

const linkOpen = ref(false)
const linkUrl = ref('')
const linkInput = ref(null)

const editor = useEditor({
  content: model.value,
  extensions: [
    ...ARTICLE_BLOCKS,
    StarterKit.configure({
      heading: { levels: [2, 3] },
      code: false,
      codeBlock: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      link: {
        openOnClick: false,
        autolink: true,
        protocols: LINK_PROTOCOLS,
        HTMLAttributes: { rel: 'noopener nofollow', target: null },
      },
    }),
  ],
  editorProps: {
    attributes: { 'aria-label': props.label, 'aria-multiline': 'true', role: 'textbox' },
  },
  onUpdate: ({ editor: current }) => {
    model.value = htmlOf(current)
  },
})

/** An empty document is an empty body, not `<p></p>` that counts as written. */
function htmlOf(current) {
  return current.isEmpty ? '' : current.getHTML()
}

// Switching language tabs puts different text into the same editor.
watch(model, (html) => {
  const current = editor.value
  if (!current || html === htmlOf(current)) return
  current.commands.setContent(html || '', { emitUpdate: false })
})

function isActive(tool) {
  return Boolean(editor.value?.isActive(...tool.mark))
}

async function openLink() {
  linkUrl.value = editor.value?.getAttributes('link').href || ''
  linkOpen.value = true
  await nextTick()
  linkInput.value?.focus()
}

function applyLink() {
  const typed = linkUrl.value.trim()
  if (!typed) {
    removeLink()
    return
  }
  const href = HAS_PROTOCOL.test(typed) ? typed : `https://${typed}`
  editor.value.chain().focus().extendMarkRange('link').setLink({ href }).run()
  linkOpen.value = false
}

function removeLink() {
  editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
  linkOpen.value = false
}

function insertBlock(key) {
  const starters = {
    callout: { title: t('adminBlog.editor.calloutTitle'), text: t('adminBlog.editor.calloutText') },
    checklist: { item: t('adminBlog.editor.checklistItem') },
    pullquote: { text: t('adminBlog.editor.pullquoteText') },
  }
  insert[key](editor.value, starters[key])
}

async function openMedia(kind) {
  mediaOpen.value = kind
  mediaFiles.value = []
  mediaAlt.value = ''
  mediaCaption.value = ''
  mediaError.value = ''
  await nextTick()
  mediaInput.value?.focus()
}

function closeMedia() {
  mediaOpen.value = null
}

function onMediaFiles(event) {
  const limit = mediaOpen.value === 'gallery' ? MAX_GALLERY_IMAGES : 1
  mediaFiles.value = [...(event.target.files || [])].slice(0, limit)
}

async function applyMedia() {
  uploading.value = true
  mediaError.value = ''
  try {
    const images = []
    for (const file of mediaFiles.value) {
      const uploaded = await contentService.uploadImage(file)
      const url = (uploaded?.data ?? uploaded)?.url
      if (url) images.push({ src: url, alt: mediaAlt.value.trim() })
    }
    if (images.length) {
      insert.figure(editor.value, { images, caption: mediaCaption.value.trim(), gallery: mediaOpen.value === 'gallery' })
    }
    closeMedia()
  } catch (failure) {
    mediaError.value = getErrorMessage(failure)
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.rte {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  overflow: hidden;
}

.rte:focus-within {
  border-color: var(--ivy);
}

.rte-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px;
  border-bottom: 1px solid var(--line);
  background: var(--mist-2);
}

.rte-btn {
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-2);
  font-weight: 600;
}

.rte-btn:hover:not(:disabled) {
  border-color: var(--line);
  background: var(--card);
}

.rte-btn.on {
  border-color: var(--ivy);
  background: var(--card);
  color: var(--ink);
}

.rte-link {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--line);
}

.rte-link input {
  flex: 1;
  min-width: 200px;
}

.rte-sep {
  width: 1px;
  margin: 4px 4px;
  background: var(--line);
}

.rte-error {
  flex-basis: 100%;
  color: var(--danger, #b3261e);
}

.rte-body :deep(.ProseMirror aside.callout) {
  margin: 0 0 0.8em;
  padding: 12px 16px;
  border-left: 3px solid var(--moss);
  background: var(--mist);
  border-radius: 0 8px 8px 0;
}

.rte-body :deep(.ProseMirror ul.checklist) {
  list-style: '☐  ';
}

.rte-body :deep(.ProseMirror blockquote.pullquote) {
  border-left: 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  padding: 12px 0;
  font-size: 1.3rem;
}

.rte-body :deep(.ProseMirror figure) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 0.8em;
}

.rte-body :deep(.ProseMirror figure img) {
  max-height: 180px;
  max-width: 100%;
  border-radius: 8px;
}

.rte-body :deep(.ProseMirror figure figcaption) {
  flex-basis: 100%;
  font-size: 13px;
  color: var(--ink-3);
}

.rte-body :deep(.ProseMirror figure.ProseMirror-selectednode) {
  outline: 2px solid var(--ivy);
}

.rte-body :deep(.ProseMirror) {
  min-height: 320px;
  padding: 16px 18px;
  outline: none;
  line-height: 1.6;
}

.rte-body :deep(.ProseMirror h2) {
  margin: 1.1em 0 0.4em;
  font-size: 1.45rem;
}

.rte-body :deep(.ProseMirror h3) {
  margin: 1em 0 0.35em;
  font-size: 1.2rem;
}

.rte-body :deep(.ProseMirror p) {
  margin: 0 0 0.8em;
}

.rte-body :deep(.ProseMirror ul),
.rte-body :deep(.ProseMirror ol) {
  margin: 0 0 0.8em;
  padding-left: 1.4em;
}

.rte-body :deep(.ProseMirror blockquote) {
  margin: 0 0 0.8em;
  padding-left: 14px;
  border-left: 3px solid var(--gold);
  color: var(--ink-2);
}

.rte-body :deep(.ProseMirror a) {
  color: var(--ivy);
  text-decoration: underline;
}
</style>

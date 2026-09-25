<template>
  <div class="blog-editor">
    <PageHead :title="heading" :subtitle="t('adminBlog.editorPage.subtitle')">
      <template #actions>
        <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'admin.blog', params: { lang } }">
          {{ t('adminBlog.editorPage.back') }}
        </RouterLink>
        <RouterLink v-if="liveLink" class="btn btn-ghost btn-sm" :to="liveLink" target="_blank">
          {{ t('adminBlog.editorPage.viewLive') }}
        </RouterLink>
        <button type="button" class="btn btn-primary btn-sm" :disabled="saving || !canSave" @click="save">
          {{ saving ? t('adminBlog.editorPage.saving') : t('adminBlog.editorPage.save') }}
        </button>
      </template>
    </PageHead>

    <p v-if="loading" class="empty">{{ t('adminBlog.editorPage.loading') }}</p>

    <p v-else-if="loadError" class="empty" role="alert">{{ loadError }}</p>

    <template v-else>
      <p v-if="error" class="notice bad" role="alert">{{ error }}</p>
      <p v-if="notice" class="notice good" role="status">{{ notice }}</p>
      <p v-if="post.archivedAt" class="notice warn">{{ t('adminBlog.editorPage.archivedNotice') }}</p>

      <div class="editor-grid">
        <section class="card editor-main">
          <div class="locale-tabs" role="tablist" :aria-label="t('adminBlog.editorPage.languages')">
            <button
              v-for="code in LOCALES"
              :key="code"
              type="button"
              role="tab"
              class="locale-tab"
              :aria-selected="activeLocale === code"
              @click="activeLocale = code"
            >
              <b>{{ t(`adminBlog.locales.${code}`) }}</b>
              <span v-if="variantOf(code)" class="chip" :class="toneFor(variantOf(code).status)">
                {{ t(`adminBlog.status.${variantOf(code).status}`) }}
              </span>
              <span v-else class="chip">{{ t('adminBlog.editorPage.notWritten') }}</span>
              <span v-if="errorCount(code)" class="chip no">{{ t('adminBlog.list.seoErrors', { n: errorCount(code) }) }}</span>
              <span v-if="isDirty(code)" class="unsaved">{{ t('adminBlog.editorPage.unsaved') }}</span>
            </button>
          </div>

          <label class="field">
            <span>{{ t('adminBlog.fields.title') }}</span>
            <input v-model="form.title" type="text" maxlength="200" />
            <SeoIssueList :issues="issuesFor('title')" compact />
          </label>

          <label class="field">
            <span>{{ t('adminBlog.seo.keyword') }}</span>
            <input v-model="form.focusKeyword" type="text" maxlength="80" />
            <small class="hint">{{ t('adminBlog.seo.keywordHint') }}</small>
            <SeoIssueList :issues="issuesFor('focusKeyword')" compact />
          </label>

          <label class="field">
            <span>{{ t('adminBlog.fields.excerpt') }}</span>
            <textarea v-model="form.excerpt" rows="2" maxlength="400"></textarea>
            <SeoIssueList :issues="issuesFor('excerpt')" compact />
          </label>

          <label v-if="post.layout !== 'PRODUCT'" class="field">
            <span>{{ t('adminBlog.fields.heroCaption') }}</span>
            <input v-model="form.heroCaption" type="text" maxlength="200" />
          </label>

          <div class="field">
            <span>{{ t('adminBlog.fields.body') }}</span>
            <RichTextEditor v-model="form.body" :label="t('adminBlog.fields.body')" />
            <small class="hint">{{ t('adminBlog.fields.bodyCount', { n: bodyWords }) }}</small>
            <SeoIssueList :issues="issuesFor('body')" compact />
          </div>

          <details class="seo" :open="activeErrors.length > 0">
            <summary>
              {{ t('adminBlog.seo.title') }}
              <span v-if="activeVariant" class="summary-counts">
                {{ t('adminBlog.seo.summary', { errors: activeErrors.length, warnings: activeIssues.length - activeErrors.length }) }}
              </span>
            </summary>

            <label class="field">
              <span>{{ t('adminBlog.seo.seoTitle') }}</span>
              <input v-model="form.seoTitle" type="text" maxlength="120" />
              <SeoIssueList :issues="issuesFor('seoTitle')" compact />
            </label>
            <label class="field">
              <span>{{ t('adminBlog.seo.seoDescription') }}</span>
              <textarea v-model="form.seoDescription" rows="2" maxlength="300"></textarea>
              <SeoIssueList :issues="issuesFor('seoDescription')" compact />
            </label>
            <label class="field">
              <span>{{ t('adminBlog.seo.canonical') }}</span>
              <input v-model="form.canonicalUrl" type="url" maxlength="500" />
            </label>

            <!-- What Google would show, from the last save: the server computes
                 the fallbacks, and guessing them here would drift from it. -->
            <div v-if="activeSeo" class="serp" :aria-label="t('adminBlog.seo.preview')">
              <span class="serp-url">{{ activeSeo.canonicalUrl }}</span>
              <b class="serp-title">{{ activeSeo.title }}</b>
              <span class="serp-description">{{ activeSeo.description }}</span>
            </div>

            <h3 class="issues-title">{{ t('adminBlog.seo.issuesTitle') }}</h3>
            <SeoIssueList :issues="activeIssues" />
            <p v-if="activeVariant && !activeIssues.length" class="hint">{{ t('adminBlog.seo.noWarnings') }}</p>
            <p class="hint">{{ t('adminBlog.seo.afterSave') }}</p>
          </details>
        </section>

        <aside class="editor-side">
          <section class="card">
            <h2>{{ t('adminBlog.publish.title') }}</h2>

            <template v-if="activeVariant">
              <p class="state">
                <span class="chip" :class="toneFor(activeVariant.status)">
                  {{ t(`adminBlog.status.${activeVariant.status}`) }}
                </span>
                <span v-if="activeVariant.status === 'SCHEDULED' && activeVariant.publishAt" class="hint">
                  {{ t('adminBlog.publish.scheduledFor', { date: when(activeVariant.publishAt) }) }}
                </span>
                <span v-else-if="activeVariant.publishedAt" class="hint">
                  {{ t('adminBlog.publish.publishedAt', { date: when(activeVariant.publishedAt) }) }}
                </span>
              </p>

              <p v-if="publishBlocker && canGoLive" class="hint blocker">{{ publishBlocker }}</p>

              <div class="actions">
                <button
                  v-for="next in immediateMoves"
                  :key="next"
                  type="button"
                  class="btn btn-sm"
                  :class="next === 'PUBLISHED' ? 'btn-primary' : 'btn-ghost'"
                  :disabled="moving || (next === 'PUBLISHED' && Boolean(publishBlocker))"
                  @click="move(next)"
                >{{ t(`adminBlog.publish.move.${next}`) }}</button>
              </div>

              <form v-if="nextStates.includes('SCHEDULED')" class="schedule" @submit.prevent="move('SCHEDULED')">
                <label class="field">
                  <span>{{ t('adminBlog.publish.scheduleAt') }}</span>
                  <input v-model="scheduleAt" type="datetime-local" :min="nowForInput" />
                </label>
                <button
                  type="submit"
                  class="btn btn-ghost btn-sm"
                  :disabled="moving || !scheduleAt || Boolean(publishBlocker)"
                >{{ t('adminBlog.publish.move.SCHEDULED') }}</button>
              </form>
            </template>

            <p v-else class="hint">{{ t('adminBlog.publish.saveFirst') }}</p>
          </section>

          <section class="card">
            <h2>{{ t('adminBlog.post.title') }}</h2>

            <label class="field">
              <span>{{ t('adminBlog.fields.category') }}</span>
              <select v-model="post.category">
                <option v-for="option in CATEGORIES" :key="option" :value="option">{{ t(`blog.category${option}`) }}</option>
              </select>
            </label>

            <label class="field">
              <span>{{ t('adminBlog.fields.layout') }}</span>
              <select v-model="post.layout" data-testid="layout-select">
                <option v-for="option in LAYOUTS" :key="option" :value="option">{{ t(`blog.layout.${option}`) }}</option>
              </select>
              <small class="hint">{{ t(`adminBlog.layoutHint.${post.layout}`) }}</small>
            </label>

            <label class="field field-check">
              <input v-model="post.featured" type="checkbox" data-testid="featured-toggle" />
              <span>{{ t('adminBlog.fields.featured') }}</span>
            </label>
            <small class="hint">{{ t('adminBlog.fields.featuredHint') }}</small>

            <label v-if="!isNew" class="field">
              <span>{{ t('adminBlog.fields.slug') }}</span>
              <input v-model="post.slug" type="text" maxlength="160" :aria-invalid="Boolean(slugError)" />
              <small v-if="slugError" class="field-error" role="alert">{{ slugError }}</small>
              <small v-else class="hint">/blog/{{ post.slug }}</small>
              <SeoIssueList :issues="issuesFor('slug')" compact />
            </label>

            <div class="field">
              <label :for="TAG_INPUT_ID">{{ t('adminBlog.fields.tags') }}</label>
              <TagInput v-model="post.tags" :input-id="TAG_INPUT_ID" :suggestions="knownTags" />
              <SeoIssueList :issues="issuesFor('tags')" compact />
            </div>

            <div class="field">
              <span>{{ t('adminBlog.fields.cover') }}</span>
              <CoverImageField v-model:image-key="post.heroImageKey" v-model:image-url="post.coverImage" />
              <SeoIssueList :issues="issuesFor('cover')" compact />
            </div>
          </section>

          <section v-if="!isNew" class="card">
            <h2>{{ t('adminBlog.links.title') }}</h2>
            <ul v-if="links.length" class="links">
              <li v-for="link in links" :key="link.linkId" :class="{ broken: !link.usable }">
                <span>{{ link.name }}</span>
                <small v-if="!link.usable" class="hint">{{ t('adminBlog.links.unusable') }}</small>
                <button type="button" class="link-remove" @click="removeLink(link)">{{ t('common.remove') }}</button>
              </li>
            </ul>
            <p v-else class="hint">{{ t('adminBlog.links.empty') }}</p>
          </section>

          <section v-if="!isNew" class="card">
            <h2>{{ t('adminBlog.takeDown.title') }}</h2>
            <!-- Two clicks, not a browser dialog: the second button names what
                 happens, and a dialog blocks the page. -->
            <div class="actions">
              <button v-if="!post.archivedAt" type="button" class="btn btn-ghost btn-sm" @click="takeDown('archive')">
                {{ confirming === 'archive' ? t('adminBlog.takeDown.confirmArchive') : t('adminBlog.takeDown.archive') }}
              </button>
              <button v-if="!post.firstPublishedAt" type="button" class="btn btn-ghost btn-sm danger" @click="takeDown('delete')">
                {{ confirming === 'delete' ? t('adminBlog.takeDown.confirmDelete') : t('adminBlog.takeDown.delete') }}
              </button>
              <button v-if="confirming" type="button" class="btn btn-ghost btn-sm" @click="confirming = ''">
                {{ t('adminBlog.takeDown.cancel') }}
              </button>
            </div>
            <p v-if="post.firstPublishedAt" class="hint">{{ t('adminBlog.takeDown.deleteBlocked') }}</p>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import RichTextEditor from '@/components/admin/blog/RichTextEditor.vue'
import TagInput from '@/components/admin/blog/TagInput.vue'
import CoverImageField from '@/components/admin/blog/CoverImageField.vue'
import SeoIssueList from '@/components/admin/blog/SeoIssueList.vue'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'
import { wordCount } from '@/utils/blogHtml'

/*
  One blog post, every language of it (IVY-906, IVY-907).

  Each language keeps its own unsaved draft, so moving between tabs loses
  nothing; Save writes the post and every language that changed. Publishing
  saves first and then reads the server's SEO findings for what was just saved:
  an error there stops it, so what goes live is what is on the screen and what
  the server would let through.
*/

const LOCALES = ['mk', 'en', 'sq']
const CATEGORIES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'VENUE', 'VENDOR', 'PLANNING']
const TAG_INPUT_ID = 'blog-post-tags'
const NOTICE_MS = 4000
const CONFLICT = 409

/** Mirrors `BlogService.TRANSITIONS`; the server still decides. */
const TRANSITIONS = {
  DRAFT: ['IN_REVIEW', 'SCHEDULED', 'PUBLISHED'],
  IN_REVIEW: ['DRAFT', 'SCHEDULED', 'PUBLISHED'],
  SCHEDULED: ['DRAFT', 'PUBLISHED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['PUBLISHED', 'DRAFT'],
}

const VARIANT_FIELDS = ['title', 'excerpt', 'body', 'heroCaption', 'seoTitle', 'seoDescription', 'canonicalUrl', 'socialImageKey', 'focusKeyword']

/** The three article designs (2026 blog). */
const LAYOUTS = ['GUIDE', 'INSPIRATION', 'PRODUCT']

const EMPTY_POST = {
  id: null,
  slug: '',
  category: 'WEDDING',
  tags: [],
  heroImageKey: '',
  coverImage: '',
  layout: 'GUIDE',
  featured: false,
  archivedAt: null,
  firstPublishedAt: null,
}

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang || 'mk')
const isNew = computed(() => !route.params.id)

const post = reactive({ ...EMPTY_POST, tags: [] })
const entries = ref([])
const drafts = reactive(Object.fromEntries(LOCALES.map((code) => [code, blankDraft()])))
const links = ref([])
const knownTags = ref([])
const activeLocale = ref('mk')
const scheduleAt = ref('')
const confirming = ref('')

const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const moving = ref(false)
const error = ref('')
const slugError = ref('')
const notice = ref('')

let noticeTimer = null

const form = computed(() => drafts[activeLocale.value])
const activeVariant = computed(() => variantOf(activeLocale.value))
const activeSeo = computed(() => entryOf(activeLocale.value)?.seo || null)
const activeIssues = computed(() => issuesOf(activeLocale.value))
const activeErrors = computed(() => activeIssues.value.filter(isError))
const bodyWords = computed(() => wordCount(form.value.body))
const nextStates = computed(() => (activeVariant.value ? TRANSITIONS[activeVariant.value.status] || [] : []))
const immediateMoves = computed(() => nextStates.value.filter((next) => next !== 'SCHEDULED'))
const canGoLive = computed(() => nextStates.value.includes('PUBLISHED') || nextStates.value.includes('SCHEDULED'))
const canSave = computed(() => LOCALES.some((code) => drafts[code].title.trim()))
const nowForInput = computed(() => toInputValue(new Date()))

const heading = computed(() => {
  if (isNew.value) return t('adminBlog.editorPage.newTitle')
  return form.value.title || firstSavedTitle() || t('adminBlog.list.untitled')
})

/**
 * Why publishing is not offered right now.
 *
 * Errors from the last save only count while nothing has changed since: an
 * editor who just fixed the title should be able to press Publish, which saves
 * and asks the server again.
 */
const publishBlocker = computed(() => {
  if (!form.value.title.trim()) return t('adminBlog.publish.needsTitle')
  if (!isDirty(activeLocale.value) && activeErrors.value.length) {
    return t('adminBlog.publish.fixErrors', { n: activeErrors.value.length })
  }
  return ''
})

const liveLink = computed(() => {
  if (post.archivedAt || activeVariant.value?.status !== 'PUBLISHED') return null
  return { name: 'BlogPost', params: { lang: lang.value, slug: post.slug }, query: { locale: activeLocale.value } }
})

onMounted(() => {
  load()
  loadKnownTags()
})
onBeforeUnmount(() => clearTimeout(noticeTimer))
watch(() => route.params.id, load)

// ── loading ─────────────────────────────────────────────────────────────

async function load() {
  confirming.value = ''
  if (isNew.value) {
    Object.assign(post, { ...EMPTY_POST, tags: [] })
    entries.value = []
    links.value = []
    fillDrafts()
    return
  }
  loading.value = true
  try {
    const [detail, audit] = await Promise.all([
      contentService.get(route.params.id),
      contentService.auditLinks(route.params.id),
    ])
    applyDetail(unwrap(detail))
    links.value = unwrap(audit) || []
    loadError.value = ''
  } catch (failure) {
    loadError.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

function applyDetail(detail) {
  const saved = detail.post
  Object.assign(post, {
    ...EMPTY_POST,
    ...saved,
    tags: saved.tags || [],
    heroImageKey: saved.heroImageKey || '',
    coverImage: saved.coverImage || '',
  })
  entries.value = detail.variants || []
  fillDrafts()
}

function fillDrafts() {
  for (const code of LOCALES) Object.assign(drafts[code], draftFrom(variantOf(code)))
}

/** Every tag there is (IVY-909), offered while typing. A convenience: failing
 *  to load them leaves the field working. */
async function loadKnownTags() {
  try {
    knownTags.value = (unwrap(await contentService.tags()) || []).map((tag) => tag.slug)
  } catch {
    knownTags.value = []
  }
}

// ── saving ──────────────────────────────────────────────────────────────

async function save() {
  resetMessages()
  saving.value = true
  try {
    if (isNew.value) {
      await createWithDrafts()
    } else {
      await contentService.updatePost(post.id, postChanges())
      await writeChangedDrafts(post.id)
      await load()
    }
    flash(t('adminBlog.editorPage.saved'))
    return true
  } catch (failure) {
    if (failure?.status === CONFLICT) {
      slugError.value = getErrorMessage(failure)
    } else {
      error.value = getErrorMessage(failure)
    }
    return false
  } finally {
    saving.value = false
  }
}

/** The post is created from the first title written, then the drafts and the
 *  cover follow it; the editor then moves to the post's own address. */
async function createWithDrafts() {
  const title = form.value.title.trim() || LOCALES.map((code) => drafts[code].title.trim()).find(Boolean)
  const created = unwrap(await contentService.createPost({ title, category: post.category, tags: post.tags, tagLocale: activeLocale.value }))
  post.id = created.id
  post.slug = created.slug
  await writeChangedDrafts(created.id)
  if (post.heroImageKey || post.layout !== 'GUIDE' || post.featured) {
    await contentService.updatePost(created.id, postChanges())
  }
  await router.replace({ name: 'admin.blog.edit', params: { lang: lang.value, id: created.id } })
}

/** A language with no title is not written: the server requires one, and a
 *  tab somebody never opened is not a translation. */
async function writeChangedDrafts(postId) {
  for (const code of LOCALES) {
    if (!drafts[code].title.trim() || !isDirty(code)) continue
    await contentService.writeVariant(postId, code, { ...drafts[code] })
  }
}

function postChanges() {
  return {
    slug: post.slug,
    category: post.category,
    tags: post.tags,
    heroImageKey: post.heroImageKey || null,
    layout: post.layout,
    featured: post.featured,
    // A tag typed here that does not exist yet is named in this tab's language.
    tagLocale: activeLocale.value,
  }
}

// ── the workflow ────────────────────────────────────────────────────────

async function move(next) {
  if (!(await save())) return
  const variant = activeVariant.value
  if (!variant) return

  // The findings are the ones for what was just saved. Stopping here says
  // which fields to fix; letting the server refuse would say only "422".
  const goingLive = next === 'PUBLISHED' || next === 'SCHEDULED'
  if (goingLive && activeErrors.value.length) {
    error.value = t('adminBlog.publish.fixErrors', { n: activeErrors.value.length })
    return
  }

  moving.value = true
  try {
    const publishAt = next === 'SCHEDULED' ? new Date(scheduleAt.value).toISOString() : null
    await contentService.moveStatus(variant.id, next, publishAt)
    await load()
    scheduleAt.value = ''
    flash(t(`adminBlog.publish.done.${next}`))
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    moving.value = false
  }
}

async function takeDown(action) {
  if (confirming.value !== action) {
    confirming.value = action
    return
  }
  confirming.value = ''
  resetMessages()
  try {
    if (action === 'archive') {
      await contentService.archive(post.id)
      await load()
      flash(t('adminBlog.takeDown.archived'))
      return
    }
    await contentService.remove(post.id)
    await router.push({ name: 'admin.blog', params: { lang: lang.value } })
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

async function removeLink(link) {
  try {
    await contentService.removeLink(link.linkId)
    links.value = unwrap(await contentService.auditLinks(post.id)) || []
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

// ── helpers ─────────────────────────────────────────────────────────────

function entryOf(code) {
  return entries.value.find((entry) => entry.variant.locale === code) || null
}

function variantOf(code) {
  return entryOf(code)?.variant || null
}

function issuesOf(code) {
  return entryOf(code)?.issues || []
}

/** The findings that belong beside one field of the active language. */
function issuesFor(field) {
  return activeIssues.value.filter((issue) => issue.field === field)
}

function isError(issue) {
  return issue.severity === 'ERROR'
}

function errorCount(code) {
  return issuesOf(code).filter(isError).length
}

function blankDraft() {
  return Object.fromEntries(VARIANT_FIELDS.map((field) => [field, '']))
}

function draftFrom(variant) {
  return Object.fromEntries(VARIANT_FIELDS.map((field) => [field, variant?.[field] || '']))
}

function isDirty(code) {
  const saved = draftFrom(variantOf(code))
  return VARIANT_FIELDS.some((field) => (drafts[code][field] || '') !== saved[field])
}

function firstSavedTitle() {
  return LOCALES.map((code) => variantOf(code)?.title).find(Boolean)
}

function unwrap(response) {
  return response?.data ?? response ?? null
}

function resetMessages() {
  error.value = ''
  slugError.value = ''
}

function flash(message) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    notice.value = ''
  }, NOTICE_MS)
}

const when = (iso) => new Date(iso).toLocaleString(locale.value)

/** `datetime-local` wants local time without a zone. */
function toInputValue(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function toneFor(state) {
  if (state === 'PUBLISHED') return 'ok'
  if (state === 'SCHEDULED' || state === 'IN_REVIEW') return 'wait'
  if (state === 'ARCHIVED') return 'no'
  return ''
}
</script>

<style scoped>
/* `.card`, `.chip` and the buttons are the design's, in `ivy/site.css` and
   `ivy/dash.css`. Local: the two-column editor, the language tabs, the fields
   and the search preview. */
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 1100px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
}

.editor-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-side h2 {
  margin: 0 0 12px;
  font-size: 18px;
}

.locale-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.locale-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  color: var(--ink-2);
}

.locale-tab[aria-selected='true'] {
  border-color: var(--ivy);
  color: var(--ink);
  box-shadow: inset 0 -2px 0 var(--ivy);
}

.unsaved {
  font-size: 12px;
  color: var(--gold-deep);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.field > span,
.field > label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-2);
}

.field-check {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.field-check + .hint {
  display: block;
  margin-bottom: 14px;
}

.hint {
  font-size: 13px;
  color: var(--ink-3);
}

.field-error {
  font-size: 13px;
  color: var(--danger, #b3261e);
}

.notice {
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
}

.notice.good {
  border-color: var(--moss);
}

.notice.bad {
  border-color: var(--danger, #b3261e);
  color: var(--danger, #b3261e);
}

.notice.warn {
  border-color: var(--gold);
}

.seo {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.seo summary {
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 12px;
}

.summary-counts {
  margin-left: 8px;
  font-weight: 400;
  font-size: 14px;
  color: var(--ink-3);
}

.issues-title {
  margin: 16px 0 0;
  font-size: 15px;
}

.serp {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--mist-2);
}

.serp-url {
  font-size: 13px;
  color: var(--moss);
  word-break: break-all;
}

.serp-title {
  font-size: 17px;
  color: var(--ivy);
}

.serp-description {
  font-size: 14px;
  color: var(--ink-2);
}

.state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
}

.blocker {
  margin: 0 0 10px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.schedule {
  margin-top: 14px;
}

.danger {
  color: var(--danger, #b3261e);
}

.links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.links li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.links li.broken span {
  text-decoration: line-through;
}

.link-remove {
  margin-left: auto;
  border: 0;
  background: none;
  color: var(--ink-2);
  text-decoration: underline;
}
</style>

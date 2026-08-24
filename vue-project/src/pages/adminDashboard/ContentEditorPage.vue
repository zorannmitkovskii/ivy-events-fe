<template>
  <div class="editor-page">
    <PageHeader :title="t('contentEditor.title')">
      <template #actions>
        <p class="sub">{{ t('contentEditor.subtitle') }}</p>
      </template>
    </PageHeader>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <div class="layout">
      <aside class="list">
        <form class="new-post" @submit.prevent="createPost">
          <input v-model="draftPost.title" type="text" :placeholder="t('contentEditor.newTitle')" required />
          <select v-model="draftPost.category" :aria-label="t('contentEditor.category')">
            <option v-for="option in CATEGORIES" :key="option" :value="option">
              {{ t(`blog.category${option}`) }}
            </option>
          </select>
          <button class="btn" type="submit" :disabled="!draftPost.title.trim()">
            {{ t('contentEditor.create') }}
          </button>
        </form>

        <ul>
          <li v-for="post in posts" :key="post.id"
              :class="{ active: selectedId === post.id }">
            <button class="post-btn" @click="select(post.id)">
              <span>{{ post.title }}</span>
              <span class="cat">{{ t(`blog.category${post.category}`) }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <section v-if="selectedId" class="detail">
        <nav class="locales">
          <button v-for="code in LOCALES" :key="code" class="chip"
                  :class="{ active: activeLocale === code }" @click="activeLocale = code">
            {{ code }}
            <span v-if="statusOf(code)" class="dot" :class="statusOf(code).toLowerCase()"></span>
          </button>
        </nav>

        <form class="variant" @submit.prevent="saveVariant">
          <label class="field">
            <span>{{ t('contentEditor.variantTitle') }}</span>
            <input v-model="variant.title" type="text" maxlength="200" required />
          </label>
          <label class="field">
            <span>{{ t('contentEditor.excerpt') }}</span>
            <textarea v-model="variant.excerpt" rows="2"></textarea>
          </label>
          <label class="field">
            <span>{{ t('contentEditor.body') }}</span>
            <textarea v-model="variant.body" rows="10"></textarea>
          </label>

          <fieldset class="seo-fields">
            <legend>{{ t('contentEditor.seo') }}</legend>
            <label class="field">
              <span>{{ t('contentEditor.seoTitle') }}</span>
              <input v-model="variant.seoTitle" type="text" maxlength="200" />
            </label>
            <label class="field">
              <span>{{ t('contentEditor.seoDescription') }}</span>
              <textarea v-model="variant.seoDescription" rows="2"></textarea>
            </label>
            <label class="field">
              <span>{{ t('contentEditor.canonical') }}</span>
              <input v-model="variant.canonicalUrl" type="url" />
            </label>
            <label class="field">
              <span>{{ t('contentEditor.socialImage') }}</span>
              <input v-model="variant.socialImageKey" type="text" />
            </label>
          </fieldset>

          <button class="btn" type="submit">{{ t('common.save') }}</button>
        </form>

        <!--
          The search result as it will actually appear, computed by the server
          so what an editor previews and what a crawler receives cannot drift.
          The fallbacks are the point: an empty SEO title is not an empty
          preview, it is the article title, and seeing that stops people
          duplicating it by hand.
        -->
        <section v-if="activeSeo" class="preview">
          <h3>{{ t('contentEditor.searchPreview') }}</h3>
          <div class="serp">
            <span class="url">{{ activeSeo.canonicalUrl }}</span>
            <span class="serp-title">{{ activeSeo.title }}</span>
            <span class="serp-desc">{{ activeSeo.description }}</span>
          </div>

          <p v-if="activeSeo.noindex" class="warn">{{ t('contentEditor.noindex') }}</p>

          <!-- Named problems, not a score. "Your SEO is 60% complete" is a
               number nobody can act on. -->
          <ul v-if="activeSeo.warnings?.length" class="warnings">
            <li v-for="warning in activeSeo.warnings" :key="warning">{{ warning }}</li>
          </ul>
          <p v-else class="ok">{{ t('contentEditor.noWarnings') }}</p>
        </section>

        <section class="workflow">
          <h3>{{ t('contentEditor.status') }}</h3>
          <p class="meta">{{ t(`contentEditor.state${currentStatus || 'DRAFT'}`) }}</p>
          <div class="actions">
            <button v-for="next in NEXT_STATES" :key="next" class="link-btn"
                    :disabled="!activeVariantId" @click="moveStatus(next)">
              {{ t(`contentEditor.move${next}`) }}
            </button>
            <input v-model="publishAt" type="datetime-local" :aria-label="t('contentEditor.publishAt')" />
          </div>
          <p class="hint">{{ t('contentEditor.publishHint') }}</p>
        </section>

        <!--
          Run before publishing rather than after. A link to a suspended vendor
          found by a reader is a link found too late.
        -->
        <section class="links">
          <h3>{{ t('contentEditor.links') }}</h3>
          <ul>
            <li v-for="link in links" :key="link.linkId" :class="{ broken: !link.usable }">
              <span>{{ link.name || link.targetId }}</span>
              <span class="badge">{{ link.targetType }}</span>
              <span v-if="!link.usable" class="badge warn">{{ t('contentEditor.unusable') }}</span>
              <button class="link-btn danger" @click="removeLink(link)">{{ t('common.remove') }}</button>
            </li>
          </ul>
          <EmptyState v-if="!links.length" tone="no-results" :title="t('contentEditor.noLinks')" />
        </section>
      </section>
    </div>
  </div>
</template>

<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'

const CATEGORIES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'VENUE', 'VENDOR', 'PLANNING']
const LOCALES = ['mk', 'en', 'sq']
/** ARCHIVED is reached from PUBLISHED and is not offered beside "publish" — the
 *  two sit one click apart otherwise. */
const NEXT_STATES = ['REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']

const { t } = useI18n()

const posts = ref([])
const selectedId = ref(null)
const activeLocale = ref('mk')
const previews = ref([])
const links = ref([])
const publishAt = ref('')
const error = ref('')

const draftPost = reactive({ title: '', category: 'WEDDING' })
const variant = reactive({
  title: '', excerpt: '', body: '',
  seoTitle: '', seoDescription: '', canonicalUrl: '', socialImageKey: '',
})

const activePreview = computed(() =>
  previews.value.find((entry) => entry.variant.locale === activeLocale.value) || null)

const activeSeo = computed(() => activePreview.value?.seo || null)
const activeVariantId = computed(() => activePreview.value?.variant?.id || null)
const currentStatus = computed(() => activePreview.value?.variant?.status || null)

const statusOf = (code) =>
  previews.value.find((entry) => entry.variant.locale === code)?.variant?.status || null

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(loadPosts)
watch(activeLocale, fillVariantFromPreview)

async function loadPosts() {
  try {
    posts.value = unwrap(await contentService.posts()) || []
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

async function createPost() {
  try {
    const created = unwrap(await contentService.createPost({
      title: draftPost.title.trim(),
      category: draftPost.category,
    }))
    draftPost.title = ''
    await loadPosts()
    if (created) await select(created.id)
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

async function select(postId) {
  selectedId.value = postId
  await Promise.all([loadPreview(), loadLinks()])
  fillVariantFromPreview()
}

async function loadPreview() {
  try {
    previews.value = unwrap(await contentService.preview(selectedId.value)) || []
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

async function loadLinks() {
  try {
    links.value = unwrap(await contentService.auditLinks(selectedId.value)) || []
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

/** Blanks rather than the other language's text when a locale has no variant:
 *  prefilling a translation with the original is how untranslated copy ships. */
function fillVariantFromPreview() {
  const found = activePreview.value?.variant
  variant.title = found?.title || ''
  variant.excerpt = found?.excerpt || ''
  variant.body = found?.body || ''
  variant.seoTitle = found?.seoTitle || ''
  variant.seoDescription = found?.seoDescription || ''
  variant.canonicalUrl = found?.canonicalUrl || ''
  variant.socialImageKey = found?.socialImageKey || ''
}

async function saveVariant() {
  try {
    await contentService.writeVariant(selectedId.value, activeLocale.value, { ...variant })
    await loadPreview()
    error.value = ''
  } catch (failure) {
    await loadPreview()
    error.value = getErrorMessage(failure)
  }
}

async function moveStatus(next) {
  try {
    await contentService.moveStatus(activeVariantId.value, next,
      next === 'SCHEDULED' && publishAt.value ? new Date(publishAt.value).toISOString() : null)
    await loadPreview()
    error.value = ''
  } catch (failure) {
    await loadPreview()
    error.value = getErrorMessage(failure)
  }
}

async function removeLink(link) {
  try {
    await contentService.removeLink(link.linkId)
    await loadLinks()
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}
</script>

<style scoped>
.editor-page { padding: 1.5rem; }
.page-head h1 { margin: 0; font-size: 1.5rem; }
.sub { color: #666; margin: 0.25rem 0 1rem; }
.error { color: #b3261e; }
.layout { display: grid; grid-template-columns: minmax(200px, 260px) 1fr; gap: 1.5rem; align-items: start; }
.new-post { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
.list ul { list-style: none; padding: 0; margin: 0; }
.post-btn { display: flex; flex-direction: column; align-items: flex-start; width: 100%; text-align: left; background: none; border: 0; border-bottom: 1px solid #eee; padding: 0.5rem 0; cursor: pointer; }
.list li.active .post-btn { color: var(--brand); font-weight: 600; }
.cat { font-size: 0.72rem; color: #999; }
.locales { display: flex; gap: 0.4rem; margin-bottom: 0.75rem; }
.chip { border: 1px solid #ddd; background: #fff; border-radius: 999px; padding: 0.25rem 0.7rem; cursor: pointer; text-transform: uppercase; font-size: 0.8rem; }
.chip.active { background: var(--brand); color: #fff; border-color: var(--brand); }
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #bbb; margin-left: 0.3rem; }
.dot.published { background: #4c9a55; }
.dot.scheduled { background: #d8a13a; }
.dot.archived { background: #999; }
.variant { display: flex; flex-direction: column; gap: 0.6rem; }
.field { display: flex; flex-direction: column; gap: 0.2rem; font-size: 0.85rem; }
.field input, .field textarea, .new-post input, .new-post select { padding: 0.4rem 0.55rem; border: 1px solid #ddd; border-radius: 6px; font: inherit; }
.seo-fields { border: 1px solid #eee; border-radius: 8px; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
.seo-fields legend { font-size: 0.85rem; color: #666; }
.preview, .workflow, .links { margin-top: 1.5rem; }
.preview h3, .workflow h3, .links h3 { font-size: 1rem; margin: 0 0 0.5rem; }
.serp { display: flex; flex-direction: column; background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 0.75rem; }
.url { font-size: 0.78rem; color: #3c7d3c; }
.serp-title { color: #1a0dab; font-size: 1.05rem; }
.serp-desc { color: #4d5156; font-size: 0.88rem; }
.warn { color: #8a5300; }
.warnings { color: #8a5300; font-size: 0.88rem; }
.ok { color: #4c9a55; font-size: 0.88rem; }
.meta { color: #555; font-size: 0.9rem; }
.hint { color: #777; font-size: 0.82rem; }
.actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
.links ul { list-style: none; padding: 0; }
.links li { display: flex; gap: 0.5rem; align-items: center; padding: 0.25rem 0; }
.links li.broken { color: #8a5300; }
.badge { font-size: 0.72rem; padding: 0.1rem 0.4rem; border-radius: 4px; background: #eee; }
.badge.warn { background: #f6e6c8; }
.btn { padding: 0.45rem 0.9rem; border: 0; border-radius: 6px; background: var(--brand); color: #fff; cursor: pointer; }
.link-btn { background: none; border: 0; color: var(--brand); cursor: pointer; padding: 0; font-size: 0.85rem; }
.link-btn.danger { color: #b3261e; }
.link-btn:disabled { color: #bbb; cursor: default; }
</style>

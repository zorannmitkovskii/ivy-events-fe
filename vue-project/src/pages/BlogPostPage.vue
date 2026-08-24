<template>
  <article v-if="post" class="post-page">
    <nav class="crumbs">
      <router-link to="/blog">{{ t('blog.title') }}</router-link>
      <span> / </span>
      <router-link :to="`/inspiration/${post.category.toLowerCase()}`">
        {{ t(`blog.category${post.category}`) }}
      </router-link>
    </nav>

    <h1>{{ post.title }}</h1>

    <p class="meta">
      <span v-if="post.authorName">{{ post.authorName }}</span>
      <time v-if="post.publishedAt"> · {{ day(post.publishedAt) }}</time>
    </p>

    <!--
      Only locales that are actually published. A language switcher that offers
      a translation nobody wrote sends the reader to a 404 and a search engine
      to a dead alternate.
    -->
    <p v-if="post.otherLocales?.length" class="locales">
      <span>{{ t('blog.alsoIn') }}</span>
      <router-link
        v-for="other in post.otherLocales"
        :key="other"
        :to="{ path: `/blog/${post.slug}`, query: { locale: other } }"
      >{{ other }}</router-link>
    </p>

    <div class="body" v-html="rendered"></div>

    <!--
      Only usable targets. A suspended vendor stays in the record but is not put
      in front of a reader, and the audit that decides that runs on the server
      rather than here.
    -->
    <aside v-if="usableLinks.length" class="related">
      <h2>{{ t('blog.related') }}</h2>
      <ul>
        <li v-for="link in usableLinks" :key="link.linkId">
          <a :href="link.path" @click="onRelatedClick(link)">{{ link.name }}</a>
        </li>
      </ul>
    </aside>
  </article>

  <EmptyState v-else-if="missing" tone="no-results" :title="t('blog.notFound')" />
  <p v-else-if="error" class="error" role="alert">{{ error }}</p>
</template>

<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'
import { track } from '@/composables/useContentJourney'
import { applySeo } from '@/composables/useDocumentSeo'

const { t, locale } = useI18n()
const route = useRoute()

const post = ref(null)
const error = ref('')
/** Distinct from an error: a slug with no published variant in this language is
 *  an answer, not a failure. */
const missing = ref(false)

const usableLinks = computed(() => (post.value?.related || []).filter((link) => link.usable))

/** Paragraphs from a plain-text body. The backend stores Markdown-ish prose and
 *  escapes it; splitting on blank lines is the whole of the formatting. */
const rendered = computed(() => (post.value?.body || '')
  .split(/\n{2,}/)
  .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
  .join(''))

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const day = (iso) => new Date(iso).toLocaleDateString()

onMounted(load)
watch(() => [route.params.slug, route.query.locale, locale.value], load)

async function load() {
  post.value = null
  missing.value = false
  try {
    const detail = post.value = unwrap(await contentService.read(
      route.params.slug, route.query.locale || locale.value))
    error.value = ''
    if (detail?.seo) applySeo(detail.seo)
    if (detail) {
      track('CONTENT_VIEW', {
        category: detail.category,
        locale: detail.locale,
      })
    }
  } catch (failure) {
    if (failure?.status === 404) {
      missing.value = true
      return
    }
    error.value = getErrorMessage(failure)
  }
}

function unwrap(response) {
  return response?.data ?? response ?? null
}

/** Fired before the browser follows the link; the tracker never blocks it. */
function onRelatedClick(link) {
  if (link.targetType === 'VENDOR') {
    track('VENDOR_CLICK', { category: post.value?.category, locale: post.value?.locale })
  }
}
</script>

<style scoped>
.post-page { padding: 2rem 1.5rem; max-width: 720px; margin: 0 auto; }
.crumbs { font-size: 0.85rem; color: #777; margin-bottom: 0.75rem; }
.crumbs a { color: var(--brand); text-decoration: none; }
h1 { margin: 0 0 0.35rem; font-size: 1.9rem; line-height: 1.2; }
.meta { color: #888; font-size: 0.88rem; margin: 0 0 1rem; }
.locales { font-size: 0.85rem; display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.locales a { color: var(--brand); text-transform: uppercase; }
.body { line-height: 1.65; }
.body :deep(p) { margin: 0 0 1rem; }
.related { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; }
.related h2 { font-size: 1rem; }
.related ul { list-style: none; padding: 0; }
.related a { color: var(--brand); }
.error { padding: 2rem; color: #b3261e; }
</style>

<template>
  <SitePage>
    <template v-if="post">
      <section class="page-hero" style="padding-bottom: 0">
        <div class="wrap">
          <nav class="breadcrumb" :aria-label="$t('a11y.breadcrumb')">
            <router-link :to="`/${lang}`">{{ t('header.menu.home') }}</router-link>
            <span aria-hidden="true">/</span>
            <router-link :to="{ name: 'Blog', params: { lang } }">{{ t('blog.title') }}</router-link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{{ categoryLabel }}</span>
          </nav>

          <div class="article-head">
            <h1>{{ post.title }}</h1>
            <div class="meta">
              <span v-if="categoryLabel" class="tag">{{ categoryLabel }}</span>
              <span v-if="post.readingMinutes">{{ t('home.blog.minutes', { n: post.readingMinutes }) }}</span>
              <span v-if="post.publishedAt">{{ day(post.publishedAt) }}</span>
              <span v-if="post.authorName">{{ t('blog.byAuthor', { name: post.authorName }) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section" style="padding-top: 0">
        <div class="wrap">
          <div class="article-cover" :class="tint">
            <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" />
            <PostGlyph v-else :seed="glyphSeed" />
          </div>

          <div class="article">
            <div>
              <div class="prose" v-html="rendered"></div>

              <!--
                Only locales that are actually published. A language switcher
                offering a translation nobody wrote sends the reader to a 404
                and a search engine to a dead alternate.
              -->
              <p v-if="post.otherLocales?.length" class="share">
                <span>{{ t('blog.alsoIn') }}</span>
                <router-link
                  v-for="other in post.otherLocales"
                  :key="other"
                  :to="{ name: 'BlogPost', params: { lang, slug: post.slug }, query: { locale: other } }"
                >{{ other.toUpperCase() }}</router-link>
              </p>

              <div v-if="post.authorName" class="author">
                <span class="av">{{ authorInitials }}</span>
                <div>
                  <b>{{ post.authorName }}</b>
                  <span>{{ t('blog.authorRole') }}</span>
                </div>
              </div>
            </div>

            <aside class="toc">
              <!--
                Only usable targets. A suspended vendor stays in the record but
                is not put in front of a reader, and the audit that decides
                that runs on the server rather than here.
              -->
              <template v-if="usableLinks.length">
                <b>{{ t('blog.related') }}</b>
                <ol>
                  <li v-for="link in usableLinks" :key="link.linkId">
                    <a :href="link.path" @click="onRelatedClick(link)">{{ link.name }}</a>
                  </li>
                </ol>
              </template>

              <div class="cta">
                {{ t('blog.ctaText') }}
                <router-link class="btn btn-primary btn-sm" :to="{ name: 'signup', params: { lang } }">
                  {{ t('header.actions.createInvitation') }}
                </router-link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </template>

    <section v-else-if="missing" class="section">
      <div class="wrap"><p class="empty">{{ t('blog.notFound') }}</p></div>
    </section>

    <section v-else-if="error" class="section">
      <div class="wrap"><p class="empty" role="alert">{{ error }}</p></div>
    </section>
  </SitePage>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import SitePage from '@/layouts/SitePage.vue'
import PostGlyph from '@/components/landingPage/PostGlyph.vue'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'
import { track } from '@/composables/useContentJourney'
import { applySeo } from '@/composables/useDocumentSeo'

const COVER_TINTS = ['c-sage', 'c-sand', 'c-rose', 'c-sky', 'c-night']

const { t, locale } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const post = ref(null)
const error = ref('')
/** Distinct from an error: a slug with no published variant in this language is
 *  an answer, not a failure. */
const missing = ref(false)

const usableLinks = computed(() => (post.value?.related || []).filter((link) => link.usable))

/*
  The cover artwork is picked from the slug rather than from a list position,
  because an article has no position here — and the same article has to keep
  the same drawing it had on the blog index.
*/
const glyphSeed = computed(() => {
  const slug = post.value?.slug || ''
  let sum = 0
  for (const char of slug) sum += char.charCodeAt(0)
  return sum
})

const tint = computed(() => COVER_TINTS[glyphSeed.value % COVER_TINTS.length])

const categoryLabel = computed(() => {
  if (!post.value?.category) return ''
  const key = `blog.category${post.value.category}`
  const label = t(key)
  return label === key ? '' : label
})

const authorInitials = computed(() =>
  (post.value?.authorName || '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2),
)

/** Paragraphs from a plain-text body. The backend stores Markdown-ish prose and
 *  escapes it; splitting on blank lines is the whole of the formatting. */
const rendered = computed(() =>
  (post.value?.body || '')
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join(''),
)

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const day = (iso) => new Date(iso).toLocaleDateString(locale.value)

onMounted(load)
watch(() => [route.params.slug, route.query.locale, locale.value], load)

async function load() {
  post.value = null
  missing.value = false
  try {
    const detail = (post.value = unwrap(
      await contentService.read(route.params.slug, route.query.locale || locale.value),
    ))
    error.value = ''
    if (detail?.seo) applySeo(detail.seo)
    if (detail) {
      track('CONTENT_VIEW', { category: detail.category, locale: detail.locale })
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
/* `.article`, `.article-head`, `.article-cover`, `.prose` and `.toc` are the
   design's, in `ivy/site.css`. The cover photograph is what the mockup has no
   version of — its covers are all drawings. */
.article-cover {
  position: relative;
  overflow: hidden;
}

.article-cover img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>

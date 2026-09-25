<template>
  <SitePage>
    <article v-if="post" class="bl-article" :class="`bl-${layoutClass}`">
      <!-- The head. The product article sits on a tinted band with a drawing
           of the app; the other two open on a photograph. -->
      <component :is="layout === 'PRODUCT' ? 'section' : 'div'" :class="{ 'bl-product-hero': layout === 'PRODUCT' }">
        <div class="wrap">
          <nav class="bl-crumb" :aria-label="t('a11y.breadcrumb')">
            <router-link :to="{ name: 'Blog', params: { lang } }">← {{ t('blog.title') }}</router-link>
            <template v-if="categoryLabel">
              <span aria-hidden="true">/</span>
              <router-link :to="{ name: 'Blog', params: { lang } }">{{ categoryLabel }}</router-link>
            </template>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{{ post.title }}</span>
          </nav>

          <div class="bl-kicker">
            <span>{{ t(`blog.layout.${layout}`) }}</span>
            <span v-if="categoryLabel">{{ categoryLabel }}</span>
          </div>
          <h1 class="bl-title">{{ post.title }}</h1>
          <p v-if="post.excerpt" class="bl-dek">{{ post.excerpt }}</p>
          <p class="bl-meta">
            <span v-if="post.authorName">{{ t('blog.byAuthor', { name: post.authorName }) }}</span>
            <span v-if="post.publishedAt">{{ day(post.publishedAt) }}</span>
            <span v-if="post.readingMinutes">{{ t('blog.minutes', { n: post.readingMinutes }) }}</span>
          </p>

          <ProductMock v-if="layout === 'PRODUCT'" />
          <figure v-else class="bl-hero">
            <div class="bl-media" :class="tint">
              <img v-if="post.coverImage" :src="post.coverImage" :alt="post.title" />
              <PostGlyph v-else :seed="seed" />
            </div>
            <figcaption v-if="post.heroCaption" class="bl-caption">{{ post.heroCaption }}</figcaption>
          </figure>
        </div>
      </component>

      <div class="wrap bl-layout">
        <aside class="bl-side">
          <!-- Built from the body's own headings, so it can never list a
               section the article no longer has. -->
          <nav v-if="outline.headings.length" class="bl-toc" :aria-label="t(`blog.toc.${layout}`)">
            <strong>{{ t(`blog.toc.${layout}`) }}</strong>
            <a v-for="(heading, i) in outline.headings" :key="heading.id" :href="`#${heading.id}`">
              {{ layout === 'GUIDE' ? `${i + 1}. ` : '' }}{{ heading.text }}
            </a>
          </nav>

          <!--
            Only usable targets. A suspended vendor stays in the record but
            is not put in front of a reader, and the audit that decides
            that runs on the server rather than here.
          -->
          <div v-if="usableLinks.length" class="bl-side-box">
            <b>{{ t('blog.related') }}</b>
            <ol>
              <li v-for="link in usableLinks" :key="link.linkId">
                <a :href="link.path" @click="onRelatedClick(link)">{{ link.name }}</a>
              </li>
            </ol>
          </div>

          <div class="bl-side-box">
            {{ t('blog.ctaText') }}
            <router-link class="btn btn-primary btn-sm" :to="{ name: 'signup', params: { lang } }">
              {{ t('header.actions.createInvitation') }}
            </router-link>
          </div>
        </aside>

        <div>
          <!-- Checklist items are ticked with a click or Space; the state is
               the reader's, on this page only. -->
          <div
            class="prose bl-prose"
            v-html="outline.html"
            @click="onBodyClick"
            @keydown="onBodyKey"
          ></div>

          <div class="bl-after">
            <!-- Each tag opens everything filed under it — posts and vendors. -->
            <p v-if="post.tags?.length" class="bl-tags">
              <span>{{ t('blog.tagsLabel') }}</span>
              <router-link v-for="tag in post.tags" :key="tag.slug" class="tag" :to="`/${lang}/tags/${tag.slug}`">
                #{{ tag.name }}
              </router-link>
            </p>

            <!--
              Only locales that are actually published. A language switcher
              offering a translation nobody wrote sends the reader to a 404
              and a search engine to a dead alternate.
            -->
            <p v-if="post.otherLocales?.length" class="bl-locales">
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
        </div>
      </div>

      <section v-if="post.relatedPosts?.length" class="bl-related">
        <div class="wrap">
          <span v-if="layout !== 'PRODUCT'" class="bl-eyebrow">{{ t(`blog.relatedEyebrow.${layout}`) }}</span>
          <h2>{{ t(`blog.relatedTitle.${layout}`) }}</h2>
          <div class="bl-related-grid">
            <router-link
              v-for="related in post.relatedPosts"
              :key="related.slug"
              class="bl-related-card"
              :to="{ name: 'BlogPost', params: { lang, slug: related.slug } }"
            >
              <span v-if="layout === 'GUIDE' && relatedCategory(related)" class="bl-eyebrow">
                {{ relatedCategory(related) }}
              </span>
              <h3>{{ related.title }}</h3>
              <p v-if="layout !== 'PRODUCT' && related.excerpt">{{ related.excerpt }}</p>
              <span class="bl-read">{{ t('blog.openArticle') }} ↗</span>
            </router-link>
          </div>
        </div>
      </section>

      <section v-if="post.relatedVendors?.length" class="bl-vendors">
        <div class="wrap">
          <span class="bl-eyebrow">{{ t('blog.vendorsEyebrow') }}</span>
          <h2>{{ t('blog.vendorsTitle') }}</h2>
          <div class="bl-related-grid">
            <a
              v-for="vendor in post.relatedVendors"
              :key="vendor.slug"
              class="bl-related-card bl-vendor-card"
              :href="vendorPath(vendor)"
              @click="track('VENDOR_CLICK', { category: post.category, locale: post.locale })"
            >
              <span class="bl-vendor-type">{{ vendorLine(vendor) }}</span>
              <h3>{{ vendor.name }}</h3>
              <p v-if="vendor.description">{{ vendor.description }}</p>
              <span class="bl-read">{{ t('blog.viewVendor') }} ↗</span>
            </a>
          </div>
        </div>
      </section>
    </article>

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
import { useRoute, useRouter } from 'vue-router'
import SitePage from '@/layouts/SitePage.vue'
import PostGlyph from '@/components/landingPage/PostGlyph.vue'
import ProductMock from '@/components/blog/ProductMock.vue'
import { blogCategoryLabel, blogTint, layoutOf, slugSeed } from '@/components/blog/blogLabels'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'
import { track } from '@/composables/useContentJourney'
import { applySeo } from '@/composables/useDocumentSeo'
import { renderPostBody } from '@/utils/blogHtml'
import { outlineArticle, toggleChecklistItem } from '@/utils/articleOutline'
import '@/assets/styles/ivy/blog.css'

const { t, te, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const lang = computed(() => route.params.lang || 'mk')

const post = ref(null)
const error = ref('')
/** Distinct from an error: a slug with no published variant in this language is
 *  an answer, not a failure. */
const missing = ref(false)

const layout = computed(() => layoutOf(post.value))
const layoutClass = computed(() => layout.value.toLowerCase())
const usableLinks = computed(() => (post.value?.related || []).filter((link) => link.usable))

/* The drawing and tint behind a post without a photo come from the slug, the
   same as on the listing's card. */
const seed = computed(() => slugSeed(post.value?.slug))
const tint = computed(() => blogTint(seed.value))

const categoryLabel = computed(() => blogCategoryLabel(post.value?.category, t, te))

const authorInitials = computed(() =>
  (post.value?.authorName || '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2),
)

/** The editor's HTML, sanitized again on the way to the page, with ids on its
 *  headings for the table of contents. */
const outline = computed(() => outlineArticle(renderPostBody(post.value?.body)))

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
    if (detail && detail.slug !== route.params.slug) {
      showCurrentAddress(detail.slug)
      return
    }
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

/**
 * The API answered an old address with 301 and the browser followed it, so
 * the post arrived under a slug the URL does not show (IVY-907). The address
 * bar is corrected rather than left pointing at a retired address somebody
 * would copy and share again.
 */
function showCurrentAddress(slug) {
  router.replace({ name: 'BlogPost', params: { lang: lang.value, slug }, query: route.query })
}

function unwrap(response) {
  return response?.data ?? response ?? null
}

function onBodyClick(event) {
  toggleChecklistItem(event.target)
}

const TOGGLE_KEYS = [' ', 'Enter']

function onBodyKey(event) {
  if (TOGGLE_KEYS.includes(event.key) && toggleChecklistItem(event.target)) event.preventDefault()
}

/** Fired before the browser follows the link; the tracker never blocks it. */
function onRelatedClick(link) {
  if (link.targetType === 'VENDOR') {
    track('VENDOR_CLICK', { category: post.value?.category, locale: post.value?.locale })
  }
}

function relatedCategory(related) {
  return blogCategoryLabel(related.category, t, te)
}

/** The vendor's canonical address: category and slug, as the directory builds it. */
function vendorPath(vendor) {
  const category = (vendor.type || 'OTHER').toLowerCase().replace(/_/g, '-')
  return `/${lang.value}/vendors/${category}/${vendor.slug}`
}

function vendorLine(vendor) {
  const type = (vendor.type || '').toLowerCase().replace(/_/g, ' ')
  return [type, vendor.city].filter(Boolean).join(' · ')
}
</script>

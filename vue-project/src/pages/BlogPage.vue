<template>
  <SitePage>
    <!-- The lead story. Shown while the reader is browsing, not while they
         are searching or filtering: then the page is their results. -->
    <section v-if="lead" class="bl-featured">
      <div class="wrap">
        <div class="bl-featured-grid">
          <div class="bl-featured-copy">
            <span class="bl-eyebrow">{{ t('blog.featured') }}</span>
            <h1>{{ lead.title }}</h1>
            <p v-if="lead.excerpt">{{ lead.excerpt }}</p>
            <router-link class="bl-read" :to="postLink(lead)" data-track="blog-featured">
              {{ t('blog.readFeatured') }} ↗
            </router-link>
          </div>
          <div class="bl-featured-photo bl-media" :class="leadTint">
            <img v-if="lead.coverImage" :src="lead.coverImage" :alt="lead.title" />
            <PostGlyph v-else :seed="leadSeed" />
          </div>
        </div>
      </div>
    </section>

    <section id="blog-posts" class="bl-posts">
      <div class="wrap">
        <div class="bl-posts-head">
          <div>
            <span class="bl-eyebrow">{{ t('blog.eyebrow') }}</span>
            <component :is="lead ? 'h2' : 'h1'">{{ t('blog.heading') }}</component>
          </div>
          <p>{{ t('blog.subtitle') }}</p>
        </div>

        <div class="bl-controls">
          <!-- Only categories that have something in them: a chip that
               always leads to an empty page teaches readers to ignore chips. -->
          <div class="filters" role="group" :aria-label="t('blog.filterLabel')">
            <button type="button" :aria-pressed="!category" @click="category = null">{{ t('blog.all') }}</button>
            <button
              v-for="option in categories"
              :key="option"
              type="button"
              :aria-pressed="category === option"
              @click="category = option"
            >{{ categoryLabel(option) }}</button>
          </div>

          <input
            v-model="search"
            class="bl-search"
            type="search"
            :placeholder="t('blog.searchPlaceholder')"
            :aria-label="t('blog.searchLabel')"
          />
        </div>

        <!-- A tag arrives from an article's link, so it lives in the URL and
             can be taken off without losing the category. -->
        <p v-if="tag" class="bl-active-tag">
          <span class="tag">#{{ tag }}</span>
          <button type="button" class="bl-clear" @click="clearTag">{{ t('blog.clearTag') }}</button>
        </p>

        <p v-if="error" class="empty" role="alert">{{ error }}</p>
        <p v-else-if="loading" class="empty">{{ t('blog.loading') }}</p>
        <div v-else-if="shown.length" class="bl-grid">
          <BlogCard v-for="post in shown" :key="post.slug" :post="post" />
        </div>
        <!-- Nothing published in this language is a normal state for a young
             blog, and saying so beats an empty page that looks broken. -->
        <p v-else class="empty">{{ filtering ? t('blog.noResults') : t('blog.empty') }}</p>
      </div>
    </section>

    <section class="bl-newsletter">
      <div class="wrap bl-newsletter-grid">
        <div>
          <span class="bl-eyebrow">{{ t('blog.newsletterEyebrow') }}</span>
          <h2>{{ t('blog.newsletterTitle') }}</h2>
        </div>
        <NewsletterSignup />
      </div>
    </section>
  </SitePage>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import SitePage from '@/layouts/SitePage.vue'
import PostGlyph from '@/components/landingPage/PostGlyph.vue'
import NewsletterSignup from '@/components/landingPage/NewsletterSignup.vue'
import BlogCard from '@/components/blog/BlogCard.vue'
import { blogCategoryLabel, blogTint, slugSeed } from '@/components/blog/blogLabels'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'
import '@/assets/styles/ivy/blog.css'

/** The order chips appear in; which of them appear is up to the posts. */
const CATEGORY_ORDER = ['PLANNING', 'WEDDING', 'BIRTHDAY', 'CORPORATE', 'VENUE', 'VENDOR']
/** Long enough that a search is sent once the reader pauses, not per letter. */
const SEARCH_DELAY_MS = 300

const { t, te, locale } = useI18n()
const route = useRoute()
const router = useRouter()

/** Everything published in this language — the lead story and the chips. */
const all = ref([])
/** What a category, tag or search narrowed it to. */
const results = ref([])
const category = ref(null)
const search = ref(route.query.q || '')
const query = ref(search.value.trim())
const loading = ref(true)
const error = ref('')

const tag = computed(() => route.query.tag || null)
const filtering = computed(() => Boolean(category.value || tag.value || query.value))

const lead = computed(() => {
  if (filtering.value || !all.value.length) return null
  return all.value.find((post) => post.featured) || all.value[0]
})
const leadSeed = computed(() => slugSeed(lead.value?.slug))
const leadTint = computed(() => blogTint(leadSeed.value))

const shown = computed(() => {
  if (filtering.value) return results.value
  return all.value.filter((post) => post !== lead.value)
})

const categories = computed(() => {
  const present = new Set(all.value.map((post) => post.category))
  return CATEGORY_ORDER.filter((option) => present.has(option))
})

let searchTimer = null
watch(search, (typed) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    query.value = typed.trim()
    const next = { ...route.query }
    if (query.value) next.q = query.value
    else delete next.q
    router.replace({ query: next })
  }, SEARCH_DELAY_MS)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

onMounted(load)
watch(locale, load)
watch([category, tag, query], loadResults)

async function load() {
  loading.value = true
  try {
    all.value = unwrap(await contentService.published({ locale: locale.value })) || []
    error.value = ''
    if (filtering.value) await loadResults()
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

async function loadResults() {
  if (!filtering.value) return
  loading.value = true
  try {
    results.value = unwrap(await contentService.published({
      locale: locale.value,
      category: category.value || undefined,
      tag: tag.value || undefined,
      q: query.value || undefined,
    })) || []
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

function unwrap(response) {
  return response?.data ?? response ?? null
}

function categoryLabel(option) {
  return blogCategoryLabel(option, t, te)
}

function postLink(post) {
  return { name: 'BlogPost', params: { lang: route.params.lang || 'mk', slug: post.slug } }
}

function clearTag() {
  const next = { ...route.query }
  delete next.tag
  router.replace({ query: next })
}
</script>

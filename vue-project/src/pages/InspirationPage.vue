<template>
  <div v-if="page" class="inspiration-page">
    <PageHeader :title="heading">
      <template #actions>
        <p class="sub">{{ t('inspiration.subtitle', { count: page.totalVendors }) }}</p>
      </template>
    </PageHeader>

    <!--
      Said in the interface, not only in a meta tag. An editor looking at a page
      that will not be indexed should be able to see why without reading the
      HTML source.
    -->
    <p v-if="page.noindex" class="notice">
      {{ t('inspiration.thin', { minimum: page.minimumToIndex }) }}
    </p>

    <section v-if="page.vendors.length" class="vendors">
      <h2>{{ t('inspiration.vendors') }}</h2>
      <ul>
        <li v-for="vendor in page.vendors" :key="vendor.slug">
          <router-link :to="`/vendors/${vendor.slug}`" @click="onVendorClick">
            <span class="name">{{ vendor.name }}</span>
            <span v-if="vendor.city" class="city">{{ vendor.city }}</span>
          </router-link>
        </li>
      </ul>
    </section>

    <!--
      A page with no listings is still worth reading if there is writing on it,
      which is the difference between a hub and an empty results grid.
    -->
    <section v-if="page.posts.length" class="posts">
      <h2>{{ t('inspiration.reading') }}</h2>
      <ul>
        <li v-for="entry in page.posts" :key="entry.post.slug">
          <router-link :to="`/blog/${entry.post.slug}`">{{ entry.variant.title }}</router-link>
        </li>
      </ul>
    </section>

    <EmptyState v-if="!page.vendors.length && !page.posts.length" tone="no-results" :title="t('inspiration.empty')" />
  </div>

  <EmptyState v-else-if="missing" tone="no-results" :title="t('inspiration.notFound')" />
  <p v-else-if="error" class="error" role="alert">{{ error }}</p>
</template>

<script setup>
import EmptyState from '@/components/ui/EmptyState.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'
import { track } from '@/composables/useContentJourney'
import { applySeo } from '@/composables/useDocumentSeo'

const { t, locale } = useI18n()
const route = useRoute()

const page = ref(null)
const error = ref('')
/** A combination nobody approved is a 404, not an empty page: generating a hub
 *  for every category-and-city pair is how a site grows ten thousand thin
 *  pages and loses the ones that were good. */
const missing = ref(false)

const heading = computed(() => {
  if (!page.value) return ''
  const category = t(`blog.category${page.value.categorySlug.toUpperCase()}`)
  return page.value.city ? `${category} — ${page.value.city}` : category
})

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(load)
watch(() => [route.params.category, route.query.city, locale.value], load)

async function load() {
  page.value = null
  missing.value = false
  try {
    const found = page.value = unwrap(await contentService.landingPage(
      route.params.category, { city: route.query.city, locale: locale.value }))
    error.value = ''

    if (found) {
      applySeo({
        title: heading.value,
        description: t('inspiration.subtitle', { count: found.totalVendors }),
        canonicalUrl: canonicalFor(found),
        noindex: found.noindex,
      })
      track('CONTENT_VIEW', { category: found.categorySlug, locale: locale.value })
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
 * The city is part of the address; nothing else in the query string is.
 *
 * <p>Sort order and pagination produce different URLs for the same page, and
 * letting them into the canonical is how one hub becomes forty competing
 * duplicates of itself.
 */
function canonicalFor(found) {
  const base = `${window.location.origin}/inspiration/${found.categorySlug}`
  return found.city ? `${base}?city=${encodeURIComponent(found.city)}` : base
}

function onVendorClick() {
  track('VENDOR_CLICK', { category: page.value?.categorySlug, locale: locale.value })
}
</script>

<style scoped>
.inspiration-page { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; }
.page-head h1 { margin: 0; font-size: 1.8rem; }
.sub { color: #666; margin: 0.25rem 0 1rem; }
.notice { background: #f7f2e4; border-radius: 6px; padding: 0.5rem 0.75rem; color: #8a5300; font-size: 0.88rem; }
.error { color: #b3261e; }
section h2 { font-size: 1.05rem; margin: 1.5rem 0 0.5rem; }
ul { list-style: none; padding: 0; }
li a { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee; color: inherit; text-decoration: none; }
.name { font-weight: 500; }
.city { color: #888; font-size: 0.85rem; }
</style>

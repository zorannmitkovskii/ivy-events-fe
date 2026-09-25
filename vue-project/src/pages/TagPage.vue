<template>
  <SitePage>
    <div class="tag-page">
      <p v-if="loading" class="tag-state">{{ t('tags.page.loading') }}</p>
      <p v-else-if="missing" class="tag-state">{{ t('tags.page.notFound') }}</p>
      <p v-else-if="error" class="tag-state tag-error" role="alert">{{ error }}</p>

      <template v-else-if="hub">
        <PageHero :eyebrow="t('tags.page.eyebrow')" :title="`#${hub.name}`" :subtitle="t('tags.page.subtitle')" />

        <div class="tag-body">
          <section v-if="hub.posts.length" class="tag-section" data-testid="tag-posts">
            <h2>{{ t('tags.page.posts') }}</h2>
            <ul class="tag-posts">
              <li v-for="post in hub.posts" :key="post.slug">
                <RouterLink class="tag-post" :to="{ name: 'BlogPost', params: { lang, slug: post.slug } }">
                  <span
                    class="tag-post-cover"
                    :style="post.coverImage ? { backgroundImage: `url(${post.coverImage})` } : null"
                    aria-hidden="true"
                  />
                  <span class="tag-post-title">{{ post.title }}</span>
                  <span v-if="post.excerpt" class="tag-post-excerpt">{{ post.excerpt }}</span>
                </RouterLink>
              </li>
            </ul>
          </section>

          <section v-if="hub.vendors.length" class="tag-section" data-testid="tag-vendors">
            <h2>{{ t('tags.page.vendors') }}</h2>
            <ul class="tag-vendors">
              <li v-for="vendor in hub.vendors" :key="vendor.slug">
                <RouterLink class="tag-vendor" :to="vendorLink(vendor)">
                  <span class="tag-vendor-name">{{ vendor.name }}</span>
                  <span class="tag-vendor-meta">
                    {{ t(`vendorType.${vendor.type}`, readable(vendor.type)) }}
                    <template v-if="vendor.city"> · {{ vendor.city }}</template>
                  </span>
                </RouterLink>
              </li>
            </ul>
          </section>

          <section v-if="agencies.length" class="tag-section" data-testid="tag-agencies">
            <h2>{{ t('tags.page.agencies') }}</h2>
            <ul class="tag-vendors">
              <li v-for="agency in agencies" :key="agency.slug">
                <RouterLink class="tag-vendor" :to="`/${lang}/a/${agency.slug}`">
                  <span class="tag-vendor-name">{{ agency.name }}</span>
                  <span v-if="agency.city" class="tag-vendor-meta">{{ agency.city }}</span>
                </RouterLink>
              </li>
            </ul>
          </section>

          <p v-if="isEmpty(hub)" class="tag-state">{{ t('tags.page.empty') }}</p>
        </div>
      </template>
    </div>
  </SitePage>
</template>

<script setup>
/**
 * One shared tag and everything filed under it: the articles, and the vendors
 * who picked it. The page that makes a tag worth clicking — from an article to
 * the venues it is about, or from a venue to the guides.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import SitePage from '@/layouts/SitePage.vue'
import PageHero from '@/components/ui/PageHero.vue'
import { tagsService } from '@/services/tags.service'
import { getErrorMessage } from '@/services/apiError'
import { applySeo } from '@/composables/useDocumentSeo'
import { SITE_NAME } from '@/composables/useSeo'

const LANGS = ['mk', 'en', 'sq']

const { t } = useI18n()
const route = useRoute()

const lang = computed(() => route.params.lang || 'mk')

const hub = ref(null)
const loading = ref(true)
const missing = ref(false)
const error = ref('')

watch(() => [route.params.slug, lang.value], load, { immediate: true })

async function load() {
  loading.value = true
  missing.value = false
  error.value = ''
  try {
    const response = await tagsService.hub(route.params.slug, lang.value)
    hub.value = response?.data ?? response
    applyTagSeo(hub.value)
  } catch (failure) {
    hub.value = null
    if (failure?.status === 404 || failure?.response?.status === 404) {
      missing.value = true
    } else {
      error.value = getErrorMessage(failure)
    }
  } finally {
    loading.value = false
  }
}

/** Named after the tag in the reader's language, with an address per language. */
function applyTagSeo(found) {
  const origin = window.location.origin
  const path = `/tags/${encodeURIComponent(found.slug)}`
  applySeo({
    title: `#${found.name} | ${SITE_NAME}`,
    description: t('tags.page.description', { tag: found.name }),
    canonicalUrl: `${origin}/${lang.value}${path}`,
    type: 'website',
    locale: lang.value,
    // An empty tag page is a thin page; it stays out of the index until it has something.
    noindex: isEmpty(found),
    alternates: [
      ...LANGS.map((code) => ({ locale: code, url: `${origin}/${code}${path}` })),
      { locale: 'x-default', url: `${origin}/mk${path}` },
    ],
  })
}

/** Agencies arrived after the hub did; an older answer has none. */
const agencies = computed(() => hub.value?.agencies ?? [])

function isEmpty(found) {
  return !found.posts.length && !found.vendors.length && !(found.agencies ?? []).length
}

/** The vendor's canonical address: category and slug, as the directory links it. */
function vendorLink(vendor) {
  const category = (vendor.type || 'OTHER').toLowerCase().replace(/_/g, '-')
  return `/${lang.value}/vendors/${category}/${vendor.slug}`
}

function readable(type) {
  return (type || '').toLowerCase().replace(/_/g, ' ')
}
</script>

<style scoped>
.tag-page {
  min-height: 60vh;
}

.tag-body {
  max-width: 1080px;
  margin: 0 auto;
  padding: 8px 16px 48px;
}

.tag-section + .tag-section {
  margin-top: 40px;
}

.tag-section h2 {
  margin: 0 0 16px;
  font-size: 20px;
}

.tag-posts,
.tag-vendors {
  display: grid;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag-posts {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.tag-vendors {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.tag-post,
.tag-vendor {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: inherit;
  text-decoration: none;
  overflow: hidden;
}

.tag-post:hover,
.tag-vendor:hover {
  border-color: var(--ink-4);
}

.tag-post-cover {
  aspect-ratio: 16 / 9;
  background: var(--sunken) center / cover no-repeat;
}

.tag-post-title {
  padding: 0 14px;
  font-weight: 600;
}

.tag-post-excerpt {
  padding: 0 14px 14px;
  font-size: 14px;
  color: var(--ink-3);
}

.tag-vendor {
  padding: 14px;
}

.tag-vendor-name {
  font-weight: 600;
}

.tag-vendor-meta {
  font-size: 13px;
  color: var(--ink-3);
}

.tag-state {
  padding: 60px 16px;
  text-align: center;
  color: var(--ink-3);
}

.tag-error {
  color: var(--danger, #b3261e);
}
</style>

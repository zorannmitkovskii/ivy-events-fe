<template>
  <div>
    <PageHead :title="t('adminBlog.title')" :subtitle="t('adminBlog.subtitle')">
      <template #actions>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'admin.blog.new', params: { lang } }">
          {{ t('adminBlog.newPost') }}
        </RouterLink>
      </template>
    </PageHead>

    <form class="toolbar blog-filters" role="search" @submit.prevent>
      <input
        v-model="filters.q"
        class="search"
        type="search"
        :placeholder="t('adminBlog.list.search')"
        :aria-label="t('adminBlog.list.search')"
      />
      <select v-model="filters.category" :aria-label="t('adminBlog.list.columns.category')">
        <option value="">{{ t('adminBlog.list.allCategories') }}</option>
        <option v-for="option in CATEGORIES" :key="option" :value="option">{{ t(`blog.category${option}`) }}</option>
      </select>
      <select v-model="filters.status" :aria-label="t('adminBlog.list.columns.status')">
        <option value="">{{ t('adminBlog.list.allStatuses') }}</option>
        <option v-for="option in STATUSES" :key="option" :value="option">{{ t(`adminBlog.status.${option}`) }}</option>
      </select>
      <select v-model="filters.locale" :aria-label="t('adminBlog.list.columns.languages')">
        <option value="">{{ t('adminBlog.list.allLocales') }}</option>
        <option v-for="option in LOCALES" :key="option" :value="option">{{ t(`adminBlog.locales.${option}`) }}</option>
      </select>
      <select v-model="filters.seo" class="seo-filter" :aria-label="t('adminBlog.list.columns.seo')">
        <option value="">{{ t('adminBlog.list.allSeo') }}</option>
        <option v-for="option in SEO_STATES" :key="option" :value="option">{{ t(`adminBlog.list.seo${option}`) }}</option>
      </select>
      <input v-model="filters.tag" type="text" :placeholder="t('adminBlog.list.tag')" :aria-label="t('adminBlog.list.tag')" />
      <button v-if="hasFilters" type="button" class="btn btn-ghost btn-sm" @click="clearFilters">
        {{ t('adminBlog.list.clear') }}
      </button>
      <span class="spacer" />
      <span class="muted small">{{ t('adminBlog.list.count', { n: total }) }}</span>
    </form>

    <p v-if="loading" class="empty">{{ t('adminBlog.list.loading') }}</p>

    <p v-else-if="error" class="empty" role="alert">{{ error }}</p>

    <template v-else-if="posts.length">
      <div class="card tbl-card">
        <table class="tbl">
          <thead>
            <tr>
              <th>{{ t('adminBlog.list.columns.title') }}</th>
              <th>{{ t('adminBlog.list.columns.category') }}</th>
              <th>{{ t('adminBlog.list.columns.tags') }}</th>
              <th>{{ t('adminBlog.list.columns.languages') }}</th>
              <th>{{ t('adminBlog.list.columns.seo') }}</th>
              <th>{{ t('adminBlog.list.columns.updated') }}</th>
              <th>{{ t('adminBlog.list.columns.author') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in posts" :key="post.id">
              <td>
                <RouterLink class="post-title" :to="{ name: 'admin.blog.edit', params: { lang, id: post.id } }">
                  {{ post.title || t('adminBlog.list.untitled') }}
                </RouterLink>
                <small class="slug">/{{ post.slug }}</small>
              </td>
              <td>{{ t(`blog.category${post.category}`) }}</td>
              <td>
                <span v-for="tag in post.tags" :key="tag" class="chip">{{ tag }}</span>
              </td>
              <td class="states">
                <span v-if="post.archived" class="chip no">{{ t('adminBlog.list.archived') }}</span>
                <span v-for="(state, code) in post.statuses" :key="code" class="chip" :class="toneFor(state)">
                  {{ code.toUpperCase() }} · {{ t(`adminBlog.status.${state}`) }}
                </span>
              </td>
              <td class="seo">
                <span v-if="post.seoErrors" class="chip no">{{ t('adminBlog.list.seoErrors', { n: post.seoErrors }) }}</span>
                <span v-if="post.seoWarnings" class="chip wait">{{ t('adminBlog.list.seoWarnings', { n: post.seoWarnings }) }}</span>
                <span v-if="!post.seoErrors && !post.seoWarnings" class="chip ok">{{ t('adminBlog.list.seoClean') }}</span>
              </td>
              <td>{{ post.updatedAt ? day(post.updatedAt) : '—' }}</td>
              <td>{{ post.authorName || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pages > 1" class="pager">
        <button type="button" :disabled="page === 0" @click="go(page - 1)">{{ t('adminBlog.list.previous') }}</button>
        <span>{{ t('adminBlog.list.pageOf', { page: page + 1, pages }) }}</span>
        <button type="button" :disabled="page + 1 >= pages" @click="go(page + 1)">{{ t('adminBlog.list.next') }}</button>
      </div>
    </template>

    <p v-else class="empty">{{ hasFilters ? t('adminBlog.list.empty') : t('adminBlog.list.emptyAll') }}</p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { contentService } from '@/services/content.service'
import { getErrorMessage } from '@/services/apiError'

/*
  Every blog post, whatever its state (IVY-906, IVY-907).

  The filters live in the URL so a filtered list survives a reload and an
  editor can send somebody "the Albanian drafts" — or "everything with SEO
  errors" — as a link. Typing in the search waits a moment before asking,
  rather than sending a request per key.
*/

const CATEGORIES = ['WEDDING', 'BIRTHDAY', 'CORPORATE', 'VENUE', 'VENDOR', 'PLANNING']
const STATUSES = ['DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']
const LOCALES = ['mk', 'en', 'sq']
const SEO_STATES = ['ERRORS', 'CLEAN']
const FILTER_KEYS = ['q', 'category', 'status', 'locale', 'seo', 'tag']
const PAGE_SIZE = 20
const TYPING_DELAY_MS = 300

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang || 'mk')

const filters = reactive(Object.fromEntries(FILTER_KEYS.map((key) => [key, route.query[key] || ''])))
const page = ref(Number(route.query.page) || 0)
const posts = ref([])
const total = ref(0)
const loading = ref(true)
const error = ref('')

const pages = computed(() => Math.ceil(total.value / PAGE_SIZE) || 1)
const hasFilters = computed(() => FILTER_KEYS.some((key) => filters[key]))

let pendingLoad = null

onMounted(load)
onBeforeUnmount(() => clearTimeout(pendingLoad))

watch(filters, () => {
  page.value = 0
  clearTimeout(pendingLoad)
  pendingLoad = setTimeout(load, TYPING_DELAY_MS)
})

function go(next) {
  page.value = next
  load()
}

function clearFilters() {
  for (const key of FILTER_KEYS) filters[key] = ''
}

async function load() {
  syncUrl()
  loading.value = true
  try {
    const response = await contentService.list({ ...activeFilters(), page: page.value, size: PAGE_SIZE })
    const body = response?.data ?? response ?? {}
    posts.value = body.content ?? []
    total.value = body.totalElements ?? posts.value.length
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

function activeFilters() {
  return Object.fromEntries(FILTER_KEYS.filter((key) => filters[key]).map((key) => [key, filters[key]]))
}

function syncUrl() {
  const query = activeFilters()
  if (page.value > 0) query.page = String(page.value)
  router.replace({ query })
}

const day = (iso) => new Date(iso).toLocaleDateString(locale.value)

/** Green for live, gold for on its way, red for taken down, plain for a draft. */
function toneFor(state) {
  if (state === 'PUBLISHED') return 'ok'
  if (state === 'SCHEDULED' || state === 'IN_REVIEW') return 'wait'
  if (state === 'ARCHIVED') return 'no'
  return ''
}
</script>

<style scoped>
/* `.toolbar`, `.tbl`, `.card`, `.chip` and `.pager` are the design's, in
   `ivy/dash.css`. Local: the filter controls, the title cell and the card
   holding the table without padding of its own. */
.blog-filters {
  align-items: center;
}

.blog-filters select,
.blog-filters input:not(.search) {
  min-width: 150px;
}

.card.tbl-card {
  padding: 0;
  overflow-x: auto;
}

.post-title {
  display: block;
  font-weight: 600;
  color: var(--ink);
}

.slug {
  color: var(--ink-3);
  font-size: 13px;
}

.states,
.seo,
td .chip + .chip {
  white-space: nowrap;
}

td .chip {
  margin: 2px 4px 2px 0;
}
</style>

<template>
  <SitePage>
  <div class="directory-page">
    <!--
      The directory had neither header nor footer: a reader who arrived here
      had no way on to any other part of the site, and no way back. It is a
      public marketing page and now looks like one (IVY-1401) — SitePage is
      what brings both, and the redesign's stylesheet with them.
    -->
    <PageHero :eyebrow="t('directory.title')" :title="t('directory.subtitle')" />

  <div class="directory">

    <form class="filters" @submit.prevent="search">
      <input
        v-model="filters.q"
        class="search"
        type="search"
        :placeholder="t('directory.searchPlaceholder')"
        :aria-label="t('directory.searchPlaceholder')"
      />

      <select v-model="filters.type" :aria-label="t('directory.category')">
        <option value="">{{ t('directory.allCategories') }}</option>
        <option v-for="type in TYPES" :key="type" :value="type">
          {{ t(`vendorType.${type}`, readable(type)) }}
        </option>
      </select>

      <select v-model="filters.city" :aria-label="t('directory.city')">
        <option value="">{{ t('directory.allCities') }}</option>
        <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
      </select>

      <button class="btn" type="submit">{{ t('directory.search') }}</button>
    </form>

    <p v-if="loading" class="state">{{ t('directory.loading') }}</p>
    <p v-else-if="!results.length" class="state">{{ t('directory.noResults') }}</p>

    <ul v-else class="cards">
      <li v-for="vendor in results" :key="vendor.id">
        <router-link class="card" :to="profileLink(vendor)">
          <img v-if="vendor.logoKey" class="logo" :src="mediaSrc(vendor.logoKey)" :alt="vendor.name" />
          <div v-else class="logo logo-placeholder" aria-hidden="true">
            {{ vendor.name.charAt(0) }}
          </div>

          <div class="card-body">
            <h2>{{ vendor.name }}</h2>
            <p class="meta">
              {{ t(`vendorType.${vendor.type}`, readable(vendor.type)) }}
              <template v-if="vendor.city"> · {{ vendor.city }}</template>
            </p>
            <p v-if="vendor.description" class="blurb">{{ vendor.description }}</p>
            <!-- No rating shown when there is none. A zero renders as one star,
                 which is a worse lie than saying nothing. -->
            <p v-if="vendor.rating" class="rating">★ {{ vendor.rating.toFixed(1) }}</p>
          </div>
        </router-link>
      </li>
    </ul>

    <nav v-if="totalPages > 1" class="pager" :aria-label="t('directory.pages')">
      <button class="link-btn" :disabled="page === 0" @click="goTo(page - 1)">
        {{ t('directory.previous') }}
      </button>
      <span>{{ t('directory.pageOf', { n: page + 1, total: totalPages }) }}</span>
      <button class="link-btn" :disabled="page + 1 >= totalPages" @click="goTo(page + 1)">
        {{ t('directory.next') }}
      </button>
    </nav>
  </div>
  </div>
  </SitePage>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import SitePage from '@/layouts/SitePage.vue'
import PageHero from '@/components/ui/PageHero.vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { vendorDirectoryService } from '@/services/vendorDirectory.service'
import { baseUrl } from '@/services/baseUrl'

const TYPES = [
  'PHOTOGRAPHY', 'VENUE', 'CATERING', 'BAND', 'DJ', 'DECORATION', 'FLOWERS',
  'CAKE', 'MAKEUP_HAIR', 'BRIDAL_ATTIRE', 'GROOM_ATTIRE', 'TRANSPORTATION',
  'LIGHTING', 'ENTERTAINMENT', 'PRINTING', 'OTHER',
]

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const results = ref([])
const cities = ref([])
const loading = ref(true)
const page = ref(0)
const totalPages = ref(1)

const filters = reactive({
  q: route.query.q || '',
  type: route.query.type || '',
  city: route.query.city || '',
})

onMounted(async () => {
  loadCities()
  await load()
})

// A filter change is a new URL, so a filtered list can be linked to and
// shared. The pagination and filters stay in the query string rather than in
// component state alone.
watch(() => route.query, () => {
  filters.q = route.query.q || ''
  filters.type = route.query.type || ''
  filters.city = route.query.city || ''
  page.value = Number(route.query.page || 0)
  load()
})

async function loadCities() {
  try {
    const response = await vendorDirectoryService.cities()
    cities.value = response?.data ?? response ?? []
  } catch {
    cities.value = []
  }
}

async function load() {
  loading.value = true
  try {
    const response = await vendorDirectoryService.search({
      type: filters.type, city: filters.city, q: filters.q, page: page.value,
    })
    const body = response?.data ?? response
    results.value = body?.content ?? []
    totalPages.value = body?.totalPages ?? 1
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 0
  pushQuery()
}

function goTo(next) {
  page.value = next
  pushQuery()
}

function pushQuery() {
  const query = {}
  if (filters.q) query.q = filters.q
  if (filters.type) query.type = filters.type
  if (filters.city) query.city = filters.city
  if (page.value > 0) query.page = page.value
  router.push({ query })
}

/** The canonical path: category and slug, so the URL says what the vendor
 *  does and the directory's own facets are crawlable. */
function profileLink(vendor) {
  const category = (vendor.type || 'OTHER').toLowerCase().replace(/_/g, '-')
  return `/${locale.value}/vendors/${category}/${vendor.slug}`
}

function mediaSrc(key) {
  return `${baseUrl}/v1/api/public/images/${encodeURIComponent(key)}`
}

function readable(type) {
  return (type || '').toLowerCase().replace(/_/g, ' ')
}
</script>

<style scoped>
.directory-page { display: flex; flex-direction: column; min-height: 100vh; }
.directory-page > .directory { flex: 1; }
.directory { max-width: 1080px; margin: 0 auto; padding: 24px 16px; }

.head { text-align: center; margin-bottom: 24px; }
.head h1 { margin: 0 0 6px; font-size: 28px; }
.sub { margin: 0; color: var(--ink-3); }

.filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
.filters input, .filters select {
  padding: 10px 12px; border: 1px solid var(--line-2); border-radius: 10px; font-size: 15px;
}
.search { flex: 1 1 240px; }

.cards { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

.card { display: flex; gap: 14px; padding: 14px; border-radius: 12px;
  background: var(--surface); border: 1px solid var(--line); text-decoration: none; color: inherit; }
.card:hover { border-color: var(--ink-4); }

.logo { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
.logo-placeholder {
  display: flex; align-items: center; justify-content: center;
  background: var(--sunken); font-size: 24px; color: var(--ink-4);
}

.card-body h2 { margin: 0; font-size: 16px; }
.meta { margin: 3px 0 0; font-size: 12.5px; color: var(--ink-3); }
.blurb { margin: 8px 0 0; font-size: 13.5px; color: var(--ink-2); }
.rating { margin: 8px 0 0; font-size: 13px; color: var(--brand-gold); }

.pager { display: flex; gap: 16px; justify-content: center; align-items: center;
  margin-top: 28px; font-size: 14px; }

.state { text-align: center; padding: 40px 0; color: var(--ink-3); }

.btn { padding: 10px 18px; border: 0; border-radius: 10px; background: var(--brand);
  color: var(--surface); font-size: 15px; cursor: pointer; }
.link-btn { border: 0; background: none; color: var(--brand); cursor: pointer; font-size: 14px; }
.link-btn:disabled { opacity: 0.4; cursor: default; }
</style>

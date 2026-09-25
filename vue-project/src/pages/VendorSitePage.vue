<template>
  <main class="host">
    <p v-if="loading" class="state">{{ t('common.loading') }}</p>

    <!--
      A 404 here is a real one. The address is somebody's business card, and a
      page that says "something went wrong" to a couple who typed it off a
      napkin is worse than one that says the supplier is not here.
    -->
    <section v-else-if="missing" class="state missing">
      <h1>{{ t('microsite.site.notFound') }}</h1>
      <p>{{ t('microsite.site.notFoundHint') }}</p>
      <a class="home" :href="marketplaceHref">{{ t('microsite.site.browseAll') }}</a>
    </section>

    <p v-else-if="error" class="state error" role="alert">{{ error }}</p>

    <VendorMicrosite
      v-else-if="vendor"
      :vendor="vendor"
      :media="media"
      :content="content"
      :theme="theme"
      :details="details"
      :sections="sections"
      :slug="siteSlug"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import VendorMicrosite from '@/components/vendor/VendorMicrosite.vue'
import { api } from '@/services/api'
import { applySeo } from '@/composables/useDocumentSeo'
import { SITE_NAME } from '@/composables/useSeo'
import { resolveVendorHost } from '@/services/vendorHost'

const { t, locale } = useI18n()
const route = useRoute()

const vendor = ref(null)
const media = ref([])
const content = ref({})
const theme = ref('CLASSIC')
const loading = ref(true)
const missing = ref(false)
const error = ref('')

const lang = computed(() => route.params.lang || locale.value || 'mk')
const marketplaceHref = computed(() => `https://${resolveVendorHost().platformDomain}/${lang.value}/vendors`)

const details = ref({})
const sections = ref({})
const siteSlug = ref('')

/** A search result's snippet is about this long; more is cut off anyway. */
const DESCRIPTION_LIMIT = 160

/**
 * The vendor's own site is indexed under its own address and name — it is the
 * vendor's front door, not a copy of the marketplace listing.
 */
function applySiteSeo(profile) {
  const description = (profile.description || '').replace(/\s+/g, ' ').trim().slice(0, DESCRIPTION_LIMIT)
  applySeo({
    title: `${profile.name} | ${SITE_NAME}`,
    description: description || null,
    canonicalUrl: window.location.origin + window.location.pathname,
    type: 'website',
    locale: lang.value,
  })
}

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(async () => {
  // The slug comes from the hostname in production and from the path in local
  // development, where there is no wildcard DNS to resolve one.
  const { host, slug } = resolveVendorHost(route.params.slug)

  if (!slug) {
    missing.value = true
    loading.value = false
    return
  }

  try {
    const view = unwrap(await api.get('/public/microsite', { params: { host, locale: lang.value } }))
    if (!view?.profile) {
      missing.value = true
      return
    }

    // One answer carries the whole page. The server decides what this
    // vendor's work is, so the microsite and the marketplace page cannot end
    // up showing different portfolios for the same supplier.
    vendor.value = {
      ...view.profile,
      tags: view.tags ?? [],
      relatedPosts: view.relatedPosts ?? [],
      canonicalUrl: view.canonicalUrl,
    }
    theme.value = view.theme || 'CLASSIC'
    media.value = view.media ?? []
    content.value = view.content ?? {}
    details.value = view.details ?? {}
    sections.value = view.sections ?? {}
    siteSlug.value = view.slug ?? view.profile.slug ?? ''
    applySiteSeo(view.profile)
  } catch (e) {
    if (e?.status === 404 || e?.response?.status === 404) {
      missing.value = true
    } else {
      error.value = e?.detail ?? e?.response?.data?.message ?? e.message
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.host { min-height: 100vh; background: #fff; }

.state {
  padding: 22vh 24px;
  text-align: center;
  color: #6b665e;
  font-family: 'Golos Text', system-ui, sans-serif;
}

.missing h1 {
  font-family: 'Literata', Georgia, serif;
  font-size: clamp(24px, 5vw, 34px);
  color: #1d1b18;
  margin: 0 0 10px;
}

.missing p { margin: 0 0 22px; }

.home {
  display: inline-block;
  padding: 11px 24px;
  border-radius: 999px;
  background: #1d1b18;
  color: #fff;
  text-decoration: none;
  font-size: 14px;
}

.error { color: #b3261e; }
</style>

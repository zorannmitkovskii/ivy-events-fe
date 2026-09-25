<template>
  <div class="agency-site-page">
    <p v-if="loading" class="state">{{ t('agencySite.loading') }}</p>

    <div v-else-if="missing" class="state">
      <h1>{{ t('agencySite.notFound.title') }}</h1>
      <p>{{ t('agencySite.notFound.body') }}</p>
      <RouterLink :to="`/${lang}`">{{ t('agencySite.notFound.back') }}</RouterLink>
    </div>

    <p v-else-if="error" class="state" role="alert">{{ error }}</p>

    <AgencyMicrosite v-else-if="site" :site="site" :lang="lang" />
  </div>
</template>

<script setup>
/**
 * An agency's public site (`/:lang/a/:slug`, or `<slug>.ivyevents.mk`, which
 * the router sends here).
 *
 * <p>Sets its own tags from the agency's SEO fields — the route is marked
 * `seo: "server"` so the site-wide defaults stay out of the way.
 */
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import AgencyMicrosite from '@/components/agency/microsite/AgencyMicrosite.vue'
import { agencySiteService } from '@/services/agencySite.service'
import { applySeo } from '@/composables/useDocumentSeo'
import { SITE_NAME } from '@/composables/useSeo'
import { getErrorMessage } from '@/services/apiError'

/** A search result's snippet is about this long; more is cut off anyway. */
const DESCRIPTION_LIMIT = 160

const { t, locale } = useI18n()
const route = useRoute()

const lang = computed(() => route.params.lang || locale.value || 'mk')
const site = ref(null)
const loading = ref(true)
const missing = ref(false)
const error = ref('')

function isNotFound(e) {
  return e?.status === 404 || e?.response?.status === 404
}

function applySiteSeo(view) {
  const description = view.seoDescription || view.content?.hero?.text || ''
  applySeo({
    title: view.seoTitle ? `${view.seoTitle} | ${SITE_NAME}` : `${view.name} | ${SITE_NAME}`,
    description: description.replace(/\s+/g, ' ').trim().slice(0, DESCRIPTION_LIMIT) || null,
    canonicalUrl: window.location.origin + window.location.pathname,
    type: 'website',
    locale: lang.value,
  })
}

async function load() {
  loading.value = true
  missing.value = false
  error.value = ''
  try {
    site.value = await agencySiteService.publicSite(route.params.slug, lang.value)
    if (site.value) applySiteSeo(site.value)
    else missing.value = true
  } catch (e) {
    if (isNotFound(e)) missing.value = true
    else error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(() => [route.params.slug, lang.value], load, { immediate: true })
</script>

<style scoped>
.agency-site-page {
  min-height: 100vh;
  background: #fff;
}

.state {
  padding: 22vh 24px;
  text-align: center;
  color: #6b665e;
}
</style>

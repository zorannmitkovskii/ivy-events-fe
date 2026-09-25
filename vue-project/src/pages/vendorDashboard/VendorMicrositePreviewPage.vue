<template>
  <div class="preview">
    <!--
      The bar is the preview's, not the site's. It floats over the page rather
      than sitting above it, because a vendor judging a theme needs to see the
      cover at the height it will actually open at.
    -->
    <div class="bar">
      <router-link class="back" :to="backHref">‹ {{ t('microsite.previewBack') }}</router-link>

      <div class="themes" role="group" :aria-label="t('microsite.theme')">
        <button
          v-for="option in THEMES"
          :key="option"
          type="button"
          class="theme"
          :class="{ on: theme === option }"
          :aria-pressed="theme === option"
          @click="theme = option"
        >{{ t(`microsite.themes.${option}`) }}</button>
      </div>

      <p class="note">{{ t('microsite.previewNote') }}</p>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="loading">{{ t('common.loading') }}</p>

    <VendorMicrosite
      v-else-if="vendor"
      :vendor="vendor"
      :media="media"
      :content="content"
      :theme="theme"
      :details="details"
      :sections="sections"
      :slug="vendor.slug || ''"
      form-disabled
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import VendorMicrosite from '@/components/vendor/VendorMicrosite.vue'
import { THEMES } from '@/components/vendor/microsite/useMicrosite'
import { api } from '@/services/api'
import { vendorPortalService } from '@/services/vendorPortal.service'

const { t } = useI18n()
const route = useRoute()

const vendor = ref(null)
const media = ref([])
const content = ref({})
const theme = ref('CLASSIC')
const details = ref({})
const sections = ref({})
const loading = ref(true)
const error = ref('')

const backHref = computed(() => `/${route.params.lang || 'mk'}/vendor/microsite`)

/**
 * One layer, not a destructure.
 *
 * <p>The vendor-portal endpoints answer with a bare list while the rest of
 * the API wraps everything in {@code ApiResponse}.
 */
function unwrap(response) {
  return response?.data ?? response ?? null
}

/** Exactly what visitors will get: the server's view, content gaps filled. */
function show(view) {
  vendor.value = { ...view.profile, canonicalUrl: view.canonicalUrl }
  media.value = view.media ?? []
  content.value = view.content ?? {}
  details.value = view.details ?? {}
  sections.value = view.sections ?? {}
  if (THEMES.includes(view.theme)) theme.value = view.theme
}

/**
 * Before approval the server has no public view to render, so the preview is
 * assembled from the portal's own answers — the saved wording as written, with
 * the name standing in for an empty headline.
 */
async function showDraft() {
  const [me, settings, mediaRows, profileDetails] = await Promise.all([
    vendorPortalService.me(),
    api.get('/vendor-portal/microsite').catch(() => null),
    vendorPortalService.listMedia().catch(() => []),
    api.get('/vendor-portal/profile').catch(() => null),
  ])
  const profile = unwrap(me) ?? {}
  const saved = unwrap(settings) ?? {}
  const stored = saved.content ?? {}

  vendor.value = profile
  media.value = unwrap(mediaRows) ?? []
  details.value = unwrap(profileDetails) ?? {}
  sections.value = saved.sections ?? {}
  content.value = { ...stored, hero: { ...stored.hero, title: stored.hero?.title || profile.name } }
  if (THEMES.includes(saved.theme)) theme.value = saved.theme
}

onMounted(async () => {
  try {
    const view = unwrap(await api.get('/vendor-portal/microsite/preview').catch(() => null))
    if (view?.profile) show(view)
    else await showDraft()
  } catch (e) {
    error.value = e?.detail ?? e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.preview { min-height: 100vh; background: #fff; }

.bar {
  position: fixed;
  z-index: 20;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
  padding: 8px 10px 8px 14px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border: 1px solid #e0dcd4;
  border-radius: 999px;
  box-shadow: 0 6px 26px rgba(0, 0, 0, 0.12);
  max-width: calc(100% - 32px);
}

.back { font-size: 13px; color: #1d1b18; text-decoration: none; white-space: nowrap; }
.back:hover { text-decoration: underline; }

.themes { display: flex; gap: 4px; }

.theme {
  border: 0;
  background: transparent;
  padding: 7px 13px;
  border-radius: 999px;
  font: inherit;
  font-size: 12.5px;
  color: #6b665e;
  cursor: pointer;
  white-space: nowrap;
}

.theme.on { background: #1d1b18; color: #fff; }
.theme:focus-visible { outline: 2px solid #1d1b18; outline-offset: 2px; }

.note { margin: 0; font-size: 11px; color: #8a847a; white-space: nowrap; }

@media (max-width: 620px) {
  .note { display: none; }
}

.error, .loading { padding: 80px 24px; text-align: center; color: #6b665e; }
.error { color: #b3261e; }
</style>

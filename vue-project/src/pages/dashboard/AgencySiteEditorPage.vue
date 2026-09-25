<template>
  <div class="agency-site-editor">
    <PageHead :title="t('agencySite.editor.title')" :subtitle="t('agencySite.editor.subtitle')">
      <template #actions>
        <RouterLink v-if="view?.published && publicPath" :to="publicPath" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">
          {{ t('agencySite.editor.openSite') }} ↗
        </RouterLink>
      </template>
    </PageHead>

    <p v-if="loading" class="se-state">{{ t('agencySite.loading') }}</p>
    <p v-else-if="loadError" class="se-state se-error" role="alert">{{ loadError }}</p>

    <div v-else class="se-layout">
      <section class="card se-card">
        <div class="se-tabs" role="tablist">
          <button
            v-for="tab in TABS"
            :key="tab"
            type="button"
            role="tab"
            :aria-selected="active === tab"
            :class="{ on: active === tab }"
            @click="active = tab"
          >{{ t(`agencySite.editor.tabs.${tab}`) }}</button>
        </div>

        <div class="se-pane">
          <p v-if="!view.saved" class="se-note">{{ t('agencySite.editor.unsavedNote') }}</p>

          <SiteModelPicker v-if="active === 'model'" :model-value="model" :busy="busy" @update:model-value="saveModel" />

          <SiteContentEditor
            v-else-if="active === 'content'"
            v-model:content="content"
            v-model:image-urls="imageUrls"
            :model="model"
            :busy="busy"
            @save="saveContent"
          />

          <SiteProjectsEditor v-else-if="active === 'projects'" v-model:projects="projects" />

          <SiteTagsPicker v-else-if="active === 'tags'" :model-value="tagSlugs" :busy="busy" @save="saveTags" />

          <SitePublishPanel
            v-else
            v-model:settings="settings"
            :published="view.published"
            :public-path="publicPath"
            :host="view.host || ''"
            :busy="busy"
            @save="saveSettings"
            @publish="publish"
          />

          <p v-if="notice" class="se-saved" role="status">{{ notice }}</p>
          <p v-if="error" class="se-error" role="alert">{{ error }}</p>
        </div>
      </section>

      <section class="card se-preview-card" :aria-label="t('agencySite.editor.preview')">
        <div class="se-preview-head">
          <strong>{{ t('agencySite.editor.preview') }}</strong>
          <div class="se-devices" role="group">
            <button type="button" :class="{ on: device === 'desktop' }" :aria-pressed="device === 'desktop'" @click="device = 'desktop'">
              {{ t('agencySite.editor.desktop') }}
            </button>
            <button type="button" :class="{ on: device === 'phone' }" :aria-pressed="device === 'phone'" @click="device = 'phone'">
              {{ t('agencySite.editor.phone') }}
            </button>
          </div>
        </div>
        <div class="se-preview" :class="{ phone: device === 'phone' }">
          <AgencyMicrosite :site="previewSite" :lang="lang" preview />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
/**
 * The agency's public site, for its owner (2026 agency microsite designs).
 *
 * <p>Five tabs, each saving to its own endpoint, and a live preview beside
 * them drawn by the same component the public page uses. The preview follows
 * the draft, so the owner sees an edit before saving it.
 */
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import AgencyMicrosite from '@/components/agency/microsite/AgencyMicrosite.vue'
import SiteModelPicker from '@/components/agency/site-editor/SiteModelPicker.vue'
import SiteContentEditor from '@/components/agency/site-editor/SiteContentEditor.vue'
import SiteProjectsEditor from '@/components/agency/site-editor/SiteProjectsEditor.vue'
import SiteTagsPicker from '@/components/agency/site-editor/SiteTagsPicker.vue'
import SitePublishPanel from '@/components/agency/site-editor/SitePublishPanel.vue'
import { normalizeContent } from '@/components/agency/site-editor/normalizeContent'
import { agencySiteService } from '@/services/agencySite.service'
import { getErrorMessage } from '@/services/apiError'

const TABS = ['model', 'content', 'projects', 'tags', 'publish']
const SETTINGS_FIELDS = ['slug', 'name', 'email', 'phone', 'city', 'seoTitle', 'seoDescription']

const { t } = useI18n()
const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const view = ref(null)
const loading = ref(true)
const loadError = ref('')
const active = ref('model')
const device = ref('desktop')
const busy = ref(false)
const error = ref('')
const notice = ref('')

const model = ref('CLASSIC')
const content = ref(normalizeContent({}))
const imageUrls = ref({})
const projects = ref([])
const settings = ref({})

const tagSlugs = computed(() => (view.value?.tags || []).map((tag) => tag.slug))
const publicPath = computed(() => (view.value?.slug ? `/${lang.value}/a/${view.value.slug}` : ''))

/** What the preview draws: the saved view with every unsaved draft laid over it. */
const previewSite = computed(() => ({
  ...(view.value || {}),
  ...settings.value,
  name: settings.value.name || t('agencySite.editor.namePlaceholder'),
  model: model.value,
  content: content.value,
  imageUrls: imageUrls.value,
  projects: projects.value.filter((project) => project.published),
}))

/** Takes the server's answer as the new truth, drafts included. */
function adopt(next) {
  view.value = next
  model.value = next.model || 'CLASSIC'
  content.value = normalizeContent(next.content)
  imageUrls.value = { ...(next.imageUrls || {}) }
  projects.value = [...(next.projects || [])]
  settings.value = Object.fromEntries(SETTINGS_FIELDS.map((field) => [field, next[field] || '']))
}

async function run(action, doneMessage) {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    adopt(await action())
    notice.value = doneMessage
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    busy.value = false
  }
}

const saveModel = (next) => {
  model.value = next
  return run(() => agencySiteService.setModel(next), t('agencySite.editor.saved'))
}
const saveContent = () => run(() => agencySiteService.saveContent(content.value), t('agencySite.editor.saved'))
const saveTags = (slugs) => run(() => agencySiteService.setTags(slugs), t('agencySite.editor.saved'))
const saveSettings = () => run(() => agencySiteService.saveSettings(settings.value), t('agencySite.editor.saved'))
const publish = (live) => run(
  () => agencySiteService.publish(live),
  live ? t('agencySite.editor.publishedNotice') : t('agencySite.editor.unpublishedNotice'),
)

onMounted(async () => {
  try {
    adopt(await agencySiteService.view())
  } catch (e) {
    loadError.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.se-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 16px;
  align-items: start;
}

.se-card,
.se-preview-card {
  padding: 0;
  overflow: hidden;
}

.se-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 18px 0;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
}

.se-tabs button {
  padding: 9px 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--ink-3);
  font-size: 14px;
  white-space: nowrap;
}

.se-tabs button.on {
  border-color: var(--gold);
  color: var(--ivy);
  font-weight: 700;
}

.se-pane {
  padding: 18px;
}

.se-note {
  margin: 0 0 14px;
  padding: 10px 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--gold) 14%, transparent);
  font-size: 13px;
}

.se-saved {
  margin: 12px 0 0;
  color: var(--ivy);
  font-size: 13px;
}

.se-error {
  margin: 12px 0 0;
  color: var(--red, #a33a2b);
  font-size: 13px;
}

.se-state {
  padding: 40px 0;
  color: var(--ink-3);
}

.se-preview-card {
  position: sticky;
  top: 16px;
}

.se-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
}

.se-devices {
  display: flex;
  gap: 4px;
}

.se-devices button {
  padding: 5px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--card);
  font-size: 12px;
}

.se-devices button.on {
  border-color: var(--ivy);
  color: var(--ivy);
  font-weight: 700;
}

.se-preview {
  max-height: calc(100vh - 140px);
  overflow: auto;
  background: #e6eae4;
  padding: 12px;
}

.se-preview :deep(.agency-site) {
  margin: 0 auto;
  box-shadow: 0 12px 40px #20352620;
}

.se-preview.phone :deep(.agency-site) {
  width: 390px;
  max-width: 100%;
}

@media (max-width: 1100px) {
  .se-layout {
    grid-template-columns: 1fr;
  }

  .se-preview-card {
    position: static;
  }
}
</style>

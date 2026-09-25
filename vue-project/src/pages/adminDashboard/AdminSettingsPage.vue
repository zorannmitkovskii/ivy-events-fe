<template>
  <div class="admin-page">
    <PageHeader :title="t('adminSettings.title')" :subtitle="t('adminSettings.subtitle')" />

    <section class="panel">
      <h3>{{ t('adminSettings.configuration') }}</h3>
      <nav class="links" :aria-label="t('adminSettings.configuration')">
        <RouterLink v-for="link in configLinks" :key="link.key" :to="link.to" class="config-link">
          <span class="config-icon" aria-hidden="true" v-html="link.icon" />
          <span>
            <span class="config-label">{{ link.label }}</span>
            <span class="config-note">{{ link.note }}</span>
          </span>
        </RouterLink>
      </nav>
      <!--
        No "Categories" link. Event categories are a compile-time enum
        (EventCategoryEnum), not rows anybody can edit, so a link here would go
        to a screen that cannot exist. Recorded on IVY-1103 rather than shipped
        as a dead card.
      -->
    </section>

    <section class="panel">
      <h3>{{ t('adminSettings.riskWindowTitle') }}</h3>
      <p class="explain">{{ t('adminSettings.riskWindowExplain') }}</p>

      <form class="risk-form" @submit.prevent="save">
        <label>
          <span>{{ t('adminSettings.organization') }}</span>
          <input
            v-model="orgId"
            list="known-organizations"
            :placeholder="t('adminSettings.organizationPlaceholder')"
            required
          />
          <datalist id="known-organizations">
            <option v-for="id in knownOrganizations" :key="id" :value="id" />
          </datalist>
        </label>

        <label>
          <span>{{ t('adminSettings.riskWindowDays') }}</span>
          <input v-model.number="riskWindowDays" type="number" min="1" max="365" required />
        </label>

        <button type="button" class="secondary" :disabled="!orgId || loading" @click="load">
          {{ loading ? t('adminSettings.loading') : t('adminSettings.loadCurrent') }}
        </button>
        <button type="submit" :disabled="!orgId || saving">
          {{ saving ? t('adminSettings.saving') : t('adminSettings.save') }}
        </button>

        <span v-if="isDefault && loaded" class="inherited">{{ t('adminSettings.inherited') }}</span>
      </form>

      <p v-if="saved" class="saved" role="status">{{ t('adminSettings.saved') }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>
  </div>
</template>

<script setup>
/**
 * The platform's configuration desk (IVY-1103).
 *
 * <p>Two jobs: the four places settings already live, gathered so they are not
 * five sidebar entries deep, and the per-tenant at-risk window, which had an
 * endpoint and no screen — an administrator could read an agency's window from
 * the API and had nowhere to change it.
 *
 * <p>The organization is typed or picked rather than chosen from a dropdown of
 * every tenant: no endpoint lists organizations, and inventing one for a
 * settings form would put a second source of truth next to the registry. The
 * suggestions come from the organizer directory, which already knows which
 * organizations have people in them.
 */
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { Icons } from '@/utils/icons.js'
import { analyticsService } from '@/services/analytics.service'
import { organizersService } from '@/services/organizers.service'
import { getErrorMessage } from '@/services/apiError'

const { t } = useI18n()
const route = useRoute()

const lang = computed(() => route.params.lang || 'mk')

const configLinks = computed(() => [
  {
    key: 'emailTemplates',
    icon: Icons.clipboardList,
    label: t('admin.sidebar.emailTemplates'),
    note: t('adminSettings.emailTemplatesNote'),
    to: `/${lang.value}/admin/email-templates`,
  },
  {
    key: 'invitationTemplates',
    icon: Icons.image,
    label: t('admin.sidebar.invitationTemplates'),
    note: t('adminSettings.invitationTemplatesNote'),
    to: `/${lang.value}/admin/invitation-templates`,
  },
  {
    key: 'packages',
    icon: Icons.package,
    label: t('admin.sidebar.packages'),
    note: t('adminSettings.packagesNote'),
    to: `/${lang.value}/admin/packages`,
  },
  {
    key: 'emailSend',
    icon: Icons.send,
    label: t('admin.sidebar.emailSend'),
    note: t('adminSettings.emailSendNote'),
    to: `/${lang.value}/admin/email-send`,
  },
])

const orgId = ref(route.query.orgId || '')
const riskWindowDays = ref(30)
const isDefault = ref(true)
const loaded = ref(false)
const loading = ref(false)
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const knownOrganizations = ref([])

onMounted(async () => {
  try {
    const response = await organizersService.list({ max: 100 })
    const data = response?.data ?? response
    knownOrganizations.value = [...new Set((data.rows || []).map((row) => row.orgId).filter(Boolean))]
  } catch {
    // Suggestions are a convenience. The field still takes a typed id, and a
    // directory that is briefly unavailable must not block a settings change.
    knownOrganizations.value = []
  }
  if (orgId.value) {
    await load()
  }
})

async function load() {
  error.value = ''
  saved.value = false
  loading.value = true
  try {
    const response = await analyticsService.riskWindow(orgId.value)
    const data = response?.data ?? response
    riskWindowDays.value = data.riskWindowDays
    isDefault.value = data.isDefault
    loaded.value = true
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function save() {
  error.value = ''
  saved.value = false
  saving.value = true
  try {
    const response = await analyticsService.setRiskWindow(orgId.value, riskWindowDays.value)
    const data = response?.data ?? response
    riskWindowDays.value = data.riskWindowDays
    isDefault.value = data.isDefault
    loaded.value = true
    saved.value = true
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>

.page-subtitle { font-size: 14px; color: var(--ink-3); margin: 4px 0 0; }

.panel {
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  padding: 20px; margin-bottom: 18px;
}
.panel h3 { margin: 0 0 12px; font-size: 16px; font-weight: 700; }
.explain { color: var(--ink-3); font-size: 13px; margin: 0 0 14px; }

.links { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.config-link {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px;
  text-decoration: none; color: inherit; background: #fff;
  transition: border-color 120ms ease;
}
.config-link:hover { border-color: var(--brand-main); }
.config-link:focus-visible { outline: 2px solid var(--brand-main); outline-offset: 2px; }
.config-icon { display: inline-flex; color: var(--brand-main); }
.config-icon :deep(svg) { width: 20px; height: 20px; }
.config-label { display: block; font-weight: 600; font-size: 14px; }
.config-note { display: block; font-size: 12px; color: var(--ink-4); margin-top: 2px; }

.risk-form { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
.risk-form label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; font-weight: 600; color: var(--ink-2); }
.risk-form input {
  padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px;
  font-size: 14px; min-width: 240px;
}
.risk-form input[type="number"] { min-width: 120px; }
.risk-form button {
  padding: 9px 18px; border: none; border-radius: 8px;
  background: var(--brand-main); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer;
}
.risk-form button.secondary { background: #fff; color: var(--ink-2); border: 1px solid var(--line); }
.risk-form button:disabled { opacity: 0.5; cursor: not-allowed; }

.inherited { font-size: 12px; color: var(--ink-4); }
.saved { margin-top: 12px; color: #059669; font-size: 13px; font-weight: 500; }
.error {
  margin-top: 12px; padding: 8px 12px; background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 8px; color: #dc2626; font-size: 13px; font-weight: 500;
}

@media (max-width: 600px) {
  .risk-form input { min-width: 0; width: 100%; }
  .risk-form label { width: 100%; }
}
</style>

<template>
  <div class="agency-settings">
    <PageHeader :title="t('agencySettings.title')">
      <template #actions>
        <div>
        <p class="sub">{{ t('agencySettings.subtitle') }}</p>
        </div>
        <RouterLink :to="dashboardLink" class="back">{{ t('agencySettings.backToDashboard') }}</RouterLink>
      </template>
    </PageHeader>

    <section class="panel">
      <h2>{{ t('agencySettings.riskWindowTitle') }}</h2>
      <p class="explain">{{ t('agencySettings.riskWindowExplain') }}</p>

      <form class="risk-form" @submit.prevent="save">
        <label>
          <span>{{ t('agencySettings.riskWindowDays') }}</span>
          <input v-model.number="riskWindowDays" type="number" min="1" max="365" required />
        </label>
        <button type="submit" :disabled="saving">
          {{ saving ? t('agencySettings.saving') : t('agencySettings.save') }}
        </button>
        <!--
          "Inherited" rather than showing 30 as though somebody picked it. The
          distinction matters the day the platform default moves.
        -->
        <span v-if="isDefault" class="inherited">{{ t('agencySettings.inherited') }}</span>
      </form>

      <p v-if="saved" class="saved" role="status">{{ t('agencySettings.saved') }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>
  </div>
</template>

<script setup>
/**
 * The agency's own settings (IVY-1202).
 *
 * <p>Split off the dashboard. A configuration form sitting inside an
 * operational overview made the overview read like a preferences screen, and
 * the two are looked at for different reasons and at different frequencies.
 * The dashboard still states which window it used and links here.
 */
import PageHeader from '@/components/ui/PageHeader.vue'
import { onMounted, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import { analyticsService } from '@/services/analytics.service'
import { getErrorMessage } from '@/services/apiError'

const { t } = useI18n()
const route = useRoute()

const riskWindowDays = ref(null)
const isDefault = ref(true)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const dashboardLink = computed(() => `/${route.params.lang || 'mk'}/org/dashboard`)

async function loadWindow() {
  try {
    const response = await analyticsService.agencyRiskWindow()
    const payload = response?.data ?? response
    riskWindowDays.value = payload?.riskWindowDays ?? null
    isDefault.value = Boolean(payload?.isDefault)
  } catch (e) {
    error.value = getErrorMessage(e)
  }
}

async function save() {
  if (saving.value) return
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const response = await analyticsService.setAgencyRiskWindow(riskWindowDays.value)
    const payload = response?.data ?? response
    riskWindowDays.value = payload?.riskWindowDays ?? riskWindowDays.value
    isDefault.value = false
    saved.value = true
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    saving.value = false
  }
}

onMounted(loadWindow)
</script>

<style scoped>
.agency-settings {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color, #0b0b0b);
}

.sub {
  margin: 4px 0 0;
  color: var(--text-muted, #52514e);
}

.panel {
  background: var(--cards-color, #fff);
  border: 1px solid var(--border-color, #e6e5e1);
  border-radius: 12px;
  padding: 16px;
  max-width: 640px;
}

.panel h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color, #0b0b0b);
}

.explain {
  margin: 6px 0 14px;
  color: var(--text-muted, #52514e);
  font-size: 0.88rem;
}

.risk-form {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.risk-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-muted, #52514e);
}

.risk-form input {
  border: 1px solid var(--border-color, #cbd0d6);
  border-radius: 8px;
  padding: 7px 10px;
  width: 120px;
  background: var(--cards-color, #fff);
  color: var(--text-color, #0b0b0b);
}

.risk-form button {
  border: 1px solid var(--border-color, #cbd0d6);
  background: var(--cards-color, #fff);
  color: var(--text-color, #0b0b0b);
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.risk-form button:disabled {
  opacity: 0.6;
  cursor: progress;
}

.inherited,
.saved {
  color: var(--text-muted, #52514e);
  font-size: 0.85rem;
}

.saved {
  color: #0a7a0a;
  font-weight: 600;
  margin: 12px 0 0;
}

.error {
  color: #b3261e;
  font-weight: 600;
  margin: 12px 0 0;
}
</style>

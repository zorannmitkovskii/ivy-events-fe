<template>
  <div class="agency-settings">
    <PageHead :title="t('agencySettings.title')" :subtitle="t('agencySettings.subtitle')">
      <template #actions>
        <RouterLink :to="dashboardLink" class="btn btn-ghost btn-sm back">{{ t('agencySettings.backToDashboard') }}</RouterLink>
      </template>
    </PageHead>

    <section class="card settings-card">
      <div class="settings-tabs" role="tablist">
        <button
          v-for="tab in TABS"
          :key="tab"
          type="button"
          role="tab"
          :aria-selected="active === tab"
          :class="{ on: active === tab }"
          @click="active = tab"
        >{{ t(`agencyScreens.settings.tab.${tab}`) }}</button>
      </div>

      <!-- General: the at-risk window is the one setting the agency owns
           here; the rest are the platform's and are shown as such. -->
      <div v-show="active === 'general'" class="pane">
        <h3>{{ t('agencySettings.riskWindowTitle') }}</h3>
        <p class="explain">{{ t('agencySettings.riskWindowExplain') }}</p>

        <form class="risk-form" @submit.prevent="save">
          <label>
            <span>{{ t('agencySettings.riskWindowDays') }}</span>
            <input v-model.number="riskWindowDays" type="number" min="1" max="365" required />
          </label>
          <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
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

        <!-- The agency's own working defaults. Saved per organization; a
             member reads them but only the owner changes them. -->
        <form class="prefs-form" @submit.prevent="savePrefs">
          <h3>{{ t('agencyScreens.settings.workingTitle') }}</h3>
          <div class="prefs-grid">
            <label class="field">
              <span>{{ t('agencyScreens.settings.timezone') }}</span>
              <input v-model="prefs.timezone" list="agency-timezones" :disabled="!isOwner" required />
              <datalist id="agency-timezones">
                <option v-for="zone in TIMEZONES" :key="zone" :value="zone" />
              </datalist>
            </label>
            <label class="field">
              <span>{{ t('agencyScreens.settings.currency') }}</span>
              <select v-model="prefs.currency" :disabled="!isOwner">
                <option v-for="code in currencyOptions" :key="code" :value="code">{{ code }}</option>
              </select>
            </label>
            <label class="field">
              <span>{{ t('agencyScreens.settings.language') }}</span>
              <select v-model="prefs.language" :disabled="!isOwner">
                <option v-for="code in LANGUAGES" :key="code" :value="code">{{ t(`agencyScreens.settings.languages.${code}`) }}</option>
              </select>
            </label>
          </div>
          <div v-if="isOwner" class="field-row">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="prefsSaving">{{ t('agencySettings.save') }}</button>
            <span v-if="prefsDefault" class="inherited">{{ t('agencySettings.inherited') }}</span>
          </div>
          <p v-else class="hint">{{ t('agencyScreens.settings.ownerOnly') }}</p>
        </form>
        <p v-if="prefsSaved" class="saved" role="status">{{ t('agencyScreens.settings.prefsSaved') }}</p>
        <p v-if="prefsError" class="error" role="alert">{{ prefsError }}</p>
      </div>

      <!-- Brand: saved to the agency's branding, which invitations and
           emails sent in its name read. -->
      <form v-show="active === 'brand'" class="pane brand-form" @submit.prevent="saveBrand">
        <label class="field"><span>{{ t('agencyScreens.settings.senderName') }}</span><input v-model="brand.senderName" maxlength="120" /></label>
        <label class="field"><span>{{ t('agencyScreens.settings.replyTo') }}</span><input v-model="brand.replyToEmail" type="email" maxlength="200" /></label>
        <label class="field color"><span>{{ t('agencyScreens.settings.primaryColor') }}</span><input v-model="brand.primaryColor" type="color" /></label>
        <label class="field color"><span>{{ t('agencyScreens.settings.surfaceColor') }}</span><input v-model="brand.surfaceColor" type="color" /></label>
        <label class="field color"><span>{{ t('agencyScreens.settings.textColor') }}</span><input v-model="brand.textColor" type="color" /></label>
        <div class="field-row">
          <button type="submit" class="btn btn-primary btn-sm" :disabled="brandSaving">{{ t('agencySettings.save') }}</button>
          <span v-if="brandSaved" class="saved" role="status">{{ t('agencyScreens.settings.brandSaved') }}</span>
          <span v-if="brandError" class="error" role="alert">{{ brandError }}</span>
        </div>
      </form>

      <!-- Notifications: one switch per kind, saved with the preferences. -->
      <form v-show="active === 'notifications'" class="pane" @submit.prevent="savePrefs">
        <ul class="lines">
          <li v-for="item in NOTIFICATIONS" :key="item.key" class="line">
            <label class="switch-row">
              <span>
                <b>{{ t(`agencyScreens.settings.notify.${item.key}.name`) }}</b>
                <small>{{ t(`agencyScreens.settings.notify.${item.key}.who`) }}</small>
              </span>
              <input v-model="prefs[item.field]" type="checkbox" :disabled="!isOwner" />
            </label>
          </li>
        </ul>
        <div v-if="isOwner" class="field-row">
          <button type="submit" class="btn btn-primary btn-sm" :disabled="prefsSaving">{{ t('agencySettings.save') }}</button>
        </div>
        <p v-else class="hint">{{ t('agencyScreens.settings.ownerOnly') }}</p>
        <p v-if="prefsSaved" class="saved" role="status">{{ t('agencyScreens.settings.prefsSaved') }}</p>
        <p v-if="prefsError" class="error" role="alert">{{ prefsError }}</p>
      </form>

      <!-- Plan: read from the agency's subscription; changing it is a
           billing flow of its own. -->
      <div v-show="active === 'plan'" class="pane">
        <dl v-if="plan" class="readonly">
          <div><dt>{{ t('agencyScreens.settings.planTier') }}</dt><dd>{{ plan.tier || '—' }}</dd></div>
          <div><dt>{{ t('agencyScreens.settings.planStatus') }}</dt><dd>{{ plan.active ? t('agencyScreens.settings.planActive') : t('agencyScreens.settings.planInactive') }}</dd></div>
          <div><dt>{{ t('agencyScreens.settings.planEvents') }}</dt><dd>{{ plan.activeEvents ?? 0 }}</dd></div>
          <div><dt>{{ t('agencyScreens.settings.planExpires') }}</dt><dd>{{ plan.expiresAt ? formatDay(plan.expiresAt, locale) : '—' }}</dd></div>
        </dl>
        <p v-else class="hint">{{ t('agencyScreens.settings.noPlan') }}</p>
        <p class="hint">{{ t('agencyScreens.settings.planNote') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
/**
 * The agency's settings (2026 agency design, "Поставки"; IVY-1202).
 *
 * <p>Four tabs. The at-risk window, the working defaults (timezone, currency,
 * language), the notifications and the branding all save to endpoints the
 * agency owns; the plan is read-only, because changing it is a billing flow of
 * its own. A member reads the preferences but only the owner changes them —
 * the server refuses a member's save as well.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { analyticsService } from '@/services/analytics.service'
import { crmService } from '@/services/crm.service'
import { getErrorMessage } from '@/services/apiError'
import { formatDay } from '@/utils/agencyFormat.js'
import { useAgencyRole } from '@/composables/useAgencyRole'
import { useAgencyPreferences } from '@/composables/useAgencyPreferences'

const TABS = ['general', 'brand', 'notifications', 'plan']
/** Each switch on the notifications tab, and the field it saves to. */
const NOTIFICATIONS = [
  { key: 'overdue', field: 'notifyOverdueTasks' },
  { key: 'deadlines', field: 'notifyEventDeadlines' },
  { key: 'rsvp', field: 'notifyRsvpReminders' },
  { key: 'vendors', field: 'notifyVendorConfirmations' },
]
const LANGUAGES = ['mk', 'en', 'sq']
/** The currencies an agency here plausibly budgets in; a saved one outside the list is still offered. */
const CURRENCIES = ['MKD', 'EUR', 'USD', 'ALL', 'RSD', 'BGN', 'CHF', 'GBP']
/** Suggestions for the timezone field; any zone the server accepts may be typed. */
const TIMEZONES = ['Europe/Skopje', 'Europe/Tirane', 'Europe/Belgrade', 'Europe/Sofia', 'Europe/Athens',
  'Europe/Istanbul', 'Europe/Vienna', 'Europe/Berlin', 'Europe/Zurich', 'Europe/London', 'America/New_York']
const PREF_DEFAULTS = {
  timezone: 'Europe/Skopje', currency: 'MKD', language: 'mk',
  notifyOverdueTasks: true, notifyEventDeadlines: true, notifyRsvpReminders: true, notifyVendorConfirmations: true,
}
const DEFAULT_COLORS = { primaryColor: '#1f3d2b', surfaceColor: '#fdfbf7', textColor: '#1d1b18' }

const { t, locale } = useI18n()
const route = useRoute()

const active = ref('general')

const riskWindowDays = ref(null)
const isDefault = ref(true)
const saving = ref(false)
const saved = ref(false)
const error = ref('')

const brand = reactive({ senderName: '', replyToEmail: '', logoKey: null, ...DEFAULT_COLORS })
const brandSaving = ref(false)
const brandSaved = ref(false)
const brandError = ref('')

const plan = ref(null)

const { isOwner } = useAgencyRole()
const { load: reloadPreferences } = useAgencyPreferences()
const prefs = reactive({ ...PREF_DEFAULTS })
const prefsDefault = ref(true)
const prefsSaving = ref(false)
const prefsSaved = ref(false)
const prefsError = ref('')

const currencyOptions = computed(() =>
  CURRENCIES.includes(prefs.currency) ? CURRENCIES : [prefs.currency, ...CURRENCIES])

const dashboardLink = computed(() => `/${route.params.lang || 'mk'}/agency/dashboard`)

const payloadOf = (response) => response?.data ?? response

async function loadWindow() {
  try {
    const payload = payloadOf(await analyticsService.agencyRiskWindow())
    riskWindowDays.value = payload?.riskWindowDays ?? null
    isDefault.value = Boolean(payload?.isDefault)
  } catch (e) {
    error.value = getErrorMessage(e)
  }
}

/** Branding and plan are other tabs; a failure there must not blank the window form. */
async function loadBrandAndPlan() {
  const [branding, currentPlan] = await Promise.all([
    crmService.branding().catch(() => null),
    crmService.plan().catch(() => null),
  ])
  const found = payloadOf(branding)
  if (found) {
    Object.assign(brand, Object.fromEntries(Object.entries(found).filter(([, value]) => value != null)))
  }
  plan.value = payloadOf(currentPlan) || null
}

async function save() {
  if (saving.value) return
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    const payload = payloadOf(await analyticsService.setAgencyRiskWindow(riskWindowDays.value))
    riskWindowDays.value = payload?.riskWindowDays ?? riskWindowDays.value
    isDefault.value = false
    saved.value = true
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    saving.value = false
  }
}

function applyPrefs(payload) {
  if (!payload) return
  Object.assign(prefs, Object.fromEntries(Object.keys(PREF_DEFAULTS).map((key) => [key, payload[key] ?? prefs[key]])))
  prefsDefault.value = Boolean(payload.isDefault)
}

async function loadPrefs() {
  try {
    applyPrefs(payloadOf(await crmService.agencySettings()))
  } catch (e) {
    prefsError.value = getErrorMessage(e)
  }
}

/** One save for both tabs that edit the preferences: they are one record on the server. */
async function savePrefs() {
  if (prefsSaving.value) return
  prefsSaving.value = true
  prefsSaved.value = false
  prefsError.value = ''
  try {
    applyPrefs(payloadOf(await crmService.saveAgencySettings({ ...prefs, timezone: prefs.timezone.trim() })))
    prefsSaved.value = true
    // Every screen that draws an amount reads the currency from here.
    reloadPreferences({ force: true })
  } catch (e) {
    prefsError.value = getErrorMessage(e)
  } finally {
    prefsSaving.value = false
  }
}

async function saveBrand() {
  brandSaving.value = true
  brandSaved.value = false
  brandError.value = ''
  try {
    await crmService.saveBranding({ ...brand })
    brandSaved.value = true
  } catch (e) {
    brandError.value = getErrorMessage(e)
  } finally {
    brandSaving.value = false
  }
}

onMounted(() => {
  loadWindow()
  loadPrefs()
  loadBrandAndPlan()
})
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
.settings-card {
  padding: 0;
  overflow: hidden;
}

.settings-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 18px 0;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
}

.settings-tabs button {
  padding: 9px 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--ink-3);
  font-size: 14px;
  white-space: nowrap;
}

.settings-tabs button.on {
  border-color: var(--gold);
  color: var(--ivy);
  font-weight: 700;
}

.pane {
  padding: 20px;
}

.pane h3 {
  margin: 0 0 4px;
  font-size: 18px;
}

.explain,
.hint {
  color: var(--ink-3);
  font-size: 13px;
}

.risk-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.risk-form label span,
.field span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12.5px;
  font-weight: 600;
}

.risk-form input,
.field input {
  min-height: 38px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  font: inherit;
  font-size: 14px;
}

.risk-form input {
  width: 110px;
}

.inherited {
  color: var(--ink-3);
  font-size: 13px;
  font-style: italic;
}

.readonly {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0 8px;
}

.readonly div {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--mist-2);
}

.readonly dt {
  color: var(--ink-3);
  font-size: 12px;
}

.readonly dd {
  margin: 4px 0 0;
  font-weight: 600;
}

.brand-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field input {
  width: 100%;
}

.field.color input {
  width: 64px;
  padding: 2px;
}

.prefs-form {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
}

.prefs-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.field select {
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--card);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
}

.field input:disabled,
.field select:disabled {
  opacity: 0.75;
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.switch-row b {
  display: block;
}

.switch-row input {
  width: 18px;
  height: 18px;
  accent-color: var(--ivy);
}

.field-row {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.saved {
  color: var(--moss);
  font-weight: 600;
}

.error {
  color: var(--rose-ink);
}

@media (max-width: 760px) {
  .readonly,
  .prefs-grid,
  .brand-form {
    grid-template-columns: 1fr;
  }
}
</style>

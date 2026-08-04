<template>
  <div class="microsite">
    <header class="head">
      <h1>{{ t('microsite.title') }}</h1>
      <p class="sub">{{ t('microsite.subtitle') }}</p>
    </header>

    <section class="card">
      <h2>{{ t('microsite.theme') }}</h2>
      <div class="themes">
        <button
          v-for="theme in THEMES"
          :key="theme"
          type="button"
          class="theme"
          :class="{ active: settings.theme === theme }"
          @click="chooseTheme(theme)"
        >
          {{ t(`microsite.themes.${theme}`) }}
        </button>
      </div>
      <!-- Fixed list, not a builder: these are checked for contrast and
           keyboard use once, and then they stay accessible whoever picks. -->
      <p class="hint">{{ t('microsite.themeHint') }}</p>
    </section>

    <section class="card">
      <h2>{{ t('microsite.visibility') }}</h2>
      <p class="status" :class="settings.published ? 'ok' : ''">
        {{ settings.published ? t('microsite.live') : t('microsite.notLive') }}
      </p>
      <div class="buttons">
        <button class="btn" @click="publish(!settings.published)">
          {{ settings.published ? t('microsite.unpublish') : t('microsite.publish') }}
        </button>
        <a class="link-btn" :href="previewHref" target="_blank" rel="noopener">
          {{ t('microsite.preview') }}
        </a>
      </div>
    </section>

    <section class="card">
      <h2>{{ t('microsite.domain') }}</h2>

      <template v-if="!settings.customDomain">
        <label class="field">
          <span>{{ t('microsite.yourDomain') }}</span>
          <input v-model="domain" type="text" placeholder="studio-ana.mk" />
        </label>
        <button class="btn" :disabled="!domain.trim()" @click="claim">
          {{ t('microsite.claim') }}
        </button>
      </template>

      <template v-else>
        <p class="domain">{{ settings.customDomain }}</p>
        <p class="status" :class="domainClass">{{ t(`microsite.domainStatus.${settings.domainStatus}`) }}</p>
        <p v-if="settings.domainError" class="hint">{{ settings.domainError }}</p>

        <!-- The record to publish, spelled out. A vendor doing this once a year
             should not have to work out what "TXT at a subdomain" means. -->
        <div v-if="claimDetails" class="record">
          <p class="record-line"><span>{{ t('microsite.recordType') }}</span> TXT</p>
          <p class="record-line"><span>{{ t('microsite.recordName') }}</span> {{ claimDetails.recordName }}</p>
          <p class="record-line"><span>{{ t('microsite.recordValue') }}</span> {{ claimDetails.token }}</p>
        </div>

        <div class="buttons">
          <button class="btn" @click="verify">{{ t('microsite.checkNow') }}</button>
          <button class="link-btn danger" @click="release">{{ t('microsite.release') }}</button>
        </div>
      </template>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/services/api'

const THEMES = ['CLASSIC', 'GALLERY', 'STAGE', 'EDITORIAL']

const { t, locale } = useI18n()

const settings = reactive({
  theme: 'CLASSIC',
  published: false,
  customDomain: null,
  domainStatus: 'NONE',
  domainError: null,
  verificationToken: null,
})

const claimDetails = ref(null)
const domain = ref('')
const error = ref('')

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(load)

async function load() {
  try {
    const loaded = unwrap(await api.get('/vendor-portal/microsite'))
    if (loaded) Object.assign(settings, loaded)
    rebuildRecordFromSettings()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

/** After a reload the token is on the settings, but the record name is not —
 *  it is derived the same way the server derives it. */
function rebuildRecordFromSettings() {
  if (settings.customDomain && settings.verificationToken) {
    claimDetails.value = {
      recordName: `_ivy-verify.${settings.customDomain}`,
      token: settings.verificationToken,
    }
  }
}

async function chooseTheme(theme) {
  error.value = ''
  try {
    Object.assign(settings, unwrap(await api.put('/vendor-portal/microsite/theme', { theme })))
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function publish(live) {
  error.value = ''
  try {
    Object.assign(settings, unwrap(await api.post(`/vendor-portal/microsite/publish?live=${live}`)))
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function claim() {
  error.value = ''
  try {
    claimDetails.value = unwrap(await api.post('/vendor-portal/microsite/domain',
      { domain: domain.value.trim() }))
    domain.value = ''
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function verify() {
  error.value = ''
  try {
    Object.assign(settings, unwrap(await api.post('/vendor-portal/microsite/domain/verify')))
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function release() {
  error.value = ''
  try {
    await api.del('/vendor-portal/microsite/domain')
    claimDetails.value = null
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

const domainClass = computed(() => ({
  ok: settings.domainStatus === 'ACTIVE',
  warn: ['PENDING_VERIFICATION', 'VERIFIED'].includes(settings.domainStatus),
  bad: settings.domainStatus === 'FAILED',
}))

const previewHref = computed(() => `/${locale.value}/vendor/microsite/preview`)
</script>

<style scoped>
.microsite { max-width: 600px; display: flex; flex-direction: column; gap: 16px; padding: 4px; }
.head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.card { border: 1px solid #ece8e0; border-radius: 10px; background: #fff; padding: 16px;
  display: flex; flex-direction: column; gap: 12px; }
.card h2 { margin: 0; font-size: 15px; }

.themes { display: flex; gap: 8px; flex-wrap: wrap; }
.theme { padding: 8px 16px; border: 1px solid #ddd8cf; border-radius: 999px;
  background: #fff; cursor: pointer; font-size: 14px; }
.theme.active { background: #5a7a52; color: #fff; border-color: #5a7a52; }

.status { margin: 0; padding: 8px 12px; border-radius: 8px; font-size: 13px; background: #f0efe9; }
.status.ok { background: #e6f2e2; color: #2f6b28; }
.status.warn { background: #fbf1dc; color: #8f6d1f; }
.status.bad { background: #fdeceb; color: #a3271f; }

.domain { margin: 0; font-family: ui-monospace, monospace; font-size: 15px; }

.record { padding: 12px; border-radius: 8px; background: #faf8f4; font-size: 13px; }
.record-line { margin: 0 0 6px; font-family: ui-monospace, monospace; word-break: break-all; }
.record-line span { display: inline-block; min-width: 90px; font-family: inherit; color: #8a8a8a; }

.field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.field input { padding: 8px 10px; border: 1px solid #ddd8cf; border-radius: 8px; font-size: 14px; }

.hint { margin: 0; font-size: 11.5px; color: #8a8a8a; }
.buttons { display: flex; gap: 14px; align-items: center; }

.btn { align-self: flex-start; padding: 9px 16px; border: 0; border-radius: 8px;
  background: #5a7a52; color: #fff; font-size: 14px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.link-btn { border: 0; background: none; color: #5a7a52; cursor: pointer;
  font-size: 13px; padding: 0; text-decoration: none; }
.link-btn.danger { color: #a3271f; }

.error { font-size: 13px; color: #a3271f; }
</style>

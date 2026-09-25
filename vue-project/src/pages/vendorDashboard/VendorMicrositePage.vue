<template>
  <div class="microsite">
    <PageHead :title="t('vendorWork.microsite.title')" :subtitle="t('vendorWork.microsite.subtitle')">
      <template #actions>
        <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'vendor.microsite.preview' }">{{ t('vendorWork.microsite.preview') }} ↗</RouterLink>
      </template>
    </PageHead>

    <div class="two-col">
      <section class="card tabs-card">
        <div class="pane-tabs" role="tablist">
          <button
            v-for="tab in TABS"
            :key="tab"
            type="button"
            role="tab"
            :aria-selected="active === tab"
            :class="{ on: active === tab }"
            @click="active = tab"
          >{{ t(`vendorWork.microsite.tab.${tab}`) }}</button>
        </div>

        <!-- Four checked treatments, not a builder: each is tested for contrast
             and keyboard use once, and stays accessible whoever picks it. -->
        <div v-show="active === 'design'" class="pane">
          <div class="templates">
            <button
              v-for="(theme, index) in THEMES"
              :key="theme"
              type="button"
              class="template"
              :class="{ active: settings.theme === theme }"
              :aria-pressed="settings.theme === theme"
              @click="chooseTheme(theme)"
            >
              <span class="template-preview" :class="`p-${theme.toLowerCase()}`" aria-hidden="true"></span>
              <b>{{ number(index) }} · {{ t(`vendorWork.microsite.theme.${theme}.name`) }}</b>
              <small>{{ t(`vendorWork.microsite.theme.${theme}.hint`) }}</small>
              <small class="template-desc">{{ t(`vendorMicrosite.models.${theme}.description`) }}</small>
            </button>
          </div>
          <p class="help">{{ t('vendorWork.microsite.themeHelp') }}</p>
        </div>

        <div v-if="active === 'content'" class="pane">
          <MicrositeContentEditor
            :content="settings.content"
            :theme="settings.theme"
            :media="portfolio"
            :vendor-name="profile?.name || ''"
            :saving="savingContent"
            @save="saveContent"
          />
        </div>

        <div v-show="active === 'sections'" class="pane">
          <label v-for="section in SECTIONS" :key="section" class="toggle-row">
            <span>
              <b>{{ t(`vendorWork.microsite.section.${section}.name`) }}</b>
              <small>{{ t(`vendorWork.microsite.section.${section}.hint`) }}</small>
            </span>
            <input v-model="settings.sections[section]" type="checkbox" @change="saveSettings" />
          </label>
          <label class="toggle-row">
            <span>
              <b>{{ t('vendorWork.microsite.section.form.name') }}</b>
              <small>{{ t('vendorWork.microsite.section.form.hint') }}</small>
            </span>
            <input type="checkbox" checked disabled />
          </label>
        </div>

        <form v-show="active === 'seo'" class="pane form-grid" @submit.prevent="saveSeo">
          <label class="field span2">
            <span>{{ t('vendorWork.microsite.link') }}</span>
            <div class="slug">
              <code>{{ linkPrefix }}</code>
              <input v-model="slugDraft" maxlength="80" pattern="[a-z0-9-]+" :aria-label="t('vendorWork.microsite.slug')" />
            </div>
          </label>
          <label class="field">
            <span>{{ t('vendorWork.microsite.seoTitle') }}</span>
            <input v-model="settings.seoTitle" maxlength="70" />
            <small>{{ (settings.seoTitle || '').length }}/70</small>
          </label>
          <label class="field">
            <span>{{ t('vendorWork.microsite.seoDescription') }}</span>
            <input v-model="settings.seoDescription" maxlength="160" />
            <small>{{ (settings.seoDescription || '').length }}/160</small>
          </label>
          <div class="span2">
            <button type="submit" class="btn btn-primary btn-sm">{{ t('vendorWork.microsite.saveSeo') }}</button>
          </div>

          <div class="span2 domain">
            <h3>{{ t('microsite.domain') }}</h3>
            <template v-if="!settings.customDomain">
              <label class="field">
                <span>{{ t('microsite.yourDomain') }}</span>
                <input v-model="domain" type="text" placeholder="studio-ana.mk" />
              </label>
              <button type="button" class="btn btn-ghost btn-sm" :disabled="!domain.trim()" @click="claim">{{ t('microsite.claim') }}</button>
            </template>
            <template v-else>
              <p class="domain-name">{{ settings.customDomain }}</p>
              <p class="status" :class="domainClass">{{ t(`microsite.domainStatus.${settings.domainStatus}`) }}</p>
              <p v-if="settings.domainError" class="help">{{ settings.domainError }}</p>
              <!-- The record to publish, spelled out. A vendor doing this once a year
                   should not have to work out what "TXT at a subdomain" means. -->
              <div v-if="claimDetails" class="record">
                <p><span>{{ t('microsite.recordType') }}</span> TXT</p>
                <p><span>{{ t('microsite.recordName') }}</span> {{ claimDetails.recordName }}</p>
                <p><span>{{ t('microsite.recordValue') }}</span> {{ claimDetails.token }}</p>
              </div>
              <div class="buttons">
                <button type="button" class="btn btn-ghost btn-sm" @click="verify">{{ t('microsite.checkNow') }}</button>
                <button type="button" class="link-btn danger" @click="release">{{ t('microsite.release') }}</button>
              </div>
            </template>
          </div>
        </form>

        <p v-if="saved" class="saved" role="status">{{ t('vendorWork.microsite.saved') }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </section>

      <aside class="card">
        <h3>{{ t('vendorWork.microsite.visibility') }}</h3>
        <p class="lede">{{ t('vendorWork.microsite.visibilityHint') }}</p>
        <span :class="['pill', settings.published ? 'green' : 'amber']">
          {{ settings.published ? t('vendorWork.microsite.live') : t('vendorWork.microsite.draftLong') }}
        </span>
        <ul class="lines">
          <li class="line">
            <div><b>{{ t('vendorWork.microsite.check.profile') }}</b><small>{{ approved ? t('vendorWork.approval.APPROVED') : t('vendorWork.microsite.check.profileTodo') }}</small></div>
            <span aria-hidden="true">{{ approved ? '✓' : '→' }}</span>
          </li>
          <li class="line">
            <div><b>{{ t('vendorWork.microsite.check.gallery') }}</b><small>{{ settings.sections.gallery ? t('vendorWork.microsite.check.galleryOn') : t('vendorWork.microsite.check.galleryOff') }}</small></div>
            <span aria-hidden="true">{{ settings.sections.gallery ? '✓' : '—' }}</span>
          </li>
          <li class="line">
            <div><b>{{ t('vendorWork.microsite.check.inquiries') }}</b><small>{{ t('vendorWork.microsite.check.inquiriesHint') }}</small></div>
            <span aria-hidden="true">✓</span>
          </li>
        </ul>
        <div class="buttons">
          <RouterLink class="btn btn-primary btn-sm" :to="{ name: 'vendor.microsite.preview' }">{{ t('vendorWork.microsite.preview') }} ↗</RouterLink>
          <button type="button" class="btn btn-ghost btn-sm" @click="publish(!settings.published)">
            {{ settings.published ? t('vendorWork.microsite.unpublish') : t('vendorWork.microsite.publish') }}
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
/**
 * The vendor's microsite settings (2026 vendor design, "Микро-сајт").
 *
 * <p>Three tabs: how it looks, which sections it shows, and where it lives —
 * the address, what search engines read, and a custom domain. The aside keeps
 * the one decision that matters in view: whether the page is public.
 */
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { api } from '@/services/api'
import { unwrap, vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { getErrorMessage } from '@/services/apiError'
import { useVendorProfile } from '@/composables/useVendorProfile'
import { resolveVendorHost } from '@/services/vendorHost'
import { vendorPortalService } from '@/services/vendorPortal.service'
import MicrositeContentEditor from '@/components/vendor/microsite/MicrositeContentEditor.vue'
import { THEMES } from '@/components/vendor/microsite/useMicrosite'

const TABS = ['design', 'content', 'sections', 'seo']
const SECTIONS = ['gallery', 'services', 'faq']

const { t } = useI18n()
const { profile, load: loadProfile, reset: resetProfile } = useVendorProfile()

const active = ref('design')
const settings = reactive({
  theme: 'CLASSIC',
  published: false,
  sections: { gallery: true, services: true, faq: true },
  seoTitle: '',
  seoDescription: '',
  slug: '',
  customDomain: null,
  domainStatus: 'NONE',
  domainError: null,
  verificationToken: null,
  content: {},
})
const slugDraft = ref('')
const claimDetails = ref(null)
const domain = ref('')
const error = ref('')
const saved = ref(false)
const portfolio = ref([])
const savingContent = ref(false)

const number = (index) => String(index + 1).padStart(2, '0')

const approved = computed(() => profile.value?.approvalStatus === 'APPROVED')
const linkPrefix = computed(() => `${resolveVendorHost().platformDomain}/vendors/`)

const domainClass = computed(() => ({
  ok: settings.domainStatus === 'ACTIVE',
  warn: ['PENDING_VERIFICATION', 'VERIFIED'].includes(settings.domainStatus),
  bad: settings.domainStatus === 'FAILED',
}))

function apply(loaded) {
  if (!loaded) return
  Object.assign(settings, loaded, { sections: { ...settings.sections, ...loaded.sections } })
  slugDraft.value = loaded.slug ?? slugDraft.value
  if (settings.customDomain && settings.verificationToken) {
    claimDetails.value = { recordName: `_ivy-verify.${settings.customDomain}`, token: settings.verificationToken }
  }
}

onMounted(async () => {
  loadProfile()
  vendorPortalService.listMedia().then((rows) => { portfolio.value = unwrap(rows) ?? [] }).catch(() => {})
  await run(async () => apply(unwrap(await vendorWorkspaceService.microsite())))
})

/** Every action here is one request and one answer to redraw from; errors land in one place. */
async function run(action, { confirm = false } = {}) {
  error.value = ''
  saved.value = false
  try {
    await action()
    saved.value = confirm
  } catch (failure) {
    error.value = getErrorMessage(failure)
  }
}

const chooseTheme = (theme) => run(async () => apply(unwrap(await vendorWorkspaceService.setTheme(theme))), { confirm: true })
const publish = (live) => run(async () => apply(unwrap(await vendorWorkspaceService.publish(live))))

const settingsPayload = () => ({
  sections: { ...settings.sections },
  seoTitle: settings.seoTitle || null,
  seoDescription: settings.seoDescription || null,
})

/** The content tab's save: the whole wording, cleaned and checked by the server. */
async function saveContent(content) {
  savingContent.value = true
  await run(async () => apply(unwrap(await vendorWorkspaceService.saveMicrositeContent(content))), { confirm: true })
  savingContent.value = false
}

const saveSettings = () => run(async () => apply(unwrap(await vendorWorkspaceService.saveMicrositeSettings(settingsPayload()))), { confirm: true })

/** The address first, then the texts — a taken slug should not leave the SEO half-saved. */
function saveSeo() {
  return run(async () => {
    if (slugDraft.value && slugDraft.value !== settings.slug) {
      await vendorWorkspaceService.setSlug(slugDraft.value)
      resetProfile()
      loadProfile()
    }
    apply(unwrap(await vendorWorkspaceService.saveMicrositeSettings(settingsPayload())))
  }, { confirm: true })
}

const claim = () => run(async () => {
  claimDetails.value = unwrap(await api.post('/vendor-portal/microsite/domain', { domain: domain.value.trim() }))
  domain.value = ''
  apply(unwrap(await vendorWorkspaceService.microsite()))
})

const verify = () => run(async () => apply(unwrap(await api.post('/vendor-portal/microsite/domain/verify'))))

const release = () => run(async () => {
  await api.del('/vendor-portal/microsite/domain')
  claimDetails.value = null
  apply(unwrap(await vendorWorkspaceService.microsite()))
})
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.tabs-card {
  padding: 0;
  overflow: hidden;
}

.pane-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 18px 0;
  border-bottom: 1px solid var(--line);
}

.pane-tabs button {
  padding: 9px 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--ink-3);
  font-size: 14px;
}

.pane-tabs button.on {
  border-color: var(--gold);
  color: var(--ivy);
  font-weight: 700;
}

.pane {
  padding: 18px;
}

.templates {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.template {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--card);
  text-align: left;
  color: inherit;
}

.template.active {
  border: 2px solid var(--moss);
  padding: 11px;
  background: var(--mist-2);
}

.template b {
  display: block;
  margin-top: 9px;
  font-size: 14px;
}

.template small {
  color: var(--ink-3);
  font-size: 12px;
}

.template .template-desc {
  display: block;
  margin-top: 6px;
  line-height: 1.4;
}

.template-preview {
  display: block;
  position: relative;
  height: 64px;
  border-radius: 6px;
  background: linear-gradient(110deg, #c0a989 42%, #e5dccd 43% 100%);
}

.template-preview::after {
  content: '';
  position: absolute;
  left: 54%;
  top: 19%;
  width: 35%;
  height: 5px;
  background: #587961;
  box-shadow: 0 11px 0 #b3c4b0, 0 22px 0 #d5dfcf;
}

.p-gallery {
  background: linear-gradient(90deg, #536e59 0 32%, #e1bf9a 32% 66%, #8b9e7e 66%);
}

.p-gallery::after {
  display: none;
}

.p-stage {
  background: linear-gradient(#d7c6ae 0 64%, #fffaf2 65%);
}

.p-stage::after {
  left: 12%;
  top: 76%;
  width: 70%;
  box-shadow: none;
}

.p-editorial {
  background: #faf9f4;
  border: 1px solid var(--line);
}

.p-editorial::after {
  left: 18%;
  top: 31%;
  width: 48%;
  background: #486d54;
  box-shadow: 0 12px 0 #c7d7c4, 0 24px 0 #e2e9dc;
}

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  border-top: 1px solid var(--line);
}

.toggle-row:first-child {
  border-top: 0;
}

.toggle-row b {
  display: block;
  font-size: 14px;
}

.toggle-row small {
  color: var(--ink-3);
  font-size: 12.5px;
}

.toggle-row input {
  width: 18px;
  height: 18px;
  accent-color: var(--ivy);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.span2 {
  grid-column: 1 / -1;
}

.field > span {
  display: block;
  margin-bottom: 5px;
  color: var(--ink-3);
  font-size: 12.5px;
  font-weight: 600;
}

.field input {
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

.field small,
.help {
  display: block;
  margin-top: 4px;
  color: var(--ink-3);
  font-size: 12.5px;
}

.slug {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
}

.slug code {
  padding: 0 8px;
  color: var(--ink-3);
  font-size: 13px;
  white-space: nowrap;
}

.slug input {
  border: 0;
  border-left: 1px solid var(--line);
  border-radius: 0;
}

.domain {
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.domain h3,
.card h3 {
  margin: 0 0 6px;
  font-size: 18px;
}

.domain-name {
  font-family: ui-monospace, monospace;
}

.status {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--mist-2);
  font-size: 13px;
}

.status.ok {
  background: var(--mist);
  color: var(--ivy);
}

.status.warn {
  background: var(--gold-soft);
  color: var(--gold-deep);
}

.status.bad {
  background: var(--rose);
  color: var(--rose-ink);
}

.record {
  margin: 10px 0;
  padding: 12px;
  border-radius: 8px;
  background: var(--mist-2);
  font-family: ui-monospace, monospace;
  font-size: 13px;
  word-break: break-all;
}

.record p {
  margin: 0 0 6px;
}

.record span {
  display: inline-block;
  min-width: 90px;
  color: var(--ink-3);
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 14px;
}

.link-btn {
  border: 0;
  background: none;
  font-size: 13px;
}

.link-btn.danger {
  color: var(--rose-ink);
}

.saved {
  padding: 0 18px 14px;
  color: var(--moss);
  font-weight: 600;
}

.error {
  padding: 0 18px 14px;
  color: var(--rose-ink);
}

@media (max-width: 1100px) {
  .templates {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1000px) {
  .two-col,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

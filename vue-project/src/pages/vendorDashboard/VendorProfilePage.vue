<template>
  <div class="vendor-profile">
    <PageHead :title="t('vendorWork.profile.title')" :subtitle="t('vendorWork.profile.subtitle')" />

    <p v-if="loadError" class="error" role="alert">{{ loadError }}</p>
    <p v-else-if="!form" class="muted">{{ t('common.loading') }}</p>

    <div v-else class="two-col">
      <section class="card form-card">
        <div class="pane-tabs" role="tablist">
          <button
            v-for="tab in TABS"
            :key="tab"
            type="button"
            role="tab"
            :aria-selected="active === tab"
            :class="{ on: active === tab }"
            @click="active = tab"
          >{{ tabLabel(tab) }}</button>
        </div>

        <form class="profile-form" @submit.prevent="save">
          <div v-show="active === 'basic'" class="form-grid">
            <label class="field"><span>{{ t('vendorWork.profile.name') }} *</span><input v-model="form.name" required maxlength="160" /></label>
            <label class="field"><span>{{ t('vendorWork.profile.tagline') }}</span><input v-model="form.tagline" maxlength="120" /></label>
            <label class="field span2">
              <span>{{ t('vendorWork.profile.description') }} *</span>
              <textarea v-model="form.description" required rows="5"></textarea>
              <small>{{ t('vendorWork.profile.descriptionHelp') }}</small>
            </label>
            <label class="field"><span>{{ t('vendorWork.profile.city') }} *</span><input v-model="form.city" required maxlength="80" /></label>
            <label class="field"><span>{{ t('vendorWork.profile.serviceArea') }}</span><input v-model="form.serviceArea" maxlength="200" /></label>
          </div>

          <div v-show="active === 'services'" class="form-grid">
            <label class="field span2">
              <span>{{ t('vendorWork.profile.services') }}</span>
              <input v-model="form.services" maxlength="300" />
              <small>{{ t('vendorWork.profile.servicesHelp') }}</small>
            </label>
            <label class="field"><span>{{ t('vendorWork.profile.delivery') }}</span><input v-model="form.delivery" maxlength="120" /></label>
            <label class="field">
              <span>{{ t('vendorWork.profile.availability') }}</span>
              <select v-model="form.availabilityMode">
                <option value="ON_REQUEST">{{ t('vendorWork.profile.availabilityMode.ON_REQUEST') }}</option>
                <option value="FREE_DATES">{{ t('vendorWork.profile.availabilityMode.FREE_DATES') }}</option>
              </select>
            </label>
            <label class="field span2">
              <span>{{ t('vendorWork.profile.included') }}</span>
              <textarea v-model="form.included" rows="3" :placeholder="t('vendorWork.profile.includedPlaceholder')"></textarea>
            </label>
          </div>

          <div v-show="active === 'contact'" class="form-grid">
            <label class="field"><span>{{ t('vendorWork.profile.email') }}</span><input v-model="form.email" type="email" maxlength="200" /></label>
            <label class="field"><span>{{ t('vendorWork.profile.phone') }}</span><input v-model="form.phone" maxlength="40" /></label>
            <label class="field"><span>Instagram</span><input v-model="form.instagram" maxlength="200" /></label>
            <label class="field"><span>{{ t('vendorWork.profile.website') }}</span><input v-model="form.website" type="url" placeholder="https://" maxlength="200" /></label>
            <p class="help span2">{{ t('vendorWork.profile.contactHelp') }}</p>
          </div>

          <div v-show="active === 'faq'" class="faq">
            <p class="help">{{ t('vendorWork.profile.faqHelp') }}</p>
            <fieldset v-for="(item, index) in form.faq" :key="index" class="faq-item">
              <legend class="visually-hidden">{{ t('vendorWork.profile.faqItem', { n: index + 1 }) }}</legend>
              <label class="field"><span>{{ t('vendorWork.profile.question') }}</span><input v-model="item.question" maxlength="200" /></label>
              <label class="field"><span>{{ t('vendorWork.profile.answer') }}</span><textarea v-model="item.answer" rows="3" maxlength="1000"></textarea></label>
              <button type="button" class="link-btn" @click="form.faq.splice(index, 1)">{{ t('vendorWork.profile.removeQuestion') }}</button>
            </fieldset>
            <button type="button" class="btn btn-ghost btn-sm" @click="form.faq.push({ question: '', answer: '' })">
              + {{ t('vendorWork.profile.addQuestion') }}
            </button>
          </div>

          <div v-show="active === 'tags'">
            <VendorTagPicker v-model="tags" />
          </div>

          <p v-if="saveError" class="error" role="alert">{{ saveError }}</p>
          <p v-if="savedAt" class="saved" role="status">{{ t('vendorWork.profile.saved') }}</p>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">{{ t('vendorWork.profile.save') }}</button>
            <RouterLink class="btn btn-ghost btn-sm" :to="{ name: 'vendor.microsite.preview' }">{{ t('vendorWork.profile.preview') }} ↗</RouterLink>
          </div>
        </form>
      </section>

      <aside class="card">
        <h3>{{ t('vendorWork.profile.statusTitle') }}</h3>
        <p class="lede">{{ t('vendorWork.profile.statusHint') }}</p>
        <ReadinessMeter :readiness="readiness" :approval-status="approvalStatus" />
        <RouterLink v-if="approvalStatus !== 'APPROVED'" class="text-link" :to="{ name: 'vendor.application' }">
          {{ t('vendorWork.profile.toApplication') }} →
        </RouterLink>
      </aside>
    </div>
  </div>
</template>

<script setup>
/**
 * The vendor's profile (2026 vendor design, "Мој профил").
 *
 * <p>Five tabs over one form, saved together: what the studio is, what it
 * offers, how to reach it, the questions couples ask before they write, and
 * the shared tags it is filed under (picked from the admin's list).
 * Changes go live on save — there is no draft-and-approve step for an
 * already-approved profile yet — so the aside keeps the readiness in view
 * and links the application for a vendor still waiting on approval.
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import ReadinessMeter from '@/components/vendor/ReadinessMeter.vue'
import VendorTagPicker from '@/components/vendor/VendorTagPicker.vue'
import { tagsService } from '@/services/tags.service'
import { unwrap, vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { getErrorMessage } from '@/services/apiError'
import { useVendorProfile } from '@/composables/useVendorProfile'

const TABS = ['basic', 'services', 'contact', 'faq', 'tags']
const EDITABLE = [
  'name', 'tagline', 'description', 'city', 'serviceArea', 'services', 'delivery',
  'availabilityMode', 'included', 'email', 'phone', 'instagram', 'website',
]

const { t, locale } = useI18n()
const { reset: resetCachedProfile, load: reloadCachedProfile } = useVendorProfile()

const active = ref('basic')
const form = ref(null)
const readiness = ref({ percent: 0, steps: [] })
const approvalStatus = ref('')
const loadError = ref('')
const saveError = ref('')
const saving = ref(false)
const savedAt = ref(null)
/** The shared tags picked, as slugs. Saved with the profile, through their own endpoint. */
const tags = ref([])

/** The tags tab is labelled from the shared tags' own copy. */
const tabLabel = (tab) => (tab === 'tags' ? t('tags.picker.tab') : t(`vendorWork.profile.tab.${tab}`))

function apply(profile) {
  const next = Object.fromEntries(EDITABLE.map((key) => [key, profile?.[key] ?? '']))
  next.availabilityMode = next.availabilityMode || 'ON_REQUEST'
  next.faq = (profile?.faq ?? []).map((item) => ({ question: item.question ?? '', answer: item.answer ?? '' }))
  form.value = next
  readiness.value = profile?.readiness ?? { percent: 0, steps: [] }
  approvalStatus.value = profile?.approvalStatus ?? ''
}

onMounted(async () => {
  try {
    const [profile, mine] = await Promise.all([
      vendorWorkspaceService.profile(),
      tagsService.mine(locale.value),
    ])
    apply(unwrap(profile))
    tags.value = (unwrap(mine) ?? []).map((tag) => tag.slug)
  } catch (failure) {
    loadError.value = getErrorMessage(failure)
  }
})

async function save() {
  saving.value = true
  saveError.value = ''
  savedAt.value = null
  try {
    const payload = {
      ...form.value,
      // Half-filled questions are dropped rather than saved as empty rows on the site.
      faq: form.value.faq.filter((item) => item.question.trim() && item.answer.trim()),
    }
    apply(unwrap(await vendorWorkspaceService.saveProfile(payload)))
    tags.value = (unwrap(await tagsService.setMine(tags.value, locale.value)) ?? []).map((tag) => tag.slug)
    savedAt.value = Date.now()
    // The sidebar's name comes from the cached profile; a renamed studio should show it.
    resetCachedProfile()
    reloadCachedProfile()
  } catch (failure) {
    saveError.value = getErrorMessage(failure)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped src="../../components/agency/agency-panels.css"></style>

<style scoped>
.two-col {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(300px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.form-card {
  padding: 0;
  overflow: hidden;
}

.pane-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 18px 0;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
}

.pane-tabs button {
  padding: 9px 10px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--ink-3);
  font-size: 14px;
  white-space: nowrap;
}

.pane-tabs button.on {
  border-color: var(--gold);
  color: var(--ivy);
  font-weight: 700;
}

.profile-form {
  padding: 18px;
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

.field input,
.field select,
.field textarea {
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

.faq {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.faq-item {
  width: 100%;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  display: grid;
  gap: 10px;
}

.link-btn {
  justify-self: start;
  border: 0;
  background: none;
  color: var(--rose-ink);
  font-size: 13px;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}

.card h3 {
  margin: 0 0 4px;
  font-size: 19px;
}

.text-link {
  display: inline-block;
  margin-top: 10px;
}

.saved {
  margin-top: 12px;
  color: var(--moss);
  font-weight: 600;
}

.error {
  margin-top: 12px;
  color: var(--rose-ink);
}

.muted {
  color: var(--ink-3);
}

@media (max-width: 1000px) {
  .two-col,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>

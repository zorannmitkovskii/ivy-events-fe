<template>
  <div class="application">
    <header class="head">
      <h1>{{ t('vendorApp.title') }}</h1>
      <p class="sub">{{ t('vendorApp.subtitle') }}</p>
    </header>

    <p v-if="loading" class="state">{{ t('directory.loading') }}</p>

    <!-- No application yet: the only thing to do is start one. -->
    <form v-else-if="!profile" class="card" @submit.prevent="apply">
      <label class="field">
        <span>{{ t('vendorApp.businessName') }}</span>
        <input v-model="newApplication.name" type="text" required />
      </label>

      <label class="field">
        <span>{{ t('vendorApp.whatYouDo') }}</span>
        <select v-model="newApplication.type" required>
          <option value="" disabled>{{ t('vendorApp.choose') }}</option>
          <option v-for="type in TYPES" :key="type" :value="type">
            {{ t(`vendorType.${type}`, readable(type)) }}
          </option>
        </select>
      </label>

      <button class="btn" type="submit" :disabled="!newApplication.name || !newApplication.type">
        {{ t('vendorApp.start') }}
      </button>
    </form>

    <template v-else>
      <!-- Status first. Everything else on the page depends on it. -->
      <p class="status" :class="statusClass" role="status">
        {{ t(`vendorApp.status.${profile.approvalStatus}`) }}
        <template v-if="profile.reviewNote"> — {{ profile.reviewNote }}</template>
      </p>

      <div class="completeness">
        <div class="bar"><div class="fill" :style="{ width: profile.completeness + '%' }"></div></div>
        <span>{{ t('vendorApp.complete', { n: profile.completeness }) }}</span>
      </div>

      <!-- Drawn from the schema the server sent, so one screen renders any
           vendor type and the two cannot drift apart. -->
      <fieldset class="card" :disabled="!editable">
        <legend class="visually-hidden">{{ t('vendorApp.title') }}</legend>

        <label v-for="field in profile.fields" :key="field.key" class="field">
          <span>
            {{ t(field.labelKey, readable(field.key)) }}
            <em v-if="field.required" class="required">{{ t('vendorApp.required') }}</em>
          </span>

          <textarea
            v-if="field.kind === 'LONG_TEXT'"
            v-model="values[field.key]"
            rows="4"
          ></textarea>
          <input
            v-else
            v-model="values[field.key]"
            :type="inputType(field.kind)"
          />
        </label>

        <div class="buttons">
          <button class="btn" @click="save">{{ t('vendorApp.save') }}</button>
          <button
            v-if="profile.approvalStatus === 'DRAFT' || profile.approvalStatus === 'CHANGES_REQUESTED'"
            class="link-btn"
            @click="submitApplication"
          >
            {{ t('vendorApp.submit') }}
          </button>
        </div>
      </fieldset>

      <section v-if="profile.slug" class="card">
        <h2>{{ t('vendorApp.address') }}</h2>
        <p class="address">/vendors/{{ categorySlug }}/{{ profile.slug }}</p>
        <label class="field">
          <span>{{ t('vendorApp.changeAddress') }}</span>
          <input v-model="newSlug" type="text" :placeholder="profile.slug" />
        </label>
        <!-- Said out loud: the old one keeps working, so renaming is not a
             decision somebody has to be afraid of. -->
        <p class="hint">{{ t('vendorApp.oldAddressKeepsWorking') }}</p>
        <button class="link-btn" :disabled="!newSlug.trim()" @click="changeSlug">
          {{ t('vendorApp.saveAddress') }}
        </button>
      </section>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { vendorApplicationService } from '@/services/vendorDirectory.service'

const TYPES = [
  'PHOTOGRAPHY', 'VENUE', 'CATERING', 'BAND', 'DJ', 'DECORATION', 'FLOWERS',
  'CAKE', 'MAKEUP_HAIR', 'BRIDAL_ATTIRE', 'GROOM_ATTIRE', 'TRANSPORTATION',
  'LIGHTING', 'ENTERTAINMENT', 'PRINTING', 'OTHER',
]

const { t } = useI18n()

const profile = ref(null)
const values = reactive({})
const loading = ref(true)
const error = ref('')
const newSlug = ref('')

const newApplication = reactive({ name: '', type: '' })

function unwrap(response) {
  return response?.data ?? response ?? null
}

onMounted(load)

async function load() {
  loading.value = true
  try {
    useLoadedProfile(unwrap(await vendorApplicationService.mine()))
  } catch {
    // No application yet is the ordinary first visit, not an error.
    profile.value = null
  } finally {
    loading.value = false
  }
}

function useLoadedProfile(loaded) {
  profile.value = loaded
  Object.keys(values).forEach(key => delete values[key])
  Object.assign(values, loaded?.values || {})
}

async function apply() {
  error.value = ''
  try {
    useLoadedProfile(unwrap(await vendorApplicationService.apply({ ...newApplication })))
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function save() {
  error.value = ''
  try {
    // Nulls rather than empty strings: a cleared field is a field with no
    // value, not a field containing nothing.
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value === '' ? null : value]))
    useLoadedProfile(unwrap(await vendorApplicationService.updateFields(payload)))
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function submitApplication() {
  error.value = ''
  try {
    await save()
    useLoadedProfile(unwrap(await vendorApplicationService.submit()))
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function changeSlug() {
  error.value = ''
  try {
    useLoadedProfile(unwrap(await vendorApplicationService.changeSlug(newSlug.value.trim())))
    newSlug.value = ''
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

const editable = computed(() =>
  ['DRAFT', 'CHANGES_REQUESTED', 'APPROVED'].includes(profile.value?.approvalStatus))

const statusClass = computed(() => ({
  ok: profile.value?.approvalStatus === 'APPROVED',
  warn: ['SUBMITTED', 'CHANGES_REQUESTED'].includes(profile.value?.approvalStatus),
  bad: ['REJECTED', 'SUSPENDED'].includes(profile.value?.approvalStatus),
}))

const categorySlug = computed(() =>
  (profile.value?.type || 'OTHER').toLowerCase().replace(/_/g, '-'))

function inputType(kind) {
  if (kind === 'NUMBER' || kind === 'MONEY') return 'number'
  if (kind === 'URL') return 'url'
  return 'text'
}

function readable(value) {
  return (value || '').toLowerCase().replace(/_/g, ' ')
}
</script>

<style scoped>
.application { max-width: 640px; display: flex; flex-direction: column; gap: 16px; padding: 4px; }
.head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.status { margin: 0; padding: 10px 14px; border-radius: 8px; font-size: 13.5px; background: #f0efe9; }
.status.ok { background: #e6f2e2; color: #2f6b28; }
.status.warn { background: #fbf1dc; color: #8f6d1f; }
.status.bad { background: #fdeceb; color: #a3271f; }

.completeness { display: flex; gap: 10px; align-items: center; font-size: 12.5px; color: #6b6b6b; }
.bar { flex: 1; height: 6px; border-radius: 3px; background: #ece8e0; overflow: hidden; }
.fill { height: 100%; background: #5a7a52; transition: width 200ms ease; }

.card { border: 1px solid #ece8e0; border-radius: 10px; background: #fff; padding: 16px;
  display: flex; flex-direction: column; gap: 12px; }
.card h2 { margin: 0; font-size: 15px; }
.card:disabled { opacity: 0.6; }

.field { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.field input, .field select, .field textarea {
  padding: 8px 10px; border: 1px solid #ddd8cf; border-radius: 8px;
  font-size: 14px; font-family: inherit;
}
.required { font-style: normal; color: #a3271f; font-size: 11px; margin-left: 4px; }

.address { margin: 0; font-family: ui-monospace, monospace; font-size: 13px; color: #4a4a4a; }
.hint { margin: 0; font-size: 11.5px; color: #8a8a8a; }

.buttons { display: flex; gap: 14px; align-items: center; }
.btn { align-self: flex-start; padding: 9px 16px; border: 0; border-radius: 8px;
  background: #5a7a52; color: #fff; font-size: 14px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: default; }
.link-btn { border: 0; background: none; color: #5a7a52; cursor: pointer; font-size: 13px; padding: 0; }
.link-btn:disabled { opacity: 0.5; cursor: default; }

.state { color: #6b6b6b; }
.error { font-size: 13px; color: #a3271f; }

.visually-hidden {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}
</style>

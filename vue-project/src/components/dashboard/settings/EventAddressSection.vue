<template>
  <section class="addr-card" aria-labelledby="addr-title" data-testid="event-address">
    <h2 id="addr-title" class="addr-title">{{ t('eventAddress.title') }}</h2>
    <p class="addr-lede">{{ t('eventAddress.lede', { domain }) }}</p>

    <p v-if="loading" class="addr-note">{{ t('eventAddress.loading') }}</p>

    <template v-else>
      <label class="addr-label" for="addr-input">{{ t('eventAddress.label') }}</label>
      <div class="addr-field" :class="{ invalid: problem }">
        <span class="addr-scheme" aria-hidden="true">https://</span>
        <input
          id="addr-input"
          v-model="draft"
          class="addr-input"
          type="text"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          maxlength="63"
          :aria-describedby="problem ? 'addr-status' : undefined"
          @input="scheduleCheck"
        />
        <span class="addr-domain">.{{ domain }}</span>
      </div>

      <p id="addr-status" class="addr-status" :class="statusTone" role="status" aria-live="polite">
        <template v-if="checking">{{ t('eventAddress.checking') }}</template>
        <template v-else-if="problem">
          {{ t(`eventAddress.problem.${problem}`, { label: normalised }) }}
          <button v-if="suggestion" type="button" class="addr-link" @click="useSuggestion">
            {{ t('eventAddress.useSuggestion', { label: suggestion }) }}
          </button>
        </template>
        <template v-else-if="isSaved">{{ t('eventAddress.saved') }}</template>
        <template v-else-if="normalised">{{ t('eventAddress.available', { label: normalised }) }}</template>
      </p>

      <label class="addr-switch">
        <input v-model="enabled" type="checkbox" />
        <span>{{ t('eventAddress.enable') }}</span>
      </label>

      <div class="addr-actions">
        <button type="button" class="addr-save" :disabled="saving || checking || !!problem || !draft" @click="save">
          {{ saving ? t('eventAddress.saving') : t('eventAddress.save') }}
        </button>
        <button v-if="liveUrl" type="button" class="addr-copy" @click="copy">
          {{ copied ? t('eventAddress.copied') : t('eventAddress.copy') }}
        </button>
        <a v-if="liveUrl" class="addr-open" :href="liveUrl" target="_blank" rel="noopener">{{ liveUrl }}</a>
      </div>

      <p v-if="saveError" class="addr-status bad" role="alert">{{ saveError }}</p>
      <p class="addr-note">{{ t('eventAddress.note') }}</p>
    </template>
  </section>
</template>

<script setup>
/**
 * An event's own invitation address (`ana-marko.ivyevents.mk`).
 *
 * <p>Free for every event. The server has the last word on what is free —
 * labels are shared with vendors and agencies — so every change is checked
 * there, a moment after typing stops. The invitation stays reachable at its
 * ordinary address either way; this is a second, easier door.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { eventAddressService } from '@/services/eventAddress.service'
import { platformDomain } from '@/services/vendorHost'

const props = defineProps({ eventId: { type: String, required: true } })

const CHECK_DELAY_MS = 350
const COPIED_FOR_MS = 2000

const { t } = useI18n()
const domain = platformDomain()

const loading = ref(true)
const draft = ref('')
const enabled = ref(false)
const saved = ref(null)
const checking = ref(false)
const problem = ref(null)
const suggestion = ref(null)
const normalised = ref('')
const saving = ref(false)
const saveError = ref('')
const copied = ref(false)
let timer = null
let lastCheck = 0

const isSaved = computed(() => saved.value?.label && saved.value.label === normalised.value)
const liveUrl = computed(() => (saved.value?.enabled ? saved.value.url : ''))
const statusTone = computed(() => (problem.value ? 'bad' : normalised.value && !checking.value ? 'good' : ''))

onMounted(load)
onBeforeUnmount(() => clearTimeout(timer))
watch(() => props.eventId, load)

async function load() {
  loading.value = true
  try {
    const address = await eventAddressService.get(props.eventId)
    saved.value = address?.label ? address : null
    draft.value = address?.label || address?.suggestion || ''
    enabled.value = !!address?.enabled
    await check()
  } catch {
    saveError.value = t('eventAddress.loadFailed')
  } finally {
    loading.value = false
  }
}

function scheduleCheck() {
  clearTimeout(timer)
  saveError.value = ''
  checking.value = true
  timer = setTimeout(check, CHECK_DELAY_MS)
}

async function check() {
  const label = draft.value.trim()
  if (!label) {
    checking.value = false
    problem.value = null
    normalised.value = ''
    return
  }
  const ticket = ++lastCheck
  checking.value = true
  try {
    const result = await eventAddressService.availability(props.eventId, label)
    if (ticket !== lastCheck) return
    normalised.value = result?.label || label
    problem.value = result?.available ? null : result?.reason || 'INVALID'
    suggestion.value = result?.available ? null : result?.suggestion || null
  } catch {
    if (ticket === lastCheck) problem.value = null
  } finally {
    if (ticket === lastCheck) checking.value = false
  }
}

function useSuggestion() {
  draft.value = suggestion.value
  check()
}

async function save() {
  saving.value = true
  saveError.value = ''
  try {
    saved.value = await eventAddressService.save(props.eventId, draft.value.trim(), enabled.value)
    draft.value = saved.value.label
    normalised.value = saved.value.label
    problem.value = null
  } catch (error) {
    saveError.value = error?.message || t('eventAddress.saveFailed')
    await check()
  } finally {
    saving.value = false
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(liveUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, COPIED_FOR_MS)
  } catch {
    copied.value = false
  }
}
</script>

<style scoped>
.addr-card {
  background: var(--card, #fff);
  border: 1px solid var(--line, #e6e3dc);
  border-radius: var(--radius-lg, 14px);
  padding: 22px 24px;
  margin-top: 16px;
}
.addr-title { margin: 0 0 4px; font-size: 18px; }
.addr-lede, .addr-note { margin: 0 0 14px; color: var(--ink-3, #6b665e); font-size: 14px; }
.addr-note { margin: 12px 0 0; font-size: 13px; }
.addr-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; }
.addr-field {
  display: flex; align-items: center; flex-wrap: wrap;
  border: 1px solid var(--line, #d9d5cc); border-radius: 10px;
  background: var(--card, #fff); padding: 0 12px; max-width: 560px;
}
.addr-field:focus-within { border-color: var(--ivy, #1f4a37); box-shadow: 0 0 0 3px rgba(31, 74, 55, .12); }
.addr-field.invalid { border-color: var(--danger, #b3261e); }
.addr-scheme, .addr-domain { color: var(--ink-3, #6b665e); font-size: 14px; white-space: nowrap; }
.addr-input {
  flex: 1 1 140px; min-width: 0; border: 0; outline: 0; background: transparent;
  padding: 10px 2px; font-size: 15px; font-weight: 600; color: var(--ink, #1d2a23);
}
.addr-status { min-height: 20px; margin: 6px 0 12px; font-size: 13px; color: var(--ink-3, #6b665e); }
.addr-status.good { color: var(--ivy, #1f4a37); }
.addr-status.bad { color: var(--danger, #b3261e); }
.addr-link { border: 0; background: none; padding: 0; margin-left: 6px; color: var(--ivy, #1f4a37); font-weight: 600; text-decoration: underline; cursor: pointer; }
.addr-switch { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.addr-switch input { width: 18px; height: 18px; accent-color: var(--ivy, #1f4a37); }
.addr-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 14px; }
.addr-save, .addr-copy { border-radius: 10px; padding: 9px 16px; font-size: 14px; font-weight: 600; cursor: pointer; }
.addr-save { border: 0; background: var(--ivy, #1f4a37); color: var(--on-ivy, #fff); }
.addr-save:disabled { opacity: .55; cursor: not-allowed; }
.addr-copy { border: 1px solid var(--line, #d9d5cc); background: var(--card, #fff); color: var(--ink, #1d2a23); }
.addr-open { font-size: 13px; color: var(--ivy, #1f4a37); word-break: break-all; }
@media (max-width: 600px) { .addr-card { padding: 18px 16px; } }
</style>

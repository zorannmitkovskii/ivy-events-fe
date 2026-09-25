<template>
  <div class="inquiry-form">
    <div v-if="sent" class="done" role="status">
      <span class="badge">{{ t('vendorWork.publicForm.sentBadge') }}</span>
      <h3>{{ t('vendorWork.publicForm.thanks') }}</h3>
      <p>{{ t('vendorWork.publicForm.sentBody') }}</p>
    </div>

    <form v-else novalidate @submit.prevent="submit">
      <h3>{{ t('vendorWork.publicForm.title') }}</h3>
      <p class="intro">{{ t('vendorWork.publicForm.intro') }}</p>

      <div class="grid">
        <label class="field"><span>{{ t('vendorWork.publicForm.name') }} *</span>
          <input v-model="form.name" required maxlength="120" autocomplete="name" /></label>
        <label class="field"><span>{{ t('vendorWork.publicForm.email') }} *</span>
          <input v-model="form.email" type="email" required maxlength="200" autocomplete="email" /></label>
        <label class="field"><span>{{ t('vendorWork.publicForm.date') }} *</span>
          <input v-model="form.eventDate" type="date" required :min="today" /></label>
        <label class="field"><span>{{ t('vendorWork.publicForm.type') }}</span>
          <select v-model="form.eventType">
            <option v-for="label in eventTypeLabels" :key="label" :value="label">{{ label }}</option>
          </select></label>
        <label class="field"><span>{{ t('vendorWork.publicForm.city') }} *</span>
          <input v-model="form.city" required maxlength="80" /></label>
        <label class="field"><span>{{ t('vendorWork.publicForm.guests') }}</span>
          <input v-model.number="form.guests" type="number" min="1" :placeholder="t('vendorWork.publicForm.optional')" /></label>
        <label class="field span2"><span>{{ t('vendorWork.publicForm.message') }} *</span>
          <textarea v-model="form.message" required maxlength="700" rows="4" :placeholder="t('vendorWork.publicForm.messagePlaceholder')"></textarea></label>

        <!-- Left empty by people and filled by bots. Off-screen rather than
             `display: none`, which some bots know to skip. -->
        <label class="trap" aria-hidden="true">
          Website <input v-model="form.website" tabindex="-1" autocomplete="off" />
        </label>

        <label class="consent span2">
          <input v-model="form.consent" type="checkbox" required />
          {{ t('vendorWork.publicForm.consent') }}
        </label>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="disabled" class="note">{{ t('vendorWork.publicForm.previewNote') }}</p>

      <button class="send" type="submit" :disabled="disabled || sending">{{ t('vendorWork.publicForm.send') }} →</button>
    </form>
  </div>
</template>

<script setup>
/**
 * The microsite's own inquiry form (2026 vendor design).
 *
 * <p>Anonymous: a couple reading a photographer's page should not have to
 * create an account to ask about a date. The server guards it instead — a
 * rate limit per address and per sender, and the honeypot field below — and
 * the inquiry lands in the vendor's inbox marked as coming from the microsite.
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { vendorWorkspaceService } from '@/services/vendorWorkspace.service'
import { getErrorMessage } from '@/services/apiError'
import { useEventCategories } from '@/composables/usePublicCatalog'
import { categoryLabelKey } from '@/helper/CategoryMapping.helper.js'

const props = defineProps({
  slug: { type: String, required: true },
  /** The vendor's own preview: drawn, never sent. */
  disabled: { type: Boolean, default: false },
})

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const { t } = useI18n()

/*
  The kinds of event a visitor can ask about are Ivy's event categories, from
  the same catalogue the landing page draws. The inquiry stores the type as
  text the vendor reads, so what is sent is the label in the visitor's
  language — the same as before, only no longer a hand-kept list of four.
*/
const { categories, load: loadCategories } = useEventCategories()
loadCategories()

const eventTypeLabels = computed(() => [
  ...categories.value.map(({ category }) => {
    const key = categoryLabelKey(category)
    return key ? t(key) : category
  }),
  t('vendorWork.publicForm.types.other'),
])

const today = new Date().toISOString().slice(0, 10)
const blank = () => ({
  name: '', email: '', eventDate: '', eventType: '', city: '', guests: null,
  message: '', consent: false, website: '',
})
const form = reactive(blank())
const sending = ref(false)
const sent = ref(false)
const error = ref('')

/** Checked here so a missing field is named before a round trip; the server checks again. */
function problem() {
  if (!form.name.trim() || !form.city.trim() || !form.message.trim() || !form.eventDate) {
    return t('vendorWork.publicForm.required')
  }
  if (!EMAIL.test(form.email.trim())) return t('vendorWork.publicForm.badEmail')
  if (form.eventDate < today) return t('vendorWork.publicForm.pastDate')
  if (!form.consent) return t('vendorWork.publicForm.needConsent')
  return ''
}

async function submit() {
  if (props.disabled) return
  error.value = problem()
  if (error.value) return
  sending.value = true
  try {
    await vendorWorkspaceService.sendPublicInquiry(props.slug, {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      message: form.message.trim(),
      guests: form.guests || null,
      eventType: form.eventType || null,
    })
    sent.value = true
    Object.assign(form, blank())
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.inquiry-form {
  padding: 24px;
  border: 1px solid var(--rule);
  border-radius: 12px;
  background: var(--ground);
}

h3 {
  margin: 0 0 4px;
  font-family: var(--display);
  font-size: 24px;
  font-weight: 400;
}

.intro,
.note {
  margin: 0 0 16px;
  color: var(--soft);
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.span2 {
  grid-column: 1 / -1;
}

.field span {
  display: block;
  margin-bottom: 5px;
  color: var(--soft);
  font-size: 12px;
  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  min-height: 38px;
  padding: 8px 10px;
  border: 1px solid var(--rule);
  border-radius: 8px;
  background: #fff;
  color: var(--ink);
  font: inherit;
  font-size: 14px;
}

.trap {
  position: absolute;
  left: -10000px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.consent {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--soft);
  font-size: 13px;
}

.send {
  margin-top: 16px;
  padding: 11px 20px;
  border: 0;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.send:disabled {
  opacity: 0.55;
  cursor: default;
}

.error {
  margin: 12px 0 0;
  color: #b3261e;
  font-size: 13px;
}

.done .badge {
  display: inline-block;
  padding: 4px 9px;
  border-radius: 7px;
  background: #e9f4e9;
  color: #347451;
  font-size: 12px;
  font-weight: 700;
}

.done h3 {
  margin-top: 12px;
}

.done p {
  color: var(--soft);
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

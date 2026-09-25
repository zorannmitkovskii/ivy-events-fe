<template>
  <div v-if="sent" class="am-form-success" role="status">
    <strong>{{ t('agencySite.form.sentTitle') }}</strong><br />
    {{ t('agencySite.form.sentBody') }}
    <button type="button" @click="reset">{{ t('agencySite.form.again') }}</button>
  </div>

  <form v-else class="am-request-form" novalidate @submit.prevent="submit">
    <h3>{{ t('agencySite.form.title') }}</h3>
    <p class="am-form-help">{{ t('agencySite.form.help') }}</p>

    <div class="am-fields">
      <label>{{ t('agencySite.form.name') }} *
        <input v-model="form.name" name="name" autocomplete="name" required maxlength="120"
               :placeholder="t('agencySite.form.namePlaceholder')" /></label>
      <label>{{ t('agencySite.form.email') }} *
        <input v-model="form.email" name="email" type="email" autocomplete="email" required maxlength="200"
               placeholder="ime@example.com" /></label>
      <label>{{ t('agencySite.form.type') }} *
        <select v-model="form.type" name="type" required>
          <option value="">{{ t('agencySite.form.typePick') }}</option>
          <option v-for="key in EVENT_TYPES" :key="key" :value="t(`agencySite.form.types.${key}`)">
            {{ t(`agencySite.form.types.${key}`) }}
          </option>
        </select></label>
      <label>{{ t('agencySite.form.date') }} *
        <input v-model="form.date" name="date" required maxlength="80" :placeholder="t('agencySite.form.datePlaceholder')" /></label>
      <label>{{ t('agencySite.form.city') }} *
        <input v-model="form.city" name="city" required maxlength="120" :placeholder="t('agencySite.form.cityPlaceholder')" /></label>
      <label>{{ t('agencySite.form.guests') }}
        <input v-model.number="form.guests" name="guests" type="number" min="1" :placeholder="t('agencySite.form.optional')" /></label>
      <label class="am-wide">{{ t('agencySite.form.message') }} *
        <textarea v-model="form.message" name="message" :maxlength="MAX_MESSAGE" required
                  :placeholder="t('agencySite.form.messagePlaceholder')"></textarea></label>

      <label class="am-trap" aria-hidden="true">Website
        <input v-model="form.website" name="website" tabindex="-1" autocomplete="off" /></label>

      <label class="am-wide am-consent">
        <input v-model="form.consent" name="consent" type="checkbox" required />
        {{ t('agencySite.form.consent') }}
      </label>
    </div>

    <p v-if="preview" class="am-privacy">{{ t('agencySite.form.previewNote') }}</p>
    <p v-if="error" class="am-error" role="alert">{{ error }}</p>

    <button type="submit" :disabled="preview || sending">
      {{ sending ? t('agencySite.form.sending') : `${t('agencySite.form.send')} ↗` }}
    </button>
  </form>
</template>

<script setup>
/**
 * The request form every agency layout ends with.
 *
 * <p>Anonymous. What it sends becomes a lead in the agency's pipeline; the
 * server guards it with a honeypot (the hidden field below), rate limits and
 * the consent box. In the editor's preview it is shown but sends nothing.
 */
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { agencySiteService } from '@/services/agencySite.service'
import { getErrorMessage } from '@/services/apiError'

const props = defineProps({
  slug: { type: String, default: '' },
  preview: { type: Boolean, default: false },
})

const EVENT_TYPES = ['corporate', 'conference', 'private', 'other']
const MAX_MESSAGE = 1500

const { t } = useI18n()

const blank = () => ({ name: '', email: '', type: '', date: '', city: '', guests: null, message: '', consent: false, website: '' })
const form = reactive(blank())
const sending = ref(false)
const sent = ref(false)
const error = ref('')

function missingField() {
  const required = ['name', 'email', 'type', 'date', 'city', 'message']
  return required.some((field) => !String(form[field] ?? '').trim()) || !form.consent
}

async function submit() {
  if (props.preview || sending.value) return
  if (missingField()) {
    error.value = t('agencySite.form.missing')
    return
  }
  error.value = ''
  sending.value = true
  try {
    await agencySiteService.sendInquiry(props.slug, { ...form, guests: form.guests || null })
    sent.value = true
  } catch (e) {
    error.value = getErrorMessage(e) || t('agencySite.form.failed')
  } finally {
    sending.value = false
  }
}

function reset() {
  Object.assign(form, blank())
  sent.value = false
}
</script>

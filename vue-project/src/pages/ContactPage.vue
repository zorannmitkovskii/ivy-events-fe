<template>
  <SitePage>
    <section class="page-hero">
      <div class="wrap">
        <Breadcrumb :current="$t('contact.title')" />
        <h1>{{ $t('contact.heroTitle') }}</h1>
        <p class="lead">{{ $t('contact.subtitle') }}</p>
      </div>
    </section>

    <section class="section" style="padding-top: 0">
      <div class="wrap">
        <div class="contact-grid">
          <div>
            <h2 style="font-size: 30px">{{ $t('contact.leadTitle') }}</h2>
            <div class="contact-list">
              <div>
                <b>{{ $t('contact.info.email') }}</b>
                <span><a :href="`mailto:${SUPPORT_EMAIL}`">{{ SUPPORT_EMAIL }}</a></span>
              </div>
              <div>
                <b>{{ $t('contact.hoursLabel') }}</b>
                <span>{{ $t('contact.hoursValue') }}</span>
              </div>
              <div>
                <b>{{ $t('contact.info.location') }}</b>
                <span>{{ $t('contact.info.city') }}</span>
              </div>
              <div>
                <b>{{ $t('contact.partnersLabel') }}</b>
                <span>{{ $t('contact.partnersValue') }}</span>
              </div>
            </div>
          </div>

          <!--
            The sent state replaces the form rather than sitting beside it: a
            confirmation that leaves a filled-in form on screen invites a
            second send of the same message.
          -->
          <form v-if="!success" class="form" @submit.prevent="submit">
            <label>
              {{ $t('contact.name') }}
              <input v-model="form.name" type="text" :placeholder="$t('contact.namePh')" required />
            </label>

            <label>
              {{ $t('contact.email') }}
              <input v-model="form.email" type="email" :placeholder="$t('contact.emailPh')" required />
            </label>

            <label>
              {{ $t('contact.subject') }}
              <select v-model="form.subject" required>
                <option v-for="key in SUBJECTS" :key="key" :value="$t(`contact.subjects.${key}`)">
                  {{ $t(`contact.subjects.${key}`) }}
                </option>
              </select>
            </label>

            <label>
              {{ $t('contact.eventDate') }}
              <input v-model="form.eventDate" type="date" />
            </label>

            <label class="wide">
              {{ $t('contact.message') }}
              <textarea v-model="form.message" :placeholder="$t('contact.messagePh')" required></textarea>
            </label>

            <p v-if="error" class="form-error wide" role="alert">{{ error }}</p>

            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? $t('contact.sending') : $t('contact.send') }}
            </button>
          </form>

          <div v-else class="form contact-sent">
            <div class="check" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h2>{{ $t('contact.successTitle') }}</h2>
            <p>{{ $t('contact.successText') }}</p>
            <button type="button" class="btn btn-ghost" @click="reset">{{ $t('contact.sendAnother') }}</button>
          </div>
        </div>
      </div>
    </section>
  </SitePage>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SitePage from '@/layouts/SitePage.vue'
import Breadcrumb from '@/components/ui/Breadcrumb.vue'
import { contactService } from '@/services/contact.service'
import { getErrorMessage } from '@/services/apiError'

const SUPPORT_EMAIL = 'hello@ivyevents.mk'

/*
  Five subjects, sent as the chosen label rather than as a code.

  `ContactUs.subject` is a free-text column read by a person on the admin
  screen, so a code would mean a lookup table on both sides for a value nobody
  filters on. The select replaces a free-text field: "Партнерство (агенција,
  ресторан)" is the enquiry the business most wants to spot, and it never got
  typed in a way anyone could search for.
*/
const SUBJECTS = ['invitation', 'billing', 'customDesign', 'partnership', 'other']

const { t } = useI18n()

function emptyForm() {
  return {
    name: '',
    email: '',
    subject: t('contact.subjects.invitation'),
    eventDate: '',
    message: '',
  }
}

const form = ref(emptyForm())
const submitting = ref(false)
const success = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await contactService.submitPublic({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      subject: form.value.subject,
      eventDate: form.value.eventDate || undefined,
      message: form.value.message.trim(),
    })
    success.value = true
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    submitting.value = false
  }
}

function reset() {
  form.value = emptyForm()
  success.value = false
  error.value = ''
}
</script>

<style scoped>
/* `.contact-grid`, `.contact-list` and `.form` are the design's, in
   `ivy/site.css`. What is local is the error line and the sent state, which
   it has no version of. */
.form-error {
  margin: 0;
  padding: 10px 14px;
  border: 1px solid var(--error);
  border-radius: var(--radius-control);
  background: var(--error-pale);
  color: var(--error);
  font-size: 14.5px;
}

.contact-sent {
  grid-template-columns: 1fr;
  justify-items: start;
  gap: 14px;
}

.contact-sent .check {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--moss);
  color: #fff;
}

.contact-sent .check svg {
  width: 24px;
  height: 24px;
}

.contact-sent p {
  color: var(--ink-2);
}
</style>

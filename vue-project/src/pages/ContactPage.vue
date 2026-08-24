<template>
  <SitePage>
    <section class="pagehero">
      <p class="tag">{{ $t('contact.heroEyebrow') }}</p>
      <h1>
        {{ $t('contact.heroTitle') }}<br>
        <em>{{ $t('contact.heroAccent') }}</em>
      </h1>
      <p>{{ $t('contact.subtitle') }}</p>
    </section>

    <section class="contactlayout">
      <div>
        <h2>{{ $t('contact.leadTitle') }}</h2>
        <p>{{ $t('contact.leadText') }}</p>
        <a :href="`mailto:${SUPPORT_EMAIL}`">{{ SUPPORT_EMAIL }} ↗</a>
        <div>
          <span>
            <b>{{ $t('contact.hoursLabel') }}</b>
            {{ $t('contact.hoursValue') }}
          </span>
          <span>
            <b>{{ $t('contact.replyLabel') }}</b>
            {{ $t('contact.replyValue') }}
          </span>
          <span>
            <b>{{ $t('contact.info.phone') }}</b>
            {{ SUPPORT_PHONE }}
          </span>
          <span>
            <b>{{ $t('contact.info.location') }}</b>
            {{ $t('contact.info.city') }}
          </span>
        </div>
      </div>

      <!--
        The success state replaces the form rather than sitting beside it. The
        old page had a separate card for it; here the column is one thing, and
        a confirmation that leaves the filled-in form on screen invites a
        second send.
      -->
      <form v-if="!success" @submit.prevent="submit">
        <label>
          {{ $t('contact.name') }}
          <input v-model="form.name" type="text" :placeholder="$t('contact.namePh')" required />
        </label>

        <label>
          {{ $t('contact.email') }}
          <input v-model="form.email" type="email" :placeholder="$t('contact.emailPh')" required />
        </label>

        <label>
          {{ $t('contact.phone') }}
          <input v-model="form.phone" type="tel" :placeholder="$t('contact.phonePh')" />
        </label>

        <label>
          {{ $t('contact.subject') }}
          <input v-model="form.subject" type="text" :placeholder="$t('contact.subjectPh')" required />
        </label>

        <label>
          {{ $t('contact.message') }}
          <textarea v-model="form.message" :placeholder="$t('contact.messagePh')" required></textarea>
        </label>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="btn" :disabled="submitting">
          {{ submitting ? $t('contact.sending') : $t('contact.send') }} ↗
        </button>
      </form>

      <form v-else class="contact-sent" @submit.prevent="reset">
        <p class="tag">✓</p>
        <h2>{{ $t('contact.successTitle') }}</h2>
        <p>{{ $t('contact.successText') }}</p>
        <button type="submit" class="btn">{{ $t('contact.send') }} ↗</button>
      </form>
    </section>
  </SitePage>
</template>

<script setup>
import { ref } from "vue";
import SitePage from "@/layouts/SitePage.vue";
import { contactService } from "@/services/contact.service";
import { getErrorMessage } from "@/services/apiError";

const SUPPORT_EMAIL = "info@ivy-events.com";
const SUPPORT_PHONE = "+389 70 123 456";

const form = ref({
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const submitting = ref(false);
const success = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    await contactService.submitPublic({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim() || undefined,
      subject: form.value.subject.trim(),
      message: form.value.message.trim(),
    });
    success.value = true;
  } catch (e) {
    error.value = getErrorMessage(e);
  } finally {
    submitting.value = false;
  }
}

function reset() {
  form.value = { name: "", email: "", phone: "", subject: "", message: "" };
  success.value = false;
  error.value = "";
}
</script>

<style scoped>
/* `.contactlayout` and everything in it is the design's, in `ivy/site.css`.
   What is local is the error line and the sent state, which it has no
   version of. */
.form-error {
  margin: 0;
  padding: 10px 14px;
  border: 1px solid rgba(163, 30, 44, 0.2);
  border-radius: var(--radius-control);
  background: var(--error-pale);
  color: var(--error);
  font-family: var(--font-ui);
  font-size: 12px;
}

.contact-sent {
  align-items: flex-start;
  justify-content: center;
  text-align: left;
}

.contact-sent .tag {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin: 0;
  border-radius: 50%;
  background: var(--ink);
  color: #fff;
  font-size: 18px;
  letter-spacing: 0;
}

.contact-sent p:not(.tag) {
  margin: 0;
  font: 14px/1.8 var(--font-display);
  color: var(--ink-3);
}
</style>

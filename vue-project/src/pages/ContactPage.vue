<template>
  <div class="contact-page">
    <Header />

    <!-- Hero -->
    <section class="contact-hero">
      <h1 class="contact-hero__title">{{ $t('contact.title') }}</h1>
      <p class="contact-hero__subtitle">{{ $t('contact.subtitle') }}</p>
    </section>

    <!-- Form Section -->
    <section class="contact-section">
      <!-- Success State -->
      <div v-if="success" class="success-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-main, #059669)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 class="success-card__title">{{ $t('contact.successTitle') }}</h2>
        <p class="success-card__text">{{ $t('contact.successText') }}</p>
      </div>

      <!-- Form -->
      <form v-else class="contact-form" @submit.prevent="submit">
        <div class="form-row">
          <div class="field">
            <label>{{ $t('contact.name') }} <span class="req">*</span></label>
            <input v-model="form.name" type="text" class="input" :placeholder="$t('contact.namePh')" required />
          </div>
          <div class="field">
            <label>{{ $t('contact.email') }} <span class="req">*</span></label>
            <input v-model="form.email" type="email" class="input" :placeholder="$t('contact.emailPh')" required />
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label>{{ $t('contact.phone') }}</label>
            <input v-model="form.phone" type="tel" class="input" :placeholder="$t('contact.phonePh')" />
          </div>
          <div class="field">
            <label>{{ $t('contact.subject') }} <span class="req">*</span></label>
            <input v-model="form.subject" type="text" class="input" :placeholder="$t('contact.subjectPh')" required />
          </div>
        </div>

        <div class="field">
          <label>{{ $t('contact.message') }} <span class="req">*</span></label>
          <textarea v-model="form.message" class="input textarea" :placeholder="$t('contact.messagePh')" rows="5" required></textarea>
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="btn-submit" :disabled="submitting">
          {{ submitting ? $t('contact.sending') : $t('contact.send') }}
        </button>
      </form>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from "vue";
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";
import { contactService } from "@/services/contact.service";

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
    await contactService.create({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim() || undefined,
      subject: form.value.subject.trim(),
      message: form.value.message.trim(),
    });
    success.value = true;
  } catch (e) {
    error.value = e.message || "Something went wrong. Please try again.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.contact-hero {
  text-align: center;
  padding: 80px 24px 56px;
  background: linear-gradient(135deg, var(--neutral-50, #f9fafb) 0%, var(--bg-white, #fff) 100%);
}

.contact-hero__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--brand-dark, #2f3e36);
  margin: 0 0 16px;
}

.contact-hero__subtitle {
  font-size: 1.125rem;
  color: var(--neutral-600, #4b5563);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.contact-section {
  max-width: 640px;
  margin: 0 auto;
  padding: 56px 24px;
  flex: 1;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.req {
  color: #dc2626;
}

.input {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.input:focus {
  border-color: var(--brand-main);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 120px;
}

.form-error {
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  margin: 0;
}

.btn-submit {
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  background: var(--brand-main);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  align-self: flex-start;
}

.btn-submit:hover:not(:disabled) {
  background: var(--brand-dark);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-card {
  text-align: center;
  padding: 48px 32px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 16px;
}

.success-card__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand-dark, #2f3e36);
  margin: 20px 0 12px;
}

.success-card__text {
  font-size: 1rem;
  color: var(--neutral-600, #4b5563);
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .contact-hero {
    padding: 48px 20px 36px;
  }

  .contact-hero__title {
    font-size: 1.75rem;
  }

  .contact-section {
    padding: 36px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

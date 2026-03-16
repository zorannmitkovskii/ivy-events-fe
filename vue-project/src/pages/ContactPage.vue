<template>
  <div class="contact-page">
    <Header />

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <span class="hero-eyebrow">{{ $t('contact.title') }}</span>
        <h1 class="hero-title">{{ $t('contact.subtitle') }}</h1>
      </div>
    </section>

    <!-- Main -->
    <section class="main-section">
      <div class="main-grid">
        <!-- Info Cards -->
        <div class="info-col">
          <div class="info-card">
            <div class="info-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <h3 class="info-label">Email</h3>
              <p class="info-value">info@ivy-events.com</p>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <div>
              <h3 class="info-label">Phone</h3>
              <p class="info-value">+389 70 123 456</p>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <h3 class="info-label">Location</h3>
              <p class="info-value">Skopje, North Macedonia</p>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <h3 class="info-label">Working Hours</h3>
              <p class="info-value">Mon - Fri, 9:00 - 18:00</p>
            </div>
          </div>
        </div>

        <!-- Form Card -->
        <div class="form-col">
          <!-- Success State -->
          <div v-if="success" class="success-card">
            <div class="success-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 class="success-title">{{ $t('contact.successTitle') }}</h2>
            <p class="success-text">{{ $t('contact.successText') }}</p>
            <button class="btn-again" @click="reset">Send another message</button>
          </div>

          <!-- Form -->
          <form v-else class="form" @submit.prevent="submit">
            <h2 class="form-heading">Send us a message</h2>

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
              <span v-if="submitting" class="btn-spinner"></span>
              {{ submitting ? $t('contact.sending') : $t('contact.send') }}
            </button>
          </form>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref } from "vue";
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";
import { contactService } from "@/services/contact.service";
import { getErrorMessage } from "@/services/apiError";

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
.contact-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafaf9;
}

/* ===== Hero ===== */
.hero {
  background: linear-gradient(160deg, var(--brand-main, #334338) 0%, #1a2b20 100%);
  padding: 100px 24px 72px;
  text-align: center;
}

.hero-inner {
  max-width: 680px;
  margin: 0 auto;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--brand-gold, #c4956a);
  margin-bottom: 16px;
}

.hero-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 400;
  color: #fff;
  margin: 0;
  line-height: 1.25;
}

/* ===== Main ===== */
.main-section {
  flex: 1;
  max-width: 1060px;
  width: 100%;
  margin: 0 auto;
  padding: 56px 24px 80px;
}

.main-grid {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 48px;
  align-items: start;
}

/* ===== Info Cards ===== */
.info-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 100px;
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0eeec;
  transition: box-shadow 0.2s, transform 0.2s;
}

.info-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.info-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(51, 67, 56, 0.06), rgba(196, 149, 106, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--brand-main, #334338);
}

.info-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #9ca3af;
  margin: 0 0 4px;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--brand-main, #334338);
  margin: 0;
  line-height: 1.4;
}

/* ===== Form Card ===== */
.form-col {
  background: #fff;
  border-radius: 20px;
  border: 1px solid #f0eeec;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.form-heading {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--brand-main, #334338);
  margin: 0 0 28px;
}

.form {
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

.req { color: var(--brand-gold, #c4956a); }

.input {
  padding: 12px 16px;
  border: 1.5px solid #e8e5e1;
  border-radius: 12px;
  font-size: 14px;
  background: #fafaf9;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
  color: #1a1a1a;
}

.input::placeholder {
  color: #bbb;
}

.input:focus {
  border-color: var(--brand-main, #334338);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(51, 67, 56, 0.08);
}

.textarea {
  resize: vertical;
  min-height: 130px;
}

.form-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  margin: 0;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  background: var(--brand-main, #334338);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.btn-submit:hover:not(:disabled) {
  background: #1a2b20;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(51, 67, 56, 0.25);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== Success ===== */
.success-card {
  text-align: center;
  padding: 40px 24px;
}

.success-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ecfdf5;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.success-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--brand-main, #334338);
  margin: 0 0 10px;
}

.success-text {
  font-size: 15px;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 24px;
}

.btn-again {
  padding: 10px 24px;
  border: 1.5px solid #e8e5e1;
  border-radius: 10px;
  background: #fff;
  color: var(--brand-main, #334338);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-again:hover {
  border-color: var(--brand-main, #334338);
  background: rgba(51, 67, 56, 0.04);
}

/* ===== Responsive ===== */
@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .info-col {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  }

  .info-card {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 72px 20px 48px;
  }

  .main-section {
    padding: 32px 16px 60px;
  }

  .form-col {
    padding: 28px 20px;
    border-radius: 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .info-col {
    flex-direction: column;
  }

  .info-card {
    min-width: unset;
  }

  .btn-submit {
    width: 100%;
    padding: 14px;
    align-self: stretch;
  }
}
</style>

<template>
  <div class="feedback-page">
    <Header />

    <!-- Hero -->
    <section class="feedback-hero">
      <h1 class="feedback-hero__title">{{ $t('feedback.title') }}</h1>
      <p class="feedback-hero__subtitle">{{ $t('feedback.subtitle') }}</p>
    </section>

    <!-- Form Section -->
    <section class="feedback-section">
      <!-- Missing eventId warning -->
      <div v-if="!eventId" class="info-card">
        <p>{{ $t('feedback.noEvent') }}</p>
      </div>

      <!-- Success State -->
      <div v-else-if="success" class="success-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--brand-main, #059669)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h2 class="success-card__title">{{ $t('feedback.successTitle') }}</h2>
        <p class="success-card__text">{{ $t('feedback.successText') }}</p>
      </div>

      <!-- Form -->
      <form v-else class="feedback-form" @submit.prevent="submit">
        <div class="field">
          <label>{{ $t('feedback.rating') }} <span class="req">*</span></label>
          <StarRating v-model="form.rating" :size="28" />
        </div>

        <div class="field">
          <label>{{ $t('feedback.comment') }}</label>
          <textarea v-model="form.comment" class="input textarea" :placeholder="$t('feedback.commentPh')" rows="5"></textarea>
        </div>

        <div class="field">
          <label>{{ $t('feedback.mediaUrl') }}</label>
          <input v-model="form.mediaUrl" type="url" class="input" :placeholder="$t('feedback.mediaUrlPh')" />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit" class="btn-submit" :disabled="submitting || !form.rating">
          {{ submitting ? $t('feedback.sending') : $t('feedback.send') }}
        </button>
      </form>
    </section>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";
import StarRating from "@/components/ui/StarRating.vue";
import { feedbackService } from "@/services/feedback.service";

const route = useRoute();

const eventId = computed(() => route.query.eventId || "");
const guestId = computed(() => route.query.guestId || "");

const form = ref({
  rating: 0,
  comment: "",
  mediaUrl: "",
});

const submitting = ref(false);
const success = ref(false);
const error = ref("");

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    await feedbackService.submit({
      eventId: eventId.value,
      guestId: guestId.value || undefined,
      rating: form.value.rating,
      comment: form.value.comment || undefined,
      mediaUrl: form.value.mediaUrl || undefined,
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
.feedback-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.feedback-hero {
  text-align: center;
  padding: 80px 24px 56px;
  background: linear-gradient(135deg, var(--neutral-50, #f9fafb) 0%, var(--bg-white, #fff) 100%);
}

.feedback-hero__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--brand-dark, #2f3e36);
  margin: 0 0 16px;
}

.feedback-hero__subtitle {
  font-size: 1.125rem;
  color: var(--neutral-600, #4b5563);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.feedback-section {
  max-width: 640px;
  margin: 0 auto;
  padding: 56px 24px;
  flex: 1;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.info-card {
  text-align: center;
  padding: 32px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  color: #1e40af;
  font-size: 15px;
}

.info-card p {
  margin: 0;
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
  .feedback-hero {
    padding: 48px 20px 36px;
  }

  .feedback-hero__title {
    font-size: 1.75rem;
  }

  .feedback-section {
    padding: 36px 20px;
  }
}
</style>

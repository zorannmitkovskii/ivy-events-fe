<template>
  <section class="coming-soon-wrapper">
    <!-- Background pattern -->
    <div class="coming-soon-bg">
      <span v-for="i in 200" :key="i">{{$t('comingSoon.bgBrand')}}</span>
    </div>

    <!-- Hero title -->
    <div class="hero mb-4">
      <h1 class="title text-primary-main">{{$t('comingSoon.title')}}</h1>
    </div>

    <!-- Card -->
    <div class="coming-soon-card">
      <h2 class="subtitle text-primary-main">
        {{$t('comingSoon.subtitle')}}
      </h2>

      <p class="description text-primary-main">
        {{$t('comingSoon.description')}}
      </p>

      <form class="notify-form" @submit.prevent="onSubmit">
        <input
          type="email"
          :placeholder="$t('comingSoon.emailPlaceholder')"
          class="email-input"
          v-model="email"
          :disabled="loading || success"
          required
        />

        <button class="notify-button text-white" :disabled="loading || success">
          <template v-if="loading">{{$t('comingSoon.button.loading')}}</template>
          <template v-else-if="success">{{$t('comingSoon.button.success')}}</template>
          <template v-else><span v-html="$t('comingSoon.button.default')"></span></template>
        </button>

        <small class="privacy-note">
          {{$t('comingSoon.privacy.line1')}}<br />
          {{$t('comingSoon.privacy.line2')}}
        </small>
        <p v-if="success" class="success-note">{{$t('comingSoon.successNote')}}</p>
        <p v-if="errorMessage" class="error-note">{{ errorMessage }}</p>
      </form>

      <!-- Benefits -->
      <div class="benefits-row">
        <span class="benefit"><span class="dot"></span> {{$t('comingSoon.benefits.earlyAccess')}}</span>
        <span class="benefit"><span class="dot"></span> {{$t('comingSoon.benefits.exclusivePerks')}}</span>
        <span class="benefit"><span class="dot"></span> {{$t('comingSoon.benefits.priorityUpdates')}}</span>
      </div>

    </div>

    <!-- Social -->
    <div class="social mt-xl-5 mt-3">
      <!-- Instagram -->
      <a
        href="https://www.instagram.com/ivyevents.mk/"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="$t('comingSoon.social.instagram')"
      >
        <i class="fab fa-instagram"></i>
      </a>

      <!-- Facebook -->
      <a
        href="https://www.facebook.com/profile.php?id=61584269536071"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="$t('comingSoon.social.facebook')"
      >
        <i class="fab fa-facebook-f"></i>
      </a>
    </div>


    <!-- Footer -->
    <p class="footer">
      {{$t('comingSoon.footer')}}
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { subscribeToDiscounts } from '../services/backendApi'
import { t } from '@/i18n'

const email = ref('')
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')

const onSubmit = async () => {
  errorMessage.value = ''

  // Basic email validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value || !re.test(email.value)) {
    errorMessage.value = t('comingSoon.errors.invalidEmail')
    return
  }

  loading.value = true
  try {
    // Centralized API call
    await subscribeToDiscounts(email.value)
    success.value = true
  } catch (err) {
    const anyErr = err as any
    const status = anyErr?.response?.status
    if (status === 409) {
      errorMessage.value = t('comingSoon.errors.alreadyRegistered')
    } else if (status === 400) {
      errorMessage.value = t('comingSoon.errors.badRequest')
    } else {
      errorMessage.value = t('comingSoon.errors.generic')
    }
  } finally {
    loading.value = false
  }
}
</script>

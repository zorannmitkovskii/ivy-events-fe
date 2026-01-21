<template>
  <section class="coming-soon-wrapper">
    <!-- Background pattern -->
    <div class="coming-soon-bg">
      <span v-for="i in 200" :key="i">IVY EVENTS</span>
    </div>

    <!-- Hero title -->
    <div class="hero mb-4">
      <h1 class="title text-primary-main">Наскоро</h1>
    </div>

    <!-- Card -->
    <div class="coming-soon-card">
      <h2 class="subtitle text-primary-main">
        Подготвуваме нешто навистина посебно
      </h2>

      <p class="description text-primary-main">
        Работиме на модерна платформа за планирање на настани,
        создадена да ви заштеди време и да донесе целосна контрола
        над секој детал.
      </p>

      <form class="notify-form" @submit.prevent="onSubmit">
        <input
          type="email"
          placeholder="Внесете ја вашата е-пошта"
          class="email-input"
          v-model="email"
          :disabled="loading || success"
          required
        />

        <button class="notify-button text-white" :disabled="loading || success">
          <template v-if="loading">Се испраќа...</template>
          <template v-else-if="success">Запишано ✔</template>
          <template v-else>Пријави се и обезбеди <b>20% попуст</b></template>
        </button>

        <small class="privacy-note">
          Кодот ќе биде испратен по е-пошта.
          Вашата е-пошта е безбедна. Испраќаме само важни известувања.
        </small>
        <p v-if="success" class="success-note">Успешно се пријавивте! Проверете ја вашата е-пошта за кодот.</p>
        <p v-if="errorMessage" class="error-note">{{ errorMessage }}</p>
      </form>

      <!-- Benefits -->
      <div class="benefits-row">
        <span class="benefit"><span class="dot"></span> Ран пристап</span>
        <span class="benefit"><span class="dot"></span> Ексклузивни поволности</span>
        <span class="benefit"><span class="dot"></span> Приоритетни известувања</span>
      </div>

    </div>

    <!-- Social -->
    <div class="social mt-xl-5 mt-3">
      <a href="https://www.instagram.com/ivyandinc.wedding"><i class="fab fa-instagram"></i></a>
      <a href="https://www.facebook.com/profile.php?id=61584269536071"><i class="fab fa-facebook-f"></i></a>
<!--      <a href="#"><i class="fab fa-tiktok"></i></a>-->
    </div>

    <!-- Footer -->
    <p class="footer">
      © 2026 Ivy Events. Сите права се задржани.
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { subscribeToDiscounts } from '../services/backendApi'

const email = ref('')
const loading = ref(false)
const success = ref(false)
const errorMessage = ref('')

const onSubmit = async () => {
  errorMessage.value = ''

  // Basic email validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value || !re.test(email.value)) {
    errorMessage.value = 'Внесете валидна е-пошта.'
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
      errorMessage.value = 'Оваа е-пошта веќе е пријавена.'
    } else if (status === 400) {
      errorMessage.value = 'Невалидно барање. Проверете ја е-поштата и обидете се повторно.'
    } else {
      errorMessage.value = 'Настана грешка. Обидете се повторно подоцна.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="coming-soon-wrapper">
    <!-- Background pattern -->
    <div class="coming-soon-bg">
      <span v-for="i in 200" :key="i">МОЈ ПЛАНЕР</span>
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

      <form class="notify-form" @submit.prevent>
        <input
          type="email"
          placeholder="Внесете ја вашата е-пошта"
          class="email-input"
          required
        />

        <button class="notify-button text-white">
          Пријави се и обезбеди <b>20% попуст</b>
        </button>

        <small class="privacy-note">
          Кодот ќе биде испратен по е-пошта.
          Вашата е-пошта е безбедна. Испраќаме само важни известувања.
        </small>
      </form>

      <!-- Benefits -->
      <div class="benefits-row">
        <span class="benefit"><span class="dot"></span> Ран пристап</span>
        <span class="benefit"><span class="dot"></span> Ексклузивни поволности</span>
        <span class="benefit"><span class="dot"></span> Приоритетни известувања</span>
      </div>

    </div>

    <!-- Social -->
    <div class="social mt-5">
      <a href="#"><i class="fab fa-instagram"></i></a>
      <a href="#"><i class="fab fa-facebook-f"></i></a>
      <a href="#"><i class="fab fa-tiktok"></i></a>
    </div>

    <!-- Footer -->
    <p class="footer">
      © 2026 Ivy Events. Сите права се задржани.
    </p>
  </section>
</template>

<style scoped>
.coming-soon-wrapper {
  position: relative;
  min-height: 100vh;
  background: var(--soft-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Background text */
.coming-soon-bg {
  position: absolute;
  inset: -50%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 48px;
  transform: rotate(-45deg);
  opacity: 0.04;
  pointer-events: none;
}

.coming-soon-bg span {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--primary-dark);
  white-space: nowrap;
}

/* Hero */
.title {
  font-size: 64px;
  font-weight: 800;
  letter-spacing: 2px;
}

/* Card */
.coming-soon-card {
  z-index: 2;
  max-width: 520px;
  width: 100%;
  padding: 42px 36px;
  background: #fff;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.12);
}

.subtitle {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 14px;
}

.description {
  font-size: 15px;
  line-height: 1.65;
  margin-bottom: 28px;
}

/* Form */
.notify-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.email-input {
  height: 48px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.email-input:focus {
  outline: none;
  border-color: var(--primary-main);
}

.notify-button {
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  background: #C9A24D;
  transition: background-color 0.2s ease;
  //color: #2A2A2A!important;
}

.privacy-note {
  font-size: 12px;
  color: #6b6b6b;
}

.notify-button:hover {
  background: #e2bf6f!important;
}

/* Benefits */
.benefits-row {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid rgba(21, 41, 30, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px; /* spacing between benefits */
  font-size: 10px;
  max-width: 520px;
}

.benefit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #c9a24d;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(201, 162, 77, 0.5);
}

.divider {
  color: #bfc8af;
}

.social {
  display: flex;
  justify-content: center;
  gap: 24px; /* зголеми ако сакаш повеќе простор */
}

/* Social */
.social a {
  font-size: 18px;
  margin: 0 6px;
  color: var(--primary-main);
  transition: color 0.2s ease, transform 0.2s ease;
}

.social a:hover {
  color: #c9a24d;
  transform: translateY(-2px);
}

/* Footer */
.footer {
  margin-top: 18px;
  font-size: 12px;
  color: var(--primary-main);
}
</style>
<script setup lang="ts">
</script>

<template>
  <section class="wedding-intro py-5 text-white text-center position-relative overflow-hidden">
    <div class="container position-relative" style="z-index: 2;">
      <h2 class="fw-bold display-5 mb-3">It's our wedding!</h2>

      <p class="fs-5 mb-4 intro-text mx-auto" style="max-width: 900px;">
        What started as our little craziness has turned into the best thing in our lives,
        and we want to share it with you. The big day has finally arrived.
        The one we’ve dreamed of for so long.
      </p>

      <p class="fs-5 mb-4">The wedding begins in...</p>

      <!-- Countdown Box -->
      <div class="countdown-box bg-white text-brand-green shadow rounded-4 py-4 px-5 d-inline-flex">
        <div class="d-flex flex-column align-items-center px-4">
          <span class="count-number">{{ timeLeft.days }}</span>
          <span class="count-label">Days</span>
        </div>
        <div class="vr"></div>
        <div class="d-flex flex-column align-items-center px-4">
          <span class="count-number">{{ timeLeft.hours }}</span>
          <span class="count-label">Hours</span>
        </div>
        <div class="vr"></div>
        <div class="d-flex flex-column align-items-center px-4">
          <span class="count-number">{{ timeLeft.minutes }}</span>
          <span class="count-label">Min.</span>
        </div>
        <div class="vr"></div>
        <div class="d-flex flex-column align-items-center px-4">
          <span class="count-number">{{ timeLeft.seconds }}</span>
          <span class="count-label">Sec.</span>
        </div>
      </div>
    </div>

    <!-- Decorative background pattern -->
<!--    <img-->
<!--      src="/img/pattern.png"-->
<!--      alt="pattern"-->
<!--      class="position-absolute bottom-0 end-0 opacity-25 pattern-img"-->
<!--    />-->
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const weddingDate = new Date('2025-05-31T15:00:00') // SET YOUR WEDDING DATE

const timeLeft = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
let interval

function calculateTimeLeft() {
  const now = new Date()
  const diff = weddingDate - now

  if (diff <= 0) {
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  timeLeft.value = {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60)
  }
}

onMounted(() => {
  calculateTimeLeft()
  interval = setInterval(calculateTimeLeft, 1000)
})

onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.wedding-intro {
  background-color: #4f6b52; /* Your brand background color */
  padding-top: 80px;
  padding-bottom: 80px;
}

.text-brand-green {
  color: #2f5233;
}

.count-number {
  font-size: 2rem;
  font-weight: 700;
}

.count-label {
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 4px;
}

.pattern-img {
  width: 40%;
  max-width: 500px;
}

.vr {
  border-left: 1px solid #ddd;
  margin: 0 8px;
}
</style>

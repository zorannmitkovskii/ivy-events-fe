<template>
  <div class="header-banner">
    <div class="save-date-text">Save the Date</div>
    <div class="decorative-line"></div>
    <h1 class="couple-title">{{ brideName }} & {{ groomName }}</h1>

    <div class="countdown-grid">
      <div class="countdown-box">
        <span class="countdown-num">{{ countdown.days }}</span>
        <span class="countdown-text">Days</span>
      </div>
      <div class="countdown-box">
        <span class="countdown-num">{{ countdown.hours }}</span>
        <span class="countdown-text">Hours</span>
      </div>
      <div class="countdown-box">
        <span class="countdown-num">{{ countdown.minutes }}</span>
        <span class="countdown-text">Minutes</span>
      </div>
      <div class="countdown-box">
        <span class="countdown-num">{{ countdown.seconds }}</span>
        <span class="countdown-text">Seconds</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  brideName: {
    type: String,
    required: true
  },
  groomName: {
    type: String,
    required: true
  },
  weddingDate: {
    type: String,
    required: true
  }
});

const countdown = reactive({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
});

let countdownInterval = null;

function updateCountdown() {
  // Parse wedding date (you may need to adjust format)
  const weddingDate = new Date('2025-06-15T16:00:00');
  const now = new Date();
  const difference = weddingDate - now;

  if (difference > 0) {
    countdown.days = Math.floor(difference / (1000 * 60 * 60 * 24));
    countdown.hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    countdown.minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    countdown.seconds = Math.floor((difference % (1000 * 60)) / 1000);
  } else {
    countdown.days = 0;
    countdown.hours = 0;
    countdown.minutes = 0;
    countdown.seconds = 0;
  }
}

onMounted(() => {
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped>
.header-banner {
  text-align: center;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 254, 0.95) 100%);
  padding: 60px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
}

.save-date-text {
  font-family: 'Playfair Display', serif;
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #6ba5c8 0%, #4a8ab0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
}

.decorative-line {
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6ba5c8, transparent);
  margin: 20px auto;
}

.couple-title {
  font-family: 'Crimson Text', serif;
  font-size: 64px;
  font-weight: 600;
  color: #2d4a5a;
  margin: 20px 0;
  line-height: 1.2;
}

.countdown-grid {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 30px;
  flex-wrap: wrap;
}

.countdown-box {
  text-align: center;
  min-width: 70px;
}

.countdown-num {
  font-family: 'Playfair Display', serif;
  font-size: 44px;
  font-weight: 700;
  color: #6ba5c8;
  display: block;
  line-height: 1;
}

.countdown-text {
  font-size: 13px;
  color: #4a7a95;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-top: 5px;
}

@media (max-width: 768px) {
  .save-date-text {
    font-size: 36px;
  }

  .couple-title {
    font-size: 44px;
  }

  .countdown-num {
    font-size: 36px;
  }

  .countdown-grid {
    gap: 15px;
  }
}
</style>

<template>
  <section class="details-section">
    <div class="section-header">
      <h2 class="section-title">Wedding Details</h2>
      <div class="title-underline"></div>
    </div>

    <div class="cards-row">
      <div class="detail-card">
        <svg class="card-icon" width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" stroke="#C8A870" stroke-width="1.5" fill="none"/>
          <path d="M20 8V20L26 26" stroke="#8B9E7E" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <h3 class="card-title">Ceremony</h3>
        <p class="card-detail">{{ date }}</p>
        <p class="card-detail">{{ time }}</p>
        <p class="card-detail venue-name">{{ venue }}</p>
        <p class="card-detail address">{{ address }}</p>
        <a
          v-if="ceremonyMapUrl"
          :href="ceremonyMapUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="map-btn"
        >
          View on Map
        </a>
      </div>

      <div class="detail-card">
        <svg class="card-icon" width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M8 32V14L20 6L32 14V32H8Z" stroke="#C8A870" stroke-width="1.5" fill="none"/>
          <rect x="16" y="22" width="8" height="10" stroke="#8B9E7E" stroke-width="1.5" fill="none"/>
        </svg>
        <h3 class="card-title">Reception</h3>
        <p class="card-detail">{{ date }}</p>
        <p class="card-detail venue-name">{{ venue }}</p>
        <p class="card-detail address">{{ address }}</p>
        <a
          v-if="receptionMapUrl"
          :href="receptionMapUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="map-btn"
        >
          View on Map
        </a>
      </div>
    </div>

    <div class="countdown-wrapper">
      <p class="countdown-label">Counting Down To The Big Day</p>
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
  </section>
</template>

<script setup>
import { reactive, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  date: { type: String, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  address: { type: String, required: true },
  ceremonyMapUrl: { type: String, default: null },
  receptionMapUrl: { type: String, default: null },
  weddingDateTime: { type: String, required: true }
});

const countdown = reactive({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
});

let countdownInterval = null;

function updateCountdown() {
  const target = new Date(props.weddingDateTime);
  const now = new Date();
  const diff = target - now;

  if (diff > 0) {
    countdown.days = Math.floor(diff / (1000 * 60 * 60 * 24));
    countdown.hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    countdown.minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    countdown.seconds = Math.floor((diff % (1000 * 60)) / 1000);
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
.details-section {
  padding: 80px 20px;
  position: relative;
}

.details-section::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 20px;
  width: 50px;
  height: 50px;
  background-image: url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M5 45C5 45 10 25 25 12C40 0 45 5 45 5C45 5 40 15 28 28C16 40 5 45 5 45Z' fill='%23A8B89C' opacity='0.3'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.details-section::after {
  content: '';
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background-image: url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M45 5C45 5 40 25 25 38C10 50 5 45 5 45C5 45 10 35 22 22C34 10 45 5 45 5Z' fill='%23A8B89C' opacity='0.3'/%3E%3C/svg%3E");
  background-size: contain;
  background-repeat: no-repeat;
}

.section-header {
  text-align: center;
  margin-bottom: 50px;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 40px;
  font-weight: 700;
  color: #3D4A3A;
  margin: 0 0 12px;
}

.title-underline {
  width: 80px;
  height: 2px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, #C8A870, transparent);
}

.cards-row {
  display: flex;
  gap: 30px;
  justify-content: center;
  max-width: 800px;
  margin: 0 auto;
}

.detail-card {
  flex: 1;
  max-width: 360px;
  background: #F5F0EB;
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-4px);
}

.card-icon {
  margin-bottom: 16px;
}

.card-title {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: #3D4A3A;
  margin: 0 0 16px;
}

.card-detail {
  font-family: 'Crimson Text', serif;
  font-size: 17px;
  color: #5C6858;
  margin: 4px 0;
  line-height: 1.5;
}

.venue-name {
  font-weight: 600;
  color: #3D4A3A;
  margin-top: 12px;
}

.address {
  color: #7A6B5A;
  font-size: 15px;
}

.map-btn {
  display: inline-block;
  margin-top: 20px;
  padding: 10px 28px;
  border: 1.5px solid #8B9E7E;
  border-radius: 50px;
  color: #6B7D60;
  font-family: 'Lato', sans-serif;
  font-size: 13px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.3s ease;
}

.map-btn:hover {
  background: #8B9E7E;
  color: #FAF8F5;
}

.countdown-wrapper {
  text-align: center;
  margin-top: 60px;
}

.countdown-label {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  color: #3D4A3A;
  margin: 0 0 24px;
}

.countdown-grid {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.countdown-box {
  text-align: center;
  min-width: 80px;
}

.countdown-num {
  font-family: 'Playfair Display', serif;
  font-size: 44px;
  font-weight: 700;
  color: #C8A870;
  display: block;
  line-height: 1;
}

.countdown-text {
  font-family: 'Lato', sans-serif;
  font-size: 12px;
  color: #7A6B5A;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 6px;
  display: block;
}

@media (max-width: 768px) {
  .cards-row {
    flex-direction: column;
    align-items: center;
  }

  .detail-card {
    max-width: 100%;
    width: 100%;
  }

  .section-title {
    font-size: 32px;
  }

  .countdown-num {
    font-size: 36px;
  }

  .countdown-grid {
    gap: 16px;
  }
}
</style>

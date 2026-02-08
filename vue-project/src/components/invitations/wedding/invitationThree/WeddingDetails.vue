<template>
  <section id="details">
    <h2 class="section-title">Wedding Details</h2>
    <p class="section-subtitle">Join us for our special day</p>

    <div class="details-container">
      <div class="detail-card">
        <div class="detail-icon">📅</div>
        <h3>{{ date }}</h3>
        <p>{{ time }}</p>
      </div>

      <div class="detail-card">
        <div class="detail-icon">⛪</div>
        <h3>Ceremony</h3>
        <p>Join us for the ceremony</p>
        <a :href="ceremonyMapLink" target="_blank" class="location-btn">View Location</a>
      </div>

      <div class="detail-card">
        <div class="detail-icon">🥂</div>
        <h3>Reception</h3>
        <p>Celebration to follow</p>
        <a :href="receptionMapLink" target="_blank" class="location-btn">View Location</a>
      </div>
    </div>

    <div class="countdown-card">
      <h3 class="countdown-title">Counting Down to Forever</h3>
      <div v-if="!isWeddingDay" class="countdown">
        <div class="countdown-item">
          <span class="countdown-number">{{ countdown.days }}</span>
          <span class="countdown-label">Days</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">{{ countdown.hours }}</span>
          <span class="countdown-label">Hours</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">{{ countdown.minutes }}</span>
          <span class="countdown-label">Minutes</span>
        </div>
        <div class="countdown-item">
          <span class="countdown-number">{{ countdown.seconds }}</span>
          <span class="countdown-label">Seconds</span>
        </div>
      </div>
      <p v-else class="wedding-day-message">The day has arrived! 💕</p>
    </div>
  </section>
</template>

<script>
export default {
  name: 'WeddingDetails',
  props: {
    date: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    ceremonyMapLink: {
      type: String,
      required: true
    },
    receptionMapLink: {
      type: String,
      required: true
    },
    dateTime: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      countdown: {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      },
      isWeddingDay: false,
      countdownInterval: null
    }
  },
  mounted() {
    this.updateCountdown()
    this.countdownInterval = setInterval(this.updateCountdown, 1000)
  },
  beforeUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
    }
  },
  methods: {
    updateCountdown() {
      const weddingDate = new Date(this.dateTime).getTime()
      const now = new Date().getTime()
      const distance = weddingDate - now

      if (distance > 0) {
        this.countdown.days = Math.floor(distance / (1000 * 60 * 60 * 24))
        this.countdown.hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        this.countdown.minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        this.countdown.seconds = Math.floor((distance % (1000 * 60)) / 1000)
        this.isWeddingDay = false
      } else {
        this.isWeddingDay = true
        if (this.countdownInterval) {
          clearInterval(this.countdownInterval)
        }
      }
    }
  }
}
</script>

<style scoped>
.details-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.detail-card {
  background: var(--warm-ivory);
  padding: 3rem 2rem;
  border-radius: 2px;
  box-shadow: 0 4px 20px rgba(155, 145, 134, 0.08);
  text-align: center;
  border-top: 1px solid var(--divider);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(155, 145, 134, 0.12);
}

.detail-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--blush), var(--dusty-rose));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.detail-card h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.8rem;
  font-weight: 500;
  color: var(--charcoal);
  margin-bottom: 0.5rem;
}

.detail-card p {
  color: var(--warm-gray);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
}

.location-btn {
  display: inline-block;
  padding: 0.8rem 2rem;
  background: transparent;
  border: 1px solid var(--sage-dark);
  color: var(--sage-dark);
  font-family: 'Lora', serif;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.location-btn:hover {
  background: var(--muted-sage);
  color: white;
  border-color: var(--muted-sage);
}

.countdown-card {
  background: linear-gradient(135deg, var(--blush) 0%, var(--warm-ivory) 100%);
  padding: 3rem;
  border-radius: 2px;
  text-align: center;
  margin-top: 2rem;
  border: 1px solid var(--divider);
}

.countdown-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--charcoal);
  margin-bottom: 1.5rem;
  letter-spacing: 0.05em;
}

.countdown {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.countdown-item {
  text-align: center;
}

.countdown-number {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 500;
  color: var(--rose-accent);
  display: block;
}

.countdown-label {
  font-size: 0.85rem;
  color: var(--warm-gray);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  margin-top: 0.5rem;
}

.wedding-day-message {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  color: var(--rose-accent);
}

@media (max-width: 768px) {
  .details-container {
    grid-template-columns: 1fr;
  }

  .countdown {
    gap: 1.5rem;
  }

  .countdown-number {
    font-size: 2.5rem;
  }
}
</style>

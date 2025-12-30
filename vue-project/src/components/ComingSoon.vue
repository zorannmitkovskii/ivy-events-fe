<template>
  <div class="coming-soon">
    <!-- Header -->
    <header class="header">
      <div class="logo">
        <span class="logo-icon">📅</span>
        <span class="logo-text text-primary-main">Plannio</span>
      </div>

      <span class="badge">Launching Soon</span>
    </header>

    <!-- Hero -->
    <main class="hero">
      <h1 class="title text-primary-main">Coming Soon</h1>
      <h2 class="subtitle">Event Planning Made Simple</h2>

      <p class="description">
        Everything you need to plan an event in one place.
        From schedules and tasks to guest lists, table seating, and an online gallery —
        perfect for <strong>individuals and organizers</strong>.
      </p>

      <!-- Features -->
      <div class="features">
        <div class="feature">
          <span class="feature-icon bg-primary-light">📩</span>
          <span>RSVP Management</span>
        </div>

        <div class="feature">
          <span class="feature-icon bg-secondary-gold">🖼</span>
          <span>Online Gallery</span>
        </div>

        <div class="feature">
          <span class="feature-icon bg-secondary-green">🪑</span>
          <span>Table & Seating Planner</span>
        </div>
      </div>


      <!-- Waitlist -->
      <div class="card bg-primary-light">
        <h3>Join the Waitlist</h3>
        <p class="card-subtitle">
          Be among the first to experience the future of event planning.
        </p>

        <form class="form" @submit.prevent="submitEmail">
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email address"
            required
          />
          <button type="submit">Get Early Access</button>
        </form>

        <p class="privacy">
          🔒 No spam. Early access only. Unsubscribe anytime.
        </p>

        <ul class="benefits">
          <li>✅ Early access users receive a <strong>20% lifetime discount code</strong></li>
          <li>✅ Priority access & feature influence</li>
        </ul>
      </div>

      <!-- Social proof -->
      <div class="social-proof">
        <p>Trusted by event professionals and individuals worldwide</p>
        <span class="waitlist-count">500+ already on the waitlist</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')

const submitEmail = () => {
  // TODO: replace with real API call
  console.log('Waitlist email:', email.value)

  alert('🎉 Thanks! You are on the waitlist. Check your inbox soon.')
  email.value = ''
}
</script>

<style scoped>
.coming-soon {
  min-height: 100vh;
  padding: 32px 20px;
}

/* Header */
.header {
  max-width: 1100px;
  margin: 0 auto 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
}

.badge {
  background: var(--primary-light);
  color: var(--white);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
}

/* Hero */
.hero {
  max-width: 760px;
  margin: 0 auto;
  text-align: center;
}

.title {
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 28px;
  font-weight: 600;
  color: var(--neutral-900);
  margin-bottom: 20px;
}

.description {
  color: var(--neutral-700);
  font-size: 16px;
  margin-bottom: 32px;
}

/* Features */
.features {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--neutral-700);
}

.feature-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Card */
.card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-light);
  padding: 32px 24px;
  margin-bottom: 40px;
}

.card h3 {
  font-size: 22px;
  margin-bottom: 8px;
}

.card-subtitle {
  color: var(--neutral-700);
  font-size: 14px;
  margin-bottom: 20px;
}

/* Form */
.form {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

input {
  flex: 1;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--neutral-300);
  font-size: 14px;
}

input:focus {
  outline: none;
  border-color: var(--primary-main);
}

button {
  background: var(--primary-main);
  color: var(--white);
  border: none;
  padding: 12px 20px;
  border-radius: var(--radius-button);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

button:hover {
  background: var(--primary-dark);
}

/* Footer text */
.privacy {
  font-size: 12px;
  color: var(--neutral-500);
  margin-bottom: 12px;
}

.benefits {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 14px;
  color: var(--neutral-700);
}

.benefits li {
  margin-bottom: 6px;
}

/* Social proof */
.social-proof {
  font-size: 13px;
  color: var(--neutral-500);
}

.waitlist-count {
  display: inline-block;
  margin-top: 8px;
  background: var(--primary-light);
  color: var(--white);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
}

/* Responsive */
@media (max-width: 640px) {
  .title {
    font-size: 40px;
  }

  .subtitle {
    font-size: 22px;
  }
}
</style>

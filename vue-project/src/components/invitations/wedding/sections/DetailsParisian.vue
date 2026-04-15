<template>
  <div class="details-section">
    <div class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <p class="section-subtitle">{{ subtitleText }}</p>
    </div>

    <div class="details-grid">
      <!-- Ceremony Card -->
      <div class="detail-card group">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M18 21V8a6 6 0 0 0-12 0v13" />
            <path d="M2 21h20" />
            <path d="M12 2v4" />
            <path d="M10 12h4" />
          </svg>
        </div>
        <h3 class="card-title">{{ ceremonyVenue || ceremonyLabel }}</h3>
        <p v-if="ceremonyDate" class="card-time bold">{{ ceremonyDate }}</p>
        <p v-if="ceremonyTime" class="card-time">{{ ceremonyTime }}</p>
        <a v-if="ceremonyMapUrl" :href="ceremonyMapUrl" target="_blank" rel="noopener" class="card-map-link">{{ mapLabel }}</a>
      </div>

      <!-- Reception Card -->
      <div class="detail-card group">
        <div class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <path d="M8 22h8" />
            <path d="M7 10h10" />
            <path d="M12 15v7" />
            <path d="M12 15a5 5 0 0 0 5-5c0-2-1-3.5-1-3.5H8S7 8 7 10a5 5 0 0 0 5 5z" />
            <path d="M12 10V2" />
          </svg>
        </div>
        <h3 class="card-title">{{ receptionVenue || receptionLabel }}</h3>
        <p v-if="receptionDate" class="card-time bold">{{ receptionDate }}</p>
        <p v-if="receptionTime" class="card-time">{{ receptionTime }}</p>
        <a v-if="receptionMapUrl" :href="receptionMapUrl" target="_blank" rel="noopener" class="card-map-link">{{ mapLabel }}</a>
      </div>

      <!-- Countdown Card -->
      <div v-if="showCountdown && countdownDate" class="countdown-card">
        <h3 class="countdown-heading">{{ countdownLabel }}</h3>
        <CountdownTimer
          :target-date="countdownDate"
          :show-seconds="false"
          separator=":"
          :colors="[textColor, textColor]"
          separator-color="var(--theme-text-muted)"
          :heading-font="headingFont"
          :body-font="bodyFont"
          unit-label-color="var(--theme-text-muted)"
        />
        <p class="countdown-tagline">{{ countdownTagline }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';

defineProps({
  title: { type: String, default: '' },
  ceremonyLabel: { type: String, default: 'Ceremony' },
  receptionLabel: { type: String, default: 'Reception' },
  locationLabel: { type: String, default: 'Location' },
  mapLabel: { type: String, default: 'View Map' },
  ceremonyVenue: { type: String, default: '' },
  ceremonyDate: { type: String, default: '' },
  ceremonyTime: { type: String, default: '' },
  ceremonyMapUrl: { type: String, default: '' },
  receptionVenue: { type: String, default: '' },
  receptionDate: { type: String, default: '' },
  receptionTime: { type: String, default: '' },
  receptionMapUrl: { type: String, default: '' },
  venue: { type: String, default: '' },
  locationMapUrl: { type: String, default: '' },
  countdownDate: { type: String, default: '' },
  countdownLabel: { type: String, default: '' },
  showCountdown: { type: Boolean, default: true },
  cardBg: { type: String, default: '#fff' },
  cardBorder: { type: String, default: '0px' },
  cardRadius: { type: String, default: '24px' },
  cardShadow: { type: String, default: '' },
  accentColor: { type: String, default: '' },
  secondaryColor: { type: String, default: '' },
  textColor: { type: String, default: '#1f2937' },
  dividerColor: { type: String, default: '' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
  /* Parisian-specific extras */
  subtitleText: { type: String, default: '' },
  countdownTagline: { type: String, default: '' },
});
</script>

<style scoped>
.section-header {
  text-align: center;
  margin-bottom: 32px;
}

.section-title {
  font-family: var(--font-heading, inherit);
  font-size: 36px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 16px;
}

.section-subtitle {
  font-family: var(--font-body, inherit);
  font-size: 20px;
  font-style: italic;
  color: var(--theme-text-muted, #6b7280);
  margin: 0;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--content-gap, 32px);
}

.detail-card {
  background: var(--card-bg, #fff);
  padding: var(--card-padding, 40px);
  text-align: center;
  border: var(--card-border-width, 1px) solid var(--theme-champagne200, rgba(200, 180, 160, 0.3));
  border-radius: var(--card-radius, 4px);
  box-shadow: var(--card-shadow, 0 4px 20px -2px rgba(120, 100, 100, 0.1));
  transition: box-shadow 0.5s ease;
}

.detail-card:hover {
  box-shadow: 0 10px 25px -5px rgba(120, 100, 100, 0.15);
}

.card-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 24px;
  color: var(--theme-accent);
  transition: transform 0.5s ease;
}

.group:hover .card-icon {
  transform: scale(1.1);
}

.card-icon svg {
  width: 100%;
  height: 100%;
}

.card-title {
  font-family: var(--font-heading, inherit);
  font-size: 24px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 8px;
}

.card-time {
  font-family: var(--font-body, inherit);
  font-size: 18px;
  color: var(--theme-text-muted, #6b7280);
  margin: 0 0 16px;
}

.card-time.bold {
  font-weight: 700;
}

.card-map-link {
  display: inline-block;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--theme-accent);
  border-bottom: 1px solid var(--theme-accent);
  padding-bottom: 4px;
  text-decoration: none;
  transition: color 0.3s ease;
}

.card-map-link:hover {
  color: color-mix(in srgb, var(--theme-accent), black 20%);
}

/* Countdown Card */
.countdown-card {
  background: var(--card-bg, #fff);
  padding: var(--card-padding, 40px);
  text-align: center;
  border: var(--card-border-width, 1px) solid var(--theme-accent);
  border-radius: var(--card-radius, 4px);
  box-shadow: var(--card-shadow, 0 4px 20px -2px rgba(120, 100, 100, 0.1));
  transition: box-shadow 0.5s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.countdown-card:hover {
  box-shadow: 0 10px 25px -5px rgba(120, 100, 100, 0.15);
}

.countdown-heading {
  font-family: var(--font-heading, inherit);
  font-size: 24px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 24px;
}

.countdown-tagline {
  font-family: var(--font-body, inherit);
  font-style: italic;
  font-size: 16px;
  color: var(--theme-text-muted, #6b7280);
  margin: 32px 0 0;
}

/* Responsive */
@container (min-width: 768px) {
  .details-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@container (max-width: 767px) {
  .section-title {
    font-size: 36px;
  }

  .details-grid {
    max-width: 440px;
    margin: 0 auto;
  }

  .detail-card,
  .countdown-card {
    padding: 32px 24px;
  }
}
</style>

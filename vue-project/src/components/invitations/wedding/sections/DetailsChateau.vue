<template>
  <div class="details-section">
    <div class="section-header-center">
      <h2 class="section-title">{{ title }}</h2>
      <p v-if="subtitleText" class="section-subtitle">{{ subtitleText }}</p>
    </div>

    <!-- Countdown before cards -->
    <div v-if="showCountdown && countdownDate" class="countdown-wrap">
      <CountdownTimer
        :target-date="countdownDate"
        :show-seconds="false"
        :colors="[accentColor, accentColor]"
        :heading-font="headingFont"
        :body-font="bodyFont"
        unit-label-color="var(--theme-text-muted)"
      />
    </div>

    <!-- Dynamic icon cards -->
    <div class="details-grid">
      <div
        v-for="(detail, i) in weddingDetails"
        :key="i"
        class="detail-card"
        :class="{ 'detail-card--highlight': detail.highlight }"
      >
        <div class="detail-icon">
          <svg v-if="detail.icon === 'drinks'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8h14z"/></svg>
          <svg v-else-if="detail.icon === 'heart'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          <svg v-else-if="detail.icon === 'coffee'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h3 class="detail-title">{{ detail.title }}</h3>
        <p v-if="detail.eventDate" class="detail-time detail-time--bold">{{ detail.eventDate }}</p>
        <p v-if="detail.time" class="detail-time">{{ detail.time }}</p>
        <a v-if="detail.mapUrl" :href="detail.mapUrl" target="_blank" rel="noopener" class="detail-map">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ mapLabel }}
        </a>
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
  mapLabel: { type: String, default: 'View Location' },
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
  /* Chateau-specific extras */
  subtitleText: { type: String, default: '' },
  weddingDetails: { type: Array, default: () => [] },
});
</script>

<style scoped>
.section-header-center {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-family: var(--font-heading, inherit);
  font-size: 36px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 16px;
}

.section-subtitle {
  font-size: 16px;
  color: var(--theme-text-muted, #666);
  margin: 0;
  max-width: 500px;
}

@container (min-width: 768px) {
  .section-title { font-size: 48px; }
}

/* Countdown */
.countdown-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 48px;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--content-gap, 32px);
}

@container (min-width: 768px) {
  .details-grid { grid-template-columns: repeat(3, 1fr); }
}

.detail-card {
  background: var(--card-bg, #fff);
  padding: var(--card-padding, 32px);
  border-radius: var(--card-radius, 16px);
  box-shadow: var(--card-shadow, 0 10px 30px -5px rgba(40, 40, 40, 0.1));
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.detail-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--card-shadow, 0 20px 40px -5px rgba(40, 40, 40, 0.15));
}

.detail-card--highlight {
  border-top: 4px solid var(--theme-accent);
}

.detail-icon {
  width: 48px;
  height: 48px;
  background: var(--theme-bg-warm, #faf8f5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: color-mix(in srgb, var(--theme-accent), black 15%);
}

.detail-icon svg {
  width: 24px;
  height: 24px;
}

.detail-title {
  font-family: var(--font-heading, inherit);
  font-size: 24px;
  color: var(--theme-text, #1f2937);
  margin: 0 0 8px;
}

.detail-time {
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--theme-accent), black 15%);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 8px;
}

.detail-time--bold {
  font-weight: 800;
}

.detail-map {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: color-mix(in srgb, var(--theme-accent), black 15%);
  text-decoration: none;
  padding: 8px 16px;
  border: 1px solid var(--theme-accent);
  border-radius: 999px;
  transition: all 0.2s;
}

.detail-map:hover {
  background: var(--theme-bg, #faf8f5);
  border-color: var(--theme-accent);
}
</style>

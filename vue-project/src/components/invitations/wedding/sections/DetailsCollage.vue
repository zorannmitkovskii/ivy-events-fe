<template>
  <div class="details-section">
    <div class="section-header">
      <h2 class="section-title">{{ title }}</h2>
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

    <!-- 2 color-coded cards (ceremony + reception) -->
    <div class="details-grid">
      <!-- Ceremony Card (rose) -->
      <div class="detail-card detail-card--rose">
        <div class="detail-icon detail-icon--rose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 21V8a6 6 0 0 0-12 0v13"/><path d="M2 21h20"/><path d="M12 2v4"/><path d="M10 12h4"/>
          </svg>
        </div>
        <h3 class="detail-title">{{ ceremonyVenue || ceremonyLabel }}</h3>
        <p v-if="ceremonyDate" class="detail-time bold">{{ ceremonyDate }}</p>
        <p v-if="ceremonyTime" class="detail-time">{{ ceremonyTime }}</p>
        <a v-if="ceremonyMapUrl" :href="ceremonyMapUrl" target="_blank" rel="noopener" class="detail-map-link detail-map-link--rose">{{ mapLabel }}</a>
      </div>

      <!-- Reception Card (stone) -->
      <div class="detail-card detail-card--stone">
        <div class="detail-icon detail-icon--stone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-1-3.5-1-3.5H8S7 8 7 10a5 5 0 0 0 5 5z"/><path d="M12 10V2"/>
          </svg>
        </div>
        <h3 class="detail-title">{{ receptionVenue || receptionLabel }}</h3>
        <p v-if="receptionDate" class="detail-time bold">{{ receptionDate }}</p>
        <p v-if="receptionTime" class="detail-time">{{ receptionTime }}</p>
        <a v-if="receptionMapUrl" :href="receptionMapUrl" target="_blank" rel="noopener" class="detail-map-link detail-map-link--stone">{{ mapLabel }}</a>
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
  mapLabel: { type: String, default: 'Get Directions' },
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
});
</script>

<style scoped>
.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-title {
  font-family: var(--font-heading, inherit);
  font-size: 36px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 16px;
}

@container (min-width: 768px) {
  .section-title { font-size: 42px; }
}

/* Countdown */
.countdown-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 64px;
}

/* Details Grid - 2 columns */
.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--content-gap, 32px);
  max-width: 900px;
  margin: 0 auto;
}

@container (min-width: 768px) {
  .details-grid { grid-template-columns: 1fr 1fr; }
}

.detail-card {
  background: var(--card-bg, #fff);
  padding: 40px;
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 4px 20px -2px rgba(150, 140, 130, 0.1);
  transition: box-shadow 0.4s, transform 0.4s;
}

.detail-card:hover {
  box-shadow: 0 10px 25px -5px rgba(150, 140, 130, 0.2);
  transform: translateY(-4px);
}

.detail-card--rose {
  border-top: 4px solid var(--theme-accent);
}

.detail-card--stone {
  border-top: 4px solid var(--theme-text-muted, #a8a29e);
}

.detail-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.detail-icon svg {
  width: 24px;
  height: 24px;
}

.detail-icon--rose {
  background: color-mix(in srgb, var(--theme-accent) 12%, white);
  color: var(--theme-accent);
}

.detail-icon--stone {
  background: var(--card-bg, #f5f5f4);
  color: var(--theme-text-muted, #57534e);
}

.detail-title {
  font-family: var(--font-heading, inherit);
  font-size: 24px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 8px;
}

.detail-time {
  font-size: 16px;
  font-weight: 700;
  color: var(--theme-text-muted, #78716c);
  margin: 0 0 24px;
}

.detail-time.bold {
  font-weight: 800;
}

.detail-map-link {
  display: inline-block;
  font-size: 14px;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
  transition: color 0.2s;
}

.detail-map-link--rose {
  color: var(--theme-accent);
}

.detail-map-link--rose:hover {
  color: color-mix(in srgb, var(--theme-accent), black 20%);
}

.detail-map-link--stone {
  color: var(--theme-text-muted, #57534e);
}

.detail-map-link--stone:hover {
  color: var(--theme-text, #1f2937);
}
</style>

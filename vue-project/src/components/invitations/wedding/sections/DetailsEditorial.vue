<template>
  <div class="details-editorial">
    <div class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <div class="section-rule" :style="{ background: dividerColor }"></div>
    </div>

    <div class="details-rows">
      <!-- Ceremony -->
      <div class="detail-row">
        <div class="detail-label">{{ ceremonyVenue || ceremonyLabel }}</div>
        <div class="detail-line"></div>
        <div class="detail-info">
          <span v-if="ceremonyDate" class="info-date">{{ ceremonyDate }}</span>
          <span v-if="ceremonyTime" class="info-time">{{ ceremonyTime }}</span>
          <a v-if="ceremonyMapUrl" :href="ceremonyMapUrl" target="_blank" rel="noopener" class="info-map">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ mapLabel }}
          </a>
        </div>
      </div>

      <!-- Reception -->
      <div class="detail-row">
        <div class="detail-label">{{ receptionVenue || receptionLabel }}</div>
        <div class="detail-line"></div>
        <div class="detail-info">
          <span v-if="receptionDate" class="info-date">{{ receptionDate }}</span>
          <span v-if="receptionTime" class="info-time">{{ receptionTime }}</span>
          <a v-if="receptionMapUrl" :href="receptionMapUrl" target="_blank" rel="noopener" class="info-map">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ mapLabel }}
          </a>
        </div>
      </div>

      <!-- Location -->
      <div v-if="venue" class="detail-row">
        <div class="detail-label">{{ locationLabel }}</div>
        <div class="detail-line"></div>
        <div class="detail-info">
          <span class="info-venue">{{ venue }}</span>
          <a v-if="locationMapUrl" :href="locationMapUrl" target="_blank" rel="noopener" class="info-map">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {{ mapLabel }}
          </a>
        </div>
      </div>
    </div>

    <div v-if="showCountdown && countdownDate" class="countdown-wrap">
      <CountdownTimer
        :target-date="countdownDate"
        :label="countdownLabel"
        :show-seconds="false"
        :colors="[textColor, textColor, textColor]"
        :heading-font="headingFont"
        :body-font="bodyFont"
      />
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
});
</script>

<style scoped>
.details-editorial {
  max-width: 680px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-title {
  font-family: var(--font-heading, inherit);
  font-size: 36px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 12px;
}

.section-rule {
  width: 48px;
  height: 2px;
  margin: 0 auto;
}

/* Rows */
.details-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.detail-row {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-family: var(--font-heading, inherit);
  font-size: 18px;
  font-weight: 500;
  color: var(--theme-text, #1f2937);
  white-space: nowrap;
  flex-shrink: 0;
}

.detail-line {
  flex: 1;
  height: 1px;
  background: var(--border-color, rgba(0, 0, 0, 0.08));
  min-width: 24px;
  align-self: center;
}

.detail-info {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-shrink: 0;
  font-family: var(--font-body, inherit);
}

.info-date {
  font-size: 15px;
  font-weight: 600;
  color: var(--theme-text, #1f2937);
}

.info-time {
  font-size: 14px;
  color: var(--theme-text-muted, #6b7280);
}

.info-venue {
  font-size: 15px;
  color: var(--theme-text, #1f2937);
}

.info-map {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--theme-accent, #c9a96e);
  text-decoration: none;
  transition: opacity 0.15s;
}

.info-map:hover {
  opacity: 0.7;
}

/* Countdown */
.countdown-wrap {
  margin-top: 40px;
  padding: 24px;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

/* Mobile stack */
@media (max-width: 600px) {
  .detail-row {
    flex-direction: column;
    gap: 6px;
  }

  .detail-line {
    display: none;
  }

  .detail-info {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>

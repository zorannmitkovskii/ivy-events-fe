<template>
  <div class="details-section">
    <div class="section-header">
      <h2 class="section-title">{{ title }}</h2>
      <div class="section-divider" :style="{ background: dividerColor }"></div>
    </div>

    <div class="details-grid">
      <DetailCard
        :title="ceremonyVenue || ceremonyLabel"
        :bg-color="cardBg"
        :border-width="cardBorder"
        :border-radius="cardRadius"
        :shadow="cardShadow"
        :icon-bg="accentColor"
        :heading-font="headingFont"
        :body-font="bodyFont"
      >
        <template #icon>
          <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </template>
        <p v-if="ceremonyDate" class="bold">{{ ceremonyDate }}</p>
        <p v-if="ceremonyTime">{{ ceremonyTime }}</p>
        <template #footer>
          <a v-if="ceremonyMapUrl" :href="ceremonyMapUrl" target="_blank" rel="noopener" class="map-link">{{ mapLabel }}</a>
        </template>
      </DetailCard>

      <DetailCard
        :title="receptionVenue || receptionLabel"
        :bg-color="cardBg"
        :border-width="cardBorder"
        :border-radius="cardRadius"
        :shadow="cardShadow"
        :icon-bg="secondaryColor"
        :heading-font="headingFont"
        :body-font="bodyFont"
      >
        <template #icon>
          <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
        <p v-if="receptionDate" class="bold">{{ receptionDate }}</p>
        <p v-if="receptionTime">{{ receptionTime }}</p>
        <template #footer>
          <a v-if="receptionMapUrl" :href="receptionMapUrl" target="_blank" rel="noopener" class="map-link">{{ mapLabel }}</a>
        </template>
      </DetailCard>

      <DetailCard
        :title="locationLabel"
        :bg-color="cardBg"
        :border-width="cardBorder"
        :border-radius="cardRadius"
        :shadow="cardShadow"
        :icon-bg="accentColor"
        :heading-font="headingFont"
        :body-font="bodyFont"
      >
        <template #icon>
          <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </template>
        <p>{{ venue }}</p>
        <template #footer>
          <a v-if="locationMapUrl" :href="locationMapUrl" target="_blank" rel="noopener" class="map-link">{{ mapLabel }}</a>
        </template>
      </DetailCard>
    </div>

    <div v-if="showCountdown && countdownDate" class="countdown-bar">
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
import DetailCard from '@/components/invitations/shared/DetailCard.vue';
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
.section-header { text-align: center; margin-bottom: 32px; }
.section-title { font-family: var(--font-heading, inherit); font-size: 36px; font-weight: 400; color: var(--theme-text, #1f2937); margin: 0 0 12px; }
.section-divider { width: 64px; height: 1px; margin: 0 auto; }
.details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 32px; }
.card-svg { width: 100%; height: 100%; }
.bold { font-weight: 600; }
.map-link { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 500; color: var(--theme-accent, #60a5fa); text-decoration: none; }
.countdown-bar { margin-top: 32px; padding: 24px; background: var(--card-bg, #fff); border-radius: var(--card-radius, 24px); box-shadow: var(--card-shadow); }
</style>

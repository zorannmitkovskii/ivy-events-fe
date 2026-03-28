<template>
  <div class="details-section">
    <div class="section-header">
      <h2 class="section-title">{{ title }}</h2>
    </div>

    <!-- Countdown ABOVE cards -->
    <div v-if="showCountdown && countdownDate" class="countdown-wrapper">
      <CountdownTimer
        :target-date="countdownDate"
        :label="countdownLabel"
        :show-seconds="true"
        :colors="[accentColor, secondaryColor, tertiaryColor, accentColor]"
        :heading-font="headingFont"
        :body-font="bodyFont"
        label-color="var(--theme-text-muted)"
        unit-label-color="var(--theme-text-muted)"
      />
    </div>

    <!-- Detail Cards (dynamic from weddingDetails) -->
    <div class="details-grid" v-if="weddingDetails.length > 0">
      <DetailCard
        v-for="(detail, idx) in weddingDetails"
        :key="idx"
        :title="detail.title"
        :accent-color="cardPalette[idx % 3].accent"
        :bg-color="cardPalette[idx % 3].bg"
        :icon-bg="cardPalette[idx % 3].iconBg"
        :heading-font="headingFont"
        :body-font="bodyFont"
        :shadow="cardShadow"
        border-width="0"
        border-radius="16px"
      >
        <template #icon>
          <span class="card-emoji">{{ resolveIcon(detail.icon) }}</span>
        </template>
        <p v-if="detail.eventDate" class="bold">{{ detail.eventDate }}</p>
        <p v-if="detail.time">{{ detail.time }}</p>
        <template #footer>
          <a v-if="detail.mapUrl" :href="detail.mapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: cardPalette[idx % 3].accent }">{{ mapLabel }}</a>
        </template>
      </DetailCard>
    </div>

    <!-- Fallback cards (preview mode) -->
    <div class="details-grid" v-else>
      <DetailCard
        :title="ceremonyVenue || ceremonyLabel"
        :accent-color="accentColor"
        :bg-color="accentBg"
        :icon-bg="accentIconBg"
        :heading-font="headingFont"
        :body-font="bodyFont"
        :shadow="cardShadow"
        border-width="0"
        border-radius="16px"
      >
        <template #icon>
          <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </template>
        <p class="bold">{{ ceremonyDate }}</p>
        <p>{{ ceremonyTime }}</p>
        <template #footer>
          <a v-if="ceremonyMapUrl" :href="ceremonyMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: accentColor }">{{ mapLabel }}</a>
        </template>
      </DetailCard>

      <DetailCard
        :title="receptionVenue || receptionLabel"
        :accent-color="secondaryColor"
        :bg-color="secondaryBg"
        :icon-bg="secondaryIconBg"
        :heading-font="headingFont"
        :body-font="bodyFont"
        :shadow="cardShadow"
        border-width="0"
        border-radius="16px"
      >
        <template #icon>
          <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </template>
        <p class="bold">{{ receptionDate }}</p>
        <p>{{ receptionTime }}</p>
        <template #footer>
          <a v-if="receptionMapUrl" :href="receptionMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: secondaryColor }">{{ mapLabel }}</a>
        </template>
      </DetailCard>

      <DetailCard
        :title="locationLabel"
        :accent-color="tertiaryColor"
        :bg-color="tertiaryBg"
        :icon-bg="tertiaryIconBg"
        :heading-font="headingFont"
        :body-font="bodyFont"
        :shadow="cardShadow"
        border-width="0"
        border-radius="16px"
      >
        <template #icon>
          <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </template>
        <p class="bold">{{ venue }}</p>
        <template #footer>
          <a v-if="locationMapUrl" :href="locationMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: tertiaryColor }">{{ mapLabel }}</a>
        </template>
      </DetailCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import DetailCard from '@/components/invitations/shared/DetailCard.vue';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';

const props = defineProps({
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
  /* Persian-specific extras */
  tertiaryColor: { type: String, default: '' },
  accentBg: { type: String, default: '' },
  accentIconBg: { type: String, default: '' },
  secondaryBg: { type: String, default: '' },
  secondaryIconBg: { type: String, default: '' },
  tertiaryBg: { type: String, default: '' },
  tertiaryIconBg: { type: String, default: '' },
  weddingDetails: { type: Array, default: () => [] },
});

const cardPalette = computed(() => [
  { accent: props.accentColor, bg: props.accentBg, iconBg: props.accentIconBg },
  { accent: props.secondaryColor, bg: props.secondaryBg, iconBg: props.secondaryIconBg },
  { accent: props.tertiaryColor, bg: props.tertiaryBg, iconBg: props.tertiaryIconBg },
]);

const iconMap = {
  church: '\u26EA', party: '\uD83C\uDF89', dresscode: '\uD83D\uDC54', rings: '\uD83D\uDC8D',
  cake: '\uD83C\uDF82', music: '\uD83C\uDFB5', gift: '\uD83C\uDF81', hotel: '\uD83C\uDFE8',
  transport: '\uD83D\uDE97', food: '\uD83C\uDF7D\uFE0F', photo: '\uD83D\uDCF7', flowers: '\uD83D\uDC90',
};

const typeToIcon = {
  CEREMONY: '\u26EA', CHURCH: '\u26EA', RECEPTION: '\uD83C\uDF89',
  COCKTAIL: '\uD83C\uDF78', DINNER: '\uD83C\uDF7D\uFE0F', DANCE: '\uD83C\uDFB5',
  BRUNCH: '\u2615', WELCOME: '\uD83E\uDD42',
};

function resolveIcon(icon) {
  return iconMap[icon] || typeToIcon[icon] || '\uD83D\uDCCB';
}
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

/* Countdown wrapper */
.countdown-wrapper {
  background: linear-gradient(135deg, var(--theme-bg) 0%, var(--theme-gradient-mid, rgba(200, 180, 220, 0.1)) 50%, var(--theme-gradient-end, rgba(200, 180, 220, 0.05)) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--card-radius, 16px);
  box-shadow: var(--card-shadow, 0px 4px 20px rgba(200, 180, 220, 0.15));
  padding: var(--card-padding, 40px);
  margin-bottom: 48px;
}

/* Details grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--content-gap, 24px);
}

/* Bold text in detail cards */
:deep(.bold) {
  font-weight: 700;
}

/* SVG icons in detail cards */
:deep(.card-svg) {
  width: 32px;
  height: 32px;
}

:deep(.card-emoji) {
  font-size: 28px;
  line-height: 1;
}

/* Map buttons in detail card footers */
:deep(.map-btn) {
  display: inline-block;
  color: var(--btn-text, #fff);
  font-family: var(--font-body, inherit);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: var(--btn-radius, 8px);
  text-decoration: none;
  transition: all 0.3s ease;
}

:deep(.map-btn:hover) {
  opacity: 0.85;
  transform: translateY(-1px);
}

/* Responsive */
@container (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }

  .section-title {
    font-size: 32px;
  }

  .countdown-wrapper {
    padding: 24px;
  }
}
</style>

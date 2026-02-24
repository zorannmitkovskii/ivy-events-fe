<template>
  <section class="hero">
    <!-- Left: Couple Image -->
    <div class="hero-image">
      <img
        v-if="photoUrl"
        :src="photoUrl"
        :alt="brideName + ' & ' + groomName"
        class="hero-img"
      />
    </div>

    <!-- Right: Gradient + Glass Panel -->
    <div class="hero-panel" :style="panelBg">
      <div class="glass-card">
        <h1 class="couple-names">{{ brideName }} <span class="amp">&amp;</span> {{ groomName }}</h1>
        <div class="divider" :style="{ background: accentColor }"></div>
        <p class="subtitle">{{ subtitle }}</p>
        <p class="wedding-date">{{ weddingDate }}</p>
        <p v-if="venue" class="venue">{{ venue }}<br v-if="location" />{{ location }}</p>
        <a v-if="mapUrl" :href="mapUrl" target="_blank" rel="noopener" class="map-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          View on Map
        </a>
        <a
          v-if="ctaLabel"
          href="#rsvp-section"
          class="cta-btn"
          :style="ctaBtnStyle"
          @click.prevent="scrollToRsvp"
        >
          {{ ctaLabel }}
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  weddingDate: { type: String, default: '' },
  subtitle: { type: String, default: 'are getting married' },
  venue: { type: String, default: '' },
  location: { type: String, default: '' },
  mapUrl: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  ctaLabel: { type: String, default: 'RSVP Now' },
  accentColor: { type: String, default: '#F9A8D4' },
  gradientStart: { type: String, default: '#FFE5EC' },
  gradientMid: { type: String, default: '#E5D4ED' },
  gradientEnd: { type: String, default: '#D4F1E8' },
});

const panelBg = computed(() => ({
  background: `linear-gradient(135deg, ${props.gradientStart} 0%, ${props.gradientMid} 50%, ${props.gradientEnd} 100%)`,
}));

const ctaBtnStyle = computed(() => ({
  background: props.accentColor,
}));

function scrollToRsvp() {
  const el = document.getElementById('rsvp-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style scoped>
.hero {
  display: flex;
  flex-direction: column;
  min-height: 600px;
}

.hero-image {
  width: 100%;
  height: 400px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-panel {
  width: 100%;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0px 4px 20px rgba(200, 180, 220, 0.15);
  padding: 40px 48px;
  max-width: 440px;
  width: 100%;
  text-align: center;
}

.couple-names {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 48px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 192, 203, 0.3);
}

.amp {
  font-weight: 400;
  font-style: italic;
}

.divider {
  width: 64px;
  height: 2px;
  margin: 0 auto 24px;
}

.subtitle {
  font-family: var(--font-body, 'Lato', sans-serif);
  font-size: 20px;
  color: #555;
  margin: 0 0 8px;
}

.wedding-date {
  font-family: var(--font-heading, 'Playfair Display', serif);
  font-size: 32px;
  font-weight: 500;
  color: #333;
  margin: 0 0 24px;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 192, 203, 0.3);
}

.venue {
  font-family: var(--font-body, 'Lato', sans-serif);
  font-size: 17px;
  color: #666;
  margin: 0 0 12px;
  line-height: 1.6;
}

.map-link {
  display: block;
  text-align: center;
  font-family: var(--font-body, 'Lato', sans-serif);
  font-size: 13px;
  font-weight: 600;
  color: #F9A8D4;
  text-decoration: none;
  margin-bottom: 24px;
  transition: color 0.2s;
}

.map-link:hover {
  color: #ec4899;
}

.cta-btn {
  display: block;
  color: #fff;
  font-family: var(--font-body, 'Lato', sans-serif);
  font-size: 14px;
  font-weight: 600;
  padding: 14px 32px;
  border-radius: 8px;
  text-decoration: none;
  box-shadow: 0px 4px 20px rgba(200, 180, 220, 0.15);
  transition: all 0.3s ease;
}

.cta-btn:hover {
  box-shadow: 0px 6px 24px rgba(200, 180, 220, 0.25);
  transform: translateY(-2px);
}

@media (min-width: 1024px) {
  .hero {
    flex-direction: row;
    min-height: 600px;
    height: 700px;
    max-height: 800px;
  }

  .hero-image {
    width: 50%;
    height: 100%;
  }

  .hero-panel {
    width: 50%;
    min-height: auto;
    height: 100%;
    padding: 48px;
  }

  .glass-card {
    padding: 48px 56px;
  }

  .couple-names {
    font-size: 56px;
  }

  .wedding-date {
    font-size: 36px;
  }
}

@media (max-width: 480px) {
  .glass-card {
    padding: 32px 24px;
  }

  .couple-names {
    font-size: 36px;
  }

  .wedding-date {
    font-size: 28px;
  }
}
</style>

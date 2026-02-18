<template>
  <section class="hero" :style="cssVars">
    <div class="hero-inner">
      <div class="hero-image-col">
        <div class="hero-image-wrap">
          <img v-if="photoUrl" :src="photoUrl" :alt="brideName + ' & ' + groomName" class="hero-img" />
          <div class="hero-image-overlay"></div>
        </div>
      </div>

      <div class="hero-text-col">
        <p class="hero-label">{{ labelText }}</p>
        <h1 class="hero-names">{{ brideName }} &amp; {{ groomName }}</h1>
        <div class="hero-divider"></div>

        <div class="hero-details">
          <p class="detail-primary">{{ weddingDate }}</p>
          <p class="detail-secondary">{{ time }}</p>
          <p class="detail-secondary">{{ venue }}</p>
          <p class="detail-muted">{{ location }}</p>
          <a v-if="mapUrl" :href="mapUrl" target="_blank" rel="noopener" class="map-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            View on Map
          </a>
        </div>

        <div class="hero-cta-wrap">
          <a href="#rsvp-section" class="hero-cta" @click.prevent="scrollToRsvp">
            {{ ctaLabel }}
          </a>
        </div>
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
  time: { type: String, default: '' },
  venue: { type: String, default: '' },
  location: { type: String, default: '' },
  mapUrl: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  labelText: { type: String, default: "You're Invited" },
  ctaLabel: { type: String, default: 'RSVP' },
  accentColor: { type: String, default: '#dbeafe' },
  accentHover: { type: String, default: '#bfdbfe' },
  dividerColor: { type: String, default: '#fda4af' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--h-heading-font': props.headingFont,
  '--h-body-font': props.bodyFont,
  '--h-accent': props.accentColor,
  '--h-accent-hover': props.accentHover,
  '--h-divider': props.dividerColor,
}));

function scrollToRsvp() {
  const el = document.getElementById('rsvp-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style scoped>
.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 64px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
}

/* Image column */
.hero-image-col {
  width: 100%;
}

.hero-image-wrap {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
  height: 420px;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(219, 234, 254, 0.3), transparent);
}

/* Text column */
.hero-text-col {
  width: 100%;
  text-align: center;
}

.hero-label {
  font-family: var(--h-body-font);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #6b7280;
  margin: 0 0 16px;
}

.hero-names {
  font-family: var(--h-heading-font);
  font-size: 52px;
  font-weight: 400;
  color: #1f2937;
  margin: 0 0 16px;
  line-height: 1.1;
}

.hero-divider {
  width: 64px;
  height: 1px;
  background: var(--h-divider);
  margin: 0 auto 32px;
}

.hero-details {
  margin-bottom: 32px;
}

.detail-primary {
  font-family: var(--h-body-font);
  font-size: 18px;
  color: #4b5563;
  margin: 0 0 8px;
}

.detail-secondary {
  font-family: var(--h-body-font);
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 4px;
}

.detail-muted {
  font-family: var(--h-body-font);
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.map-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--h-body-font);
  font-size: 13px;
  font-weight: 600;
  color: #60a5fa;
  text-decoration: none;
  margin-top: 8px;
  transition: color 0.2s;
}

.map-link:hover {
  color: #3b82f6;
}

.hero-cta-wrap {
  padding-top: 16px;
}

.hero-cta {
  display: inline-block;
  padding: 16px 40px;
  background: var(--h-accent);
  color: #374151;
  font-family: var(--h-body-font);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-decoration: none;
  border-radius: 8px;
  transition: background 0.3s ease;
}

.hero-cta:hover {
  background: var(--h-accent-hover);
}

@media (min-width: 1024px) {
  .hero-inner {
    flex-direction: row;
    gap: 64px;
    padding: 96px 24px;
  }

  .hero-image-col {
    width: 50%;
  }

  .hero-image-wrap {
    height: 600px;
  }

  .hero-text-col {
    width: 50%;
    text-align: left;
  }

  .hero-names {
    font-size: 68px;
  }

  .hero-divider {
    margin: 0 0 32px;
  }
}
</style>
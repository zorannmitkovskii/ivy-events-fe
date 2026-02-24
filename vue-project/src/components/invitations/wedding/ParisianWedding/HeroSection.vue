<template>
  <section class="hero">
    <div class="hero-bg">
      <img v-if="photoUrl" :src="photoUrl" :alt="brideName + ' & ' + groomName" class="hero-img" />
      <div class="hero-overlay"></div>
    </div>

    <div class="hero-content">
      <p class="hero-invite">{{ inviteText }}</p>
      <h1 class="hero-names">
        {{ brideName }} <span class="hero-amp">&amp;</span> {{ groomName }}
      </h1>
      <div class="hero-location-row">
        <div class="hero-line"></div>
        <p class="hero-location">{{ location }}</p>
        <div class="hero-line"></div>
      </div>
      <a v-if="mapUrl" :href="mapUrl" target="_blank" rel="noopener" class="hero-map-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        View on Map
      </a>
      <p class="hero-date">{{ weddingDate }}</p>
      <a
        v-if="ctaLabel"
        href="#rsvp-section"
        class="hero-cta"
        @click.prevent="scrollToRsvp"
      >
        {{ ctaLabel }}
      </a>
    </div>
  </section>
</template>

<script setup>
defineProps({
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  weddingDate: { type: String, default: '' },
  inviteText: { type: String, default: 'You are invited to the wedding of' },
  location: { type: String, default: '' },
  mapUrl: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  ctaLabel: { type: String, default: 'RSVP' },
});

function scrollToRsvp() {
  const el = document.getElementById('rsvp-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style scoped>
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 80px 24px;
  min-height: 600px;
  max-height: 900px;
}

.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.9;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.3) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(253, 242, 242, 0.9) 100%
  );
}

.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  max-width: 900px;
  padding: 80px 0;
}

.hero-invite {
  font-family: var(--font-heading);
  font-style: italic;
  font-size: 24px;
  color: #4b5563;
  margin: 0 0 16px;
  letter-spacing: 0.15em;
}

.hero-names {
  font-family: var(--font-heading);
  font-size: clamp(56px, 10vw, 112px);
  font-weight: 400;
  color: #1f2937;
  margin: 0 0 24px;
  line-height: 1.1;
}

.hero-amp {
  color: #c59053;
  font-weight: 300;
}

.hero-location-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.hero-map-link {
  display: block;
  text-align: center;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: #c59053;
  text-decoration: none;
  margin-bottom: 32px;
  transition: color 0.2s;
}

.hero-map-link:hover {
  color: #b97645;
}

.hero-line {
  height: 1px;
  width: 48px;
  background: #9ca3af;
}

.hero-location {
  font-family: var(--font-body);
  font-size: 20px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #4b5563;
  margin: 0;
}

.hero-date {
  font-family: var(--font-heading);
  font-size: 32px;
  color: #374151;
  margin: 0 0 48px;
}

.hero-cta {
  display: block;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid #dec69a;
  color: #1f2937;
  font-family: var(--font-heading);
  font-size: 18px;
  padding: 16px 48px;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  border-radius: 2px;
  transition: all 0.5s ease;
}

.hero-cta:hover {
  background: #fff;
  box-shadow: 0 4px 20px -2px rgba(120, 100, 100, 0.1);
}

@media (min-width: 768px) {
  .hero-invite {
    font-size: 28px;
  }

  .hero-location {
    font-size: 24px;
  }

  .hero-date {
    font-size: 40px;
  }
}
</style>

<template>
  <section class="hero-editorial" :style="cssVars">
    <div class="hero-split">
      <!-- Left: image with grain -->
      <div class="hero-image-side">
        <div class="image-frame">
          <img v-if="photoUrl" :src="photoUrl" :alt="brideName + ' & ' + groomName" class="hero-img" />
          <div class="grain-overlay"></div>
        </div>
      </div>
      <!-- Divider line -->
      <div class="hero-divider-line"></div>
      <!-- Right: text -->
      <div class="hero-text-side">
        <div class="hero-content">
          <p class="hero-invite">{{ labelText || inviteText }}</p>
          <h1 class="hero-names">{{ brideName }} &amp; {{ groomName }}</h1>
          <p class="hero-subtitle">{{ subtitle }}</p>
          <div class="hero-date-block">
            <span class="date-day">{{ dateDay }}</span>
            <div class="date-detail">
              <p class="date-month">{{ dateMonth }}</p>
              <p class="date-year">{{ dateYear }}</p>
            </div>
          </div>
          <p class="hero-message">{{ venue }}, {{ location }}</p>
          <a href="#rsvp-section" class="hero-cta" @click.prevent="scrollToRsvp">{{ ctaLabel }}</a>
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
  subtitle: { type: String, default: '' },
  inviteText: { type: String, default: "You're Invited" },
  ctaLabel: { type: String, default: 'RSVP' },
  accentColor: { type: String, default: '#c9a96e' },
  accentHover: { type: String, default: '#b8944f' },
  dividerColor: { type: String, default: '#c9a96e' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
  gradientStart: { type: String, default: '#faf9f6' },
  gradientMid: { type: String, default: '#f5f0e8' },
  gradientEnd: { type: String, default: '#ebe4d6' },
});

const cssVars = computed(() => ({
  '--hero-heading-font': props.headingFont,
  '--hero-body-font': props.bodyFont,
  '--hero-accent': props.accentColor,
  '--hero-accent-hover': props.accentHover,
  '--hero-divider': props.dividerColor,
  '--hero-gradient-start': props.gradientStart,
  '--hero-gradient-mid': props.gradientMid,
  '--hero-gradient-end': props.gradientEnd,
}));

/* Parse weddingDate into day / month / year */
const parsedDate = computed(() => {
  if (!props.weddingDate) return null;
  const d = new Date(props.weddingDate);
  if (isNaN(d.getTime())) {
    /* Fallback: try to extract numbers from the string */
    const parts = props.weddingDate.match(/(\d{1,2})\D+(\w+)\D+(\d{4})/);
    if (parts) return { day: parts[1], month: parts[2], year: parts[3] };
    return null;
  }
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleString('en-US', { month: 'long' }).toUpperCase(),
    year: String(d.getFullYear()),
  };
});

const dateDay = computed(() => parsedDate.value?.day ?? '');
const dateMonth = computed(() => parsedDate.value?.month ?? '');
const dateYear = computed(() => parsedDate.value?.year ?? '');

function scrollToRsvp() {
  const el = document.getElementById('rsvp-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style scoped>
.hero-editorial {
  background: linear-gradient(
    135deg,
    var(--hero-gradient-start),
    var(--hero-gradient-mid),
    var(--hero-gradient-end)
  );
}

.hero-split {
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  position: relative;
}

/* ── Image side ── */
.hero-image-side {
  width: 100%;
}

.image-frame {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: var(--theme-accent, var(--hero-accent));
  opacity: 1;
  height: 420px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Film-grain texture overlay */
.grain-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.18;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-size: 128px 128px;
}

/* ── Divider line ── */
.hero-divider-line {
  display: none;
}

/* ── Text side ── */
.hero-text-side {
  width: 100%;
  text-align: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-invite {
  font-family: var(--font-body, var(--hero-body-font));
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: var(--theme-text-muted, #6b7280);
  margin: 0 0 16px;
}

.hero-names {
  font-family: var(--font-heading, var(--hero-heading-font));
  font-size: 48px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 12px;
  line-height: 1.1;
}

.hero-subtitle {
  font-family: var(--font-body, var(--hero-body-font));
  font-size: 16px;
  color: var(--theme-text-muted, #6b7280);
  margin: 0 0 32px;
  line-height: 1.6;
  max-width: 420px;
}

/* ── Date block ── */
.hero-date-block {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.date-day {
  font-family: var(--font-heading, var(--hero-heading-font));
  font-size: 72px;
  font-weight: 300;
  line-height: 1;
  color: var(--theme-accent, var(--hero-accent));
}

.date-detail {
  text-align: left;
}

.date-month {
  font-family: var(--font-body, var(--hero-body-font));
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--theme-text, #1f2937);
  margin: 0 0 2px;
}

.date-year {
  font-family: var(--font-body, var(--hero-body-font));
  font-size: 14px;
  color: var(--theme-text-muted, #6b7280);
  margin: 0;
}

/* ── Venue / message ── */
.hero-message {
  font-family: var(--font-body, var(--hero-body-font));
  font-size: 16px;
  color: var(--theme-text-muted, #6b7280);
  margin: 0 0 32px;
}

/* ── CTA ── */
.hero-cta {
  display: inline-block;
  padding: 14px 48px;
  background: var(--theme-accent, var(--hero-accent));
  color: #fff;
  font-family: var(--font-body, var(--hero-body-font));
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.3s ease, transform 0.2s ease;
}

.hero-cta:hover {
  background: var(--theme-accent-hover, var(--hero-accent-hover));
  transform: translateY(-1px);
}

/* ── Desktop: side-by-side ── */
@container (min-width: 768px) {
  .hero-split {
    flex-direction: row;
    gap: 0;
    padding: 80px 32px;
    align-items: stretch;
  }

  .hero-image-side {
    width: 48%;
    flex-shrink: 0;
  }

  .image-frame {
    height: 100%;
    min-height: 560px;
    border-radius: 20px;
  }

  .hero-divider-line {
    display: block;
    width: 1px;
    align-self: stretch;
    background: var(--theme-accent, var(--hero-divider));
    opacity: 0.35;
    margin: 32px 32px;
    flex-shrink: 0;
  }

  .hero-text-side {
    width: 48%;
    text-align: left;
    display: flex;
    align-items: center;
  }

  .hero-content {
    align-items: flex-start;
  }

  .hero-names {
    font-size: 56px;
  }

  .date-day {
    font-size: 88px;
  }
}

@container (min-width: 1024px) {
  .hero-split {
    padding: 96px 48px;
  }

  .hero-names {
    font-size: 64px;
  }

  .date-day {
    font-size: 100px;
  }
}
</style>

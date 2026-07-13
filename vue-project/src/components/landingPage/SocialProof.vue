<template>
  <section class="social-proof">
    <div class="wrap">
      <!-- Stats strip: real numbers that grow with the product -->
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{{ $t('home.socialProof.stats.invitationsSent') }}</div>
          <div class="stat-label">{{ $t('home.socialProof.stats.invitationsSentLabel') }}</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ $t('home.socialProof.stats.activeEvents') }}</div>
          <div class="stat-label">{{ $t('home.socialProof.stats.activeEventsLabel') }}</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ $t('home.socialProof.stats.languages') }}</div>
          <div class="stat-label">{{ $t('home.socialProof.stats.languagesLabel') }}</div>
        </div>
      </div>

      <!-- Testimonial card -->
      <figure class="testimonial">
        <div class="mark" aria-hidden="true">“</div>
        <blockquote>{{ $t('home.socialProof.quote') }}</blockquote>
        <figcaption>
          <div class="avatar" aria-hidden="true">{{ initials }}</div>
          <div class="attr">
            <div class="attr-name">{{ $t('home.socialProof.attribution.name') }}</div>
            <div class="attr-meta">{{ $t('home.socialProof.attribution.meta') }}</div>
          </div>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const initials = computed(() => {
  const name = t('home.socialProof.attribution.name') || '';
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '★';
});
</script>

<style scoped>
.social-proof {
  padding: 96px 52px;
  background: var(--bg-main, #fdfaf3);
}

.wrap { max-width: 1100px; margin: 0 auto; }

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding-bottom: 56px;
  border-bottom: 1px solid var(--soft-light, #e8e2d3);
}

.stat { text-align: center; }

.stat-value {
  font-family: var(--font-display);
  font-size: clamp(40px, 5vw, 60px);
  line-height: 1;
  color: var(--brand-main, #5a7a52);
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  margin-top: 10px;
  font-size: 13px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--neutral-700, #6b7280);
  font-weight: 600;
}

.testimonial {
  margin: 56px auto 0;
  max-width: 720px;
  padding: 40px 44px 36px;
  background: #fff;
  border-radius: 20px;
  border: 1px solid var(--soft-light, #e8e2d3);
  box-shadow: 0 6px 24px rgba(20, 30, 24, 0.05);
  position: relative;
}

.mark {
  position: absolute;
  top: 8px;
  left: 24px;
  font-family: var(--font-display);
  font-size: 100px;
  line-height: 1;
  color: var(--brand-light, #bfd2a4);
  opacity: 0.45;
  font-style: italic;
  user-select: none;
}

blockquote {
  margin: 0 0 24px;
  font-family: var(--font-display);
  font-style: italic;
  font-size: clamp(20px, 2.2vw, 26px);
  line-height: 1.5;
  color: var(--brand-main, #3d5a4f);
  position: relative;
  z-index: 1;
}

figcaption {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--brand-main, #5a7a52);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.attr-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--brand-main, #3d5a4f);
}

.attr-meta {
  font-size: 13px;
  color: var(--neutral-700, #6b7280);
  margin-top: 2px;
}

@media (max-width: 700px) {
  .social-proof { padding: 64px 24px; }
  .stats { grid-template-columns: 1fr; gap: 32px; padding-bottom: 40px; }
  .testimonial { padding: 32px 24px 28px; margin-top: 40px; }
}
</style>

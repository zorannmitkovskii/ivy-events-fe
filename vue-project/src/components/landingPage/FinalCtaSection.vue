<template>
  <section class="cta-banner">
    <span class="eyebrow">{{ $t('home.finalCta.eyebrow') }}</span>
    <h2>{{ $t('home.finalCta.titleLine1') }}<br><em>{{ $t('home.finalCta.titleAccent') }}</em> {{ $t('home.finalCta.titleLine2') }}</h2>
    <p class="s-desc">{{ $t('home.finalCta.subtitle') }}</p>
    <div class="cta-btns">
      <router-link :to="{ name: 'signup', params: { lang } }" class="btn-w">
        🌿 {{ $t('home.finalCta.primaryCta') }}
      </router-link>
      <router-link :to="{ name: 'EventInvitationsPage', params: { lang } }" class="btn-wo">
        {{ $t('home.finalCta.secondaryCta') }}
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");
</script>

<style scoped>
.cta-banner {
  background: var(--brand-main);
  padding: 100px 52px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-banner::before {
  content: '';
  position: absolute;
  top: -140px;
  right: -140px;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(191, 210, 164, 0.11) 0%, transparent 70%);
  pointer-events: none;
}

.eyebrow {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand-light);
  margin-bottom: 12px;
}

h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(32px, 3.6vw, 48px);
  font-weight: 400;
  line-height: 1.15;
  margin: 0 0 13px;
  color: #fff;
}

h2 em {
  font-style: italic;
  color: var(--secondary-gold);
}

.s-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.55);
  font-weight: 300;
  line-height: 1.75;
  max-width: 520px;
  margin: 0 auto;
}

.cta-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 40px;
  flex-wrap: wrap;
}

.btn-w {
  padding: 14px 34px;
  background: #fff;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--brand-main);
  text-decoration: none;
  transition: all 0.3s;
}

.btn-w:hover {
  background: var(--secondary-gold);
}

.btn-wo {
  padding: 14px 34px;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 14px;
  font-size: 14px;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-wo:hover {
  border-color: #fff;
}

@media (max-width: 640px) {
  .cta-banner { padding: 64px 24px; }
}
</style>

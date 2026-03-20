<template>
  <section class="hero">
    <div class="hero-inner">
      <!-- Left -->
      <div class="hero-left">
        <div class="hero-pill">
          <span class="hero-pill-dot"></span>
          {{ $t('home.hero.pill') }}
        </div>

        <h1 class="hero-h1">
          {{ $t('home.hero.titleLine1') }} <em>{{ $t('home.hero.titleAccent1') }}</em><br>
          {{ $t('home.hero.titleLine2') }} <em>{{ $t('home.hero.titleAccent2') }}</em> {{ $t('home.hero.titleLine3') }}
        </h1>

        <p class="hero-sub">{{ $t('home.hero.subtitle') }}</p>

        <div class="hero-btns">
          <router-link :to="resolvedPrimaryTo" class="btn-lg primary">
            {{ $t('home.hero.primaryCta') }}
          </router-link>
          <router-link :to="resolvedSecondaryTo" class="btn-lg ghost">
            {{ $t('home.hero.secondaryCta') }} →
          </router-link>
        </div>

<!--        <div class="hero-nums">-->
<!--          <div v-for="stat in stats" :key="stat.labelKey" class="hero-num">-->
<!--            <div class="hero-num-val">{{ stat.value }}</div>-->
<!--            <div class="hero-num-lbl">{{ $t(stat.labelKey) }}</div>-->
<!--          </div>-->
<!--        </div>-->
      </div>

      <!-- Right: Invitation card visual -->
      <div class="hero-vis">
        <!-- Float chip: top -->
        <div class="float-chip top">
          <div class="chip-icon">✉️</div>
          <div>
            <div class="chip-title">{{ $t('home.hero.chipConfirm') }}</div>
            <div class="chip-sub">{{ $t('home.hero.chipConfirmSub') }}</div>
          </div>
        </div>

        <!-- Card -->
        <div class="invite-card">
          <div class="invite-inner">
            <div class="invite-leaf">🌸</div>
            <div class="invite-label">{{ $t('home.hero.cardLabel') }}</div>
            <div class="invite-names">{{ $t('home.hero.cardNames') }}</div>
            <div class="invite-rule"></div>
            <div class="invite-date">📅 {{ $t('home.hero.cardDate') }}</div>
            <div class="invite-loc">📍 {{ $t('home.hero.cardLocation') }}</div>
            <div class="invite-btn">RSVP</div>
          </div>
        </div>

        <!-- Float chip: bottom -->
        <div class="float-chip bot">
          <div class="chip-icon">📊</div>
          <div>
            <div class="chip-title">{{ $t('home.hero.chipGuests') }}</div>
            <div class="chip-sub-light">{{ $t('home.hero.chipGuestsSub') }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const props = defineProps({
  primaryTo: { type: [String, Object], default: null },
  secondaryTo: { type: [String, Object], default: null }
});

const resolvedPrimaryTo = computed(() =>
  props.primaryTo || { name: 'signup', params: { lang: lang.value } }
);

const resolvedSecondaryTo = computed(() =>
  props.secondaryTo || { name: 'EventInvitationsPage', params: { lang: lang.value } }
);

const stats = [
  { value: "500+", labelKey: "home.hero.statTemplates" },
  { value: "12K+", labelKey: "home.hero.statSent" },
  { value: "98%", labelKey: "home.hero.statSatisfied" },
];
</script>

<style scoped>
.hero {
  padding-top: 68px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: var(--bg-main);
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: -180px;
  right: -180px;
  width: 680px;
  height: 680px;
  background: radial-gradient(circle, rgba(191, 210, 164, 0.24) 0%, transparent 68%);
  pointer-events: none;
}

.hero::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: 15%;
  width: 340px;
  height: 340px;
  background: radial-gradient(circle, rgba(200, 162, 77, 0.09) 0%, transparent 70%);
  pointer-events: none;
}

.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 52px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

/* Pill badge */
.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: var(--brand-light);
  color: var(--brand-main);
  padding: 6px 15px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 26px;
}

.hero-pill-dot {
  width: 5px;
  height: 5px;
  background: var(--brand-main);
  border-radius: 50%;
}

/* Heading */
.hero-h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(42px, 5.4vw, 72px);
  font-weight: 400;
  line-height: 1.07;
  margin: 0 0 22px;
  color: var(--brand-main);
  opacity: 0;
  animation: heroUp 0.9s ease 0.15s forwards;
}

.hero-h1 em {
  font-style: italic;
  color: var(--brand-gold);
}

.hero-sub {
  font-size: 15.5px;
  line-height: 1.75;
  color: var(--neutral-700);
  font-weight: 300;
  max-width: 400px;
  margin: 0 0 40px;
  opacity: 0;
  animation: heroUp 0.9s ease 0.3s forwards;
}

/* Buttons */
.hero-btns {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  opacity: 0;
  animation: heroUp 0.9s ease 0.45s forwards;
}

.btn-lg {
  padding: 14px 30px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-lg.primary {
  background: var(--brand-main);
  color: #fff;
}

.btn-lg.primary:hover {
  background: var(--brand-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-lg.ghost {
  border: 1.5px solid var(--soft-light);
  background: #fff;
  color: var(--brand-main);
}

.btn-lg.ghost:hover {
  border-color: var(--brand-main);
}

/* Stats */
.hero-nums {
  display: flex;
  gap: 28px;
  margin-top: 48px;
  padding-top: 28px;
  border-top: 1px solid var(--soft-light);
  opacity: 0;
  animation: heroUp 0.9s ease 0.6s forwards;
}

.hero-num-val {
  font-family: 'Cormorant Garamond', serif;
  font-size: 34px;
  font-weight: 400;
  color: var(--brand-main);
  line-height: 1;
}

.hero-num-lbl {
  font-size: 13px;
  color: var(--neutral-700);
  margin-top: 3px;
}

/* Right: Visual */
.hero-vis {
  position: relative;
  opacity: 0;
  animation: heroFade 1.2s ease 0.35s forwards;
}

.invite-card {
  border-radius: 22px;
  background: var(--brand-main);
  aspect-ratio: 3 / 4;
  max-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  position: relative;
}

.invite-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 20%, rgba(191, 210, 164, 0.18) 0%, transparent 60%);
}

.invite-inner {
  width: 80%;
  background: var(--bg-main);
  border-radius: 14px;
  padding: 30px 22px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.22);
  position: relative;
  z-index: 1;
}

.invite-leaf { font-size: 28px; margin-bottom: 9px; }
.invite-label { font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--neutral-700); margin-bottom: 7px; }
.invite-names { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-style: italic; color: var(--brand-main); line-height: 1.2; margin-bottom: 12px; }
.invite-rule { width: 32px; height: 1px; background: var(--brand-gold); margin: 0 auto 12px; }
.invite-date { font-size: 13px; color: var(--neutral-700); margin-bottom: 4px; }
.invite-loc { font-size: 13px; color: var(--neutral-700); margin-bottom: 17px; }
.invite-btn { display: inline-block; padding: 8px 20px; background: var(--brand-main); border-radius: 8px; font-size: 10.5px; font-weight: 500; color: #fff; letter-spacing: 0.07em; }

/* Floating chips */
.float-chip {
  position: absolute;
  background: #fff;
  border-radius: 12px;
  padding: 11px 15px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 9px;
  z-index: 2;
}

.float-chip.top {
  top: -16px;
  right: -30px;
  animation: heroFloat 4s ease-in-out infinite;
}

.float-chip.bot {
  bottom: 32px;
  left: -38px;
  background: var(--brand-main);
  color: #fff;
  animation: heroFloat 4s ease-in-out 2s infinite;
}

.chip-icon { font-size: 17px; }
.chip-title { font-size: 12px; font-weight: 500; }
.chip-sub { font-size: 11px; color: var(--neutral-700); }
.chip-sub-light { font-size: 10px; color: var(--brand-light); }

/* Animations */
@keyframes heroUp {
  from { opacity: 0; transform: translateY(26px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes heroFade {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes heroFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Responsive */
@media (max-width: 992px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 48px;
    padding: 60px 24px;
  }

  .hero-vis {
    max-width: 360px;
    margin: 0 auto;
  }
}

@media (max-width: 520px) {
  .hero-inner { padding: 40px 20px; }
  .hero-nums { gap: 18px; }
  .float-chip.top { right: -10px; }
  .float-chip.bot { left: -10px; }
}
</style>

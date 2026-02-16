<template>
  <aside class="promo">
    <!-- background image (optional) -->
    <div class="promo__bg" :style="bgStyle" aria-hidden="true"></div>

    <!-- overlay tint -->
    <div class="promo__overlay" aria-hidden="true"></div>

    <div class="promo__content">
      <div class="promo__logo" aria-hidden="true">
        <img src="/iconInv.svg" alt="" class="promo__logo-img" />
      </div>

      <h2 class="promo__title">{{ title }}</h2>
      <p class="promo__subtitle">{{ subtitle }}</p>

      <ul class="promo__list">
        <li v-for="(item, idx) in items" :key="idx" class="promo__item">
          <span class="promo__check" aria-hidden="true">✓</span>
          <span class="promo__text">{{ item }}</span>
        </li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  items: { type: Array, required: true },
  /** Optional: background image url */
  backgroundUrl: { type: String, default: "" }
});

const bgStyle = computed(() =>
  props.backgroundUrl
    ? { backgroundImage: `url(${props.backgroundUrl})` }
    : {}
);
</script>

<style scoped>
.promo {
  position: relative;
  height: 100%;
  border-radius: 0;
  overflow: hidden;
  display: grid;
  place-items: center;
  padding: 40px 28px;
}

/* Background */
.promo__bg {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  transform: scale(1.08);
  filter: blur(10px);
  opacity: 0.85;
}

/* Brand-tinted overlay (uses your tokens) */
.promo__overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(900px 450px at 50% 25%, rgba(231,231,231,0.18), transparent 60%),
    linear-gradient(180deg,
    rgba(47,62,54,0.78) 0%,
    rgba(93,106,87,0.72) 55%,
    rgba(47,62,54,0.82) 100%
    );
}

/* Content */
.promo__content {
  position: relative;
  z-index: 2;
  max-width: 520px;
  text-align: center;
  color: var(--bg-white);
}

/* Soft logo circle */
.promo__logo {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin: 0 auto 18px;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.10);
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
}

.promo__logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.promo__title {
  margin: 0 0 12px;
  font-size: 46px;
  line-height: 1.05;
  font-weight: 600;
  font-family: var(--font-family), serif;
}

.promo__subtitle {
  margin: 0 auto 22px;
  max-width: 520px;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(255,255,255,0.86);
}

/* Checklist */
.promo__list {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  display: grid;
  gap: 12px;
  justify-items: center;
}

.promo__item {
  width: fit-content;
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 12px;
  align-items: center;
  text-align: left;
}

.promo__check {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255,255,255,0.22);
  color: var(--brand-gold);
  font-weight: 900;
}

.promo__text {
  color: rgba(255,255,255,0.92);
  font-size: 14px;
}

/* Optional: slightly tighter on smaller screens */
@media (max-width: 1200px) {
  .promo__title { font-size: 40px; }
}
</style>

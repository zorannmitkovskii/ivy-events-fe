<template>
  <section class="testimonials">
    <div class="wrap">
      <div class="s-head">
        <span class="eyebrow">{{ $t('home.testimonials.eyebrow') }}</span>
        <h2>{{ $t('home.testimonials.titleBefore') }} <em>{{ $t('home.testimonials.titleAccent') }}</em></h2>
      </div>

      <div class="testi-grid">
        <div v-for="(item, i) in testimonials" :key="i" class="testi-card">
          <div class="testi-stars">★★★★★</div>
          <div class="testi-text">"{{ item.text }}"</div>
          <div class="testi-author">
            <div class="testi-avatar" :style="{ background: item.avatarBg }">{{ item.emoji }}</div>
            <div>
              <div class="testi-name">{{ item.name }}</div>
              <div class="testi-event">{{ item.event }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const testimonials = [
  {
    text: t('home.testimonials.items.first.text'),
    name: t('home.testimonials.items.first.name'),
    event: t('home.testimonials.items.first.event'),
    emoji: "👰",
    avatarBg: "rgba(191,210,164,.3)"
  },
  {
    text: t('home.testimonials.items.second.text'),
    name: t('home.testimonials.items.second.name'),
    event: t('home.testimonials.items.second.event'),
    emoji: "🎂",
    avatarBg: "rgba(200,162,77,.2)"
  },
  {
    text: t('home.testimonials.items.third.text'),
    name: t('home.testimonials.items.third.name'),
    event: t('home.testimonials.items.third.event'),
    emoji: "🏢",
    avatarBg: "rgba(93,106,87,.2)"
  }
];
</script>

<style scoped>
.testimonials {
  padding: 96px 52px;
  background: var(--bg-main);
}

.wrap { max-width: 1200px; margin: 0 auto; }

.s-head { text-align: center; margin-bottom: 56px; }

.eyebrow {
  display: inline-block;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand-main);
  margin-bottom: 12px;
}

h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(36px, 4vw, 54px);
  font-weight: 400;
  line-height: 1.15;
  margin: 0;
  color: var(--brand-main);
}

h2 em { font-style: italic; color: var(--brand-gold); }

/* Grid */
.testi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.testi-card {
  background: var(--bg-white);
  border-radius: 14px;
  padding: 28px;
  border: 1.5px solid var(--soft-light);
  transition: all 0.3s;
}

.testi-card:hover {
  border-color: var(--brand-light);
  box-shadow: var(--shadow-sm);
}

.testi-stars {
  color: var(--brand-gold);
  font-size: 13px;
  margin-bottom: 14px;
  letter-spacing: 2px;
}

.testi-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px;
  font-style: italic;
  line-height: 1.6;
  color: var(--brand-main);
  margin-bottom: 18px;
}

.testi-author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.testi-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}

.testi-name {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--brand-main);
}

.testi-event {
  font-size: 13px;
  color: var(--neutral-700);
}

@media (max-width: 900px) {
  .testimonials { padding: 64px 24px; }
  .testi-grid { grid-template-columns: 1fr; max-width: 480px; margin: 0 auto; }
}
</style>

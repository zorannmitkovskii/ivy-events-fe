<template>
  <section class="templates" :id="id">
    <div class="wrap">
      <div class="s-head">
        <span class="eyebrow">{{ $t('home.templates.eyebrow') }}</span>
        <h2>{{ $t('home.templates.titleBefore') }} <em>{{ $t('home.templates.titleAccent') }}</em></h2>
      </div>

      <div class="tpl-grid">
        <div v-for="(tpl, i) in templates" :key="i" class="tpl-card" @click="goToTemplate(tpl)">
          <div class="tpl-thumb" :class="tpl.gradientClass">
            <div class="mini">
              <div style="font-size:17px;margin-bottom:6px">{{ tpl.emoji }}</div>
              <div class="mini-names">{{ tpl.names }}</div>
              <div class="mini-line"></div>
              <div class="mini-date">{{ tpl.date }}</div>
              <div class="mini-rsvp" :style="tpl.rsvpStyle || {}">RSVP</div>
            </div>
          </div>
          <div class="tpl-info">
            <h3>{{ tpl.title }}</h3>
            <p>{{ tpl.subtitle }}</p>
          </div>
        </div>
      </div>

      <div class="tpl-cta">
        <router-link :to="resolvedCtaTo" class="btn-lg ghost">
          {{ $t('home.templates.cta') }} →
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || "mk");

const props = defineProps({
  id: { type: String, default: "templates" },
  ctaTo: { type: [String, Object], default: null }
});

const resolvedCtaTo = computed(() =>
  props.ctaTo || { name: 'EventInvitationsPage', params: { lang: lang.value } }
);

const templates = computed(() => [
  {
    emoji: "🌸",
    names: t('home.templates.items.elegantWedding.cardNames'),
    date: t('home.templates.items.elegantWedding.cardDate'),
    title: t('home.templates.items.elegantWedding.title'),
    subtitle: t('home.templates.items.elegantWedding.subtitle'),
    gradientClass: "g1",
    routeName: "persianWedding",
  },
  {
    emoji: "🌿",
    names: t('home.templates.items.birthday.cardNames'),
    date: t('home.templates.items.birthday.cardDate'),
    title: t('home.templates.items.birthday.title'),
    subtitle: t('home.templates.items.birthday.subtitle'),
    gradientClass: "g2",
    rsvpStyle: { background: '#5D6A57' },
    routeName: "parisianWedding",
  },
  {
    emoji: "✨",
    names: t('home.templates.items.corporate.cardNames'),
    date: t('home.templates.items.corporate.cardDate'),
    title: t('home.templates.items.corporate.title'),
    subtitle: t('home.templates.items.corporate.subtitle'),
    gradientClass: "g3",
    routeName: "coastalBreeze",
  }
]);

function goToTemplate(tpl) {
  router.push({ name: tpl.routeName, params: { lang: lang.value } });
}
</script>

<style scoped>
.templates {
  padding: 96px 52px;
  background: var(--bg-white);
}

.wrap { max-width: 1200px; margin: 0 auto; }

.s-head { text-align: center; margin-bottom: 56px; }

.eyebrow {
  display: inline-block;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand-gold);
  margin-bottom: 12px;
}

h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(32px, 3.6vw, 48px);
  font-weight: 400;
  line-height: 1.15;
  margin: 0;
  color: var(--brand-main);
}

h2 em { font-style: italic; color: var(--neutral-500); }

/* Grid */
.tpl-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.tpl-card {
  border-radius: 14px;
  overflow: hidden;
  background: var(--bg-white);
  box-shadow: var(--shadow-sm);
  transition: all 0.35s;
  cursor: pointer;
}

.tpl-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lg);
}

.tpl-thumb {
  aspect-ratio: 3 / 4;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
}

.tpl-thumb.g1 { background: linear-gradient(145deg, #2F3E36, #5D6A57); }
.tpl-thumb.g2 { background: linear-gradient(145deg, #F0EBE0, #E1C699); }
.tpl-thumb.g3 { background: linear-gradient(145deg, #BFD2A4, #2F3E36); }

.mini {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 16px 13px;
  text-align: center;
  width: 100%;
}

.mini-names {
  font-family: 'Cormorant Garamond', serif;
  font-size: 19px;
  font-style: italic;
  margin-bottom: 5px;
  color: var(--brand-main);
}

.mini-date {
  font-size: 11px;
  color: var(--neutral-500);
  margin-bottom: 9px;
}

.mini-line {
  height: 1px;
  background: var(--brand-gold);
  width: 26px;
  margin: 0 auto 9px;
}

.mini-rsvp {
  font-size: 9.5px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 6px 14px;
  background: var(--brand-main);
  color: #fff;
  border-radius: 7px;
  display: inline-block;
}

.tpl-info {
  padding: 14px 18px 17px;
}

.tpl-info h3 {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 3px;
  color: var(--brand-main);
}

.tpl-info p {
  font-size: 12px;
  color: var(--neutral-500);
  margin: 0;
}

/* CTA */
.tpl-cta {
  text-align: center;
  margin-top: 36px;
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

.btn-lg.ghost {
  border: 1.5px solid var(--soft-light);
  background: #fff;
  color: var(--brand-main);
}

.btn-lg.ghost:hover {
  border-color: var(--brand-main);
}

@media (max-width: 900px) {
  .templates { padding: 64px 24px; }
  .tpl-grid { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; }
}
</style>

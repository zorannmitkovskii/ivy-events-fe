<template>
  <section class="how">
    <div class="wrap">
      <div class="s-head">
        <span class="eyebrow">{{ $t('home.howItWorks.eyebrow') }}</span>
        <h2>{{ $t('home.howItWorks.titleBefore') }} <em>{{ $t('home.howItWorks.titleAccent') }}</em></h2>
        <p class="s-desc">{{ $t('home.howItWorks.subtitle') }}</p>
      </div>

      <div class="steps">
        <div v-for="(step, i) in steps" :key="i" class="step">
          <div class="step-icon">
            {{ step.icon }}
            <span class="step-n">{{ i + 1 }}</span>
          </div>
          <div class="step-t">{{ step.title }}</div>
          <div class="step-d">{{ step.description }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const steps = [
  { icon: "🎨", title: t('home.howItWorks.steps.chooseTemplate.title'), description: t('home.howItWorks.steps.chooseTemplate.description') },
  { icon: "✏️", title: t('home.howItWorks.steps.customizeEvent.title'), description: t('home.howItWorks.steps.customizeEvent.description') },
  { icon: "📨", title: t('home.howItWorks.steps.sendInvitations.title'), description: t('home.howItWorks.steps.sendInvitations.description') },
  { icon: "📊", title: t('home.howItWorks.steps.trackRsvps.title'), description: t('home.howItWorks.steps.trackRsvps.description') },
];
</script>

<style scoped>
.how {
  padding: 96px 52px;
  background: var(--bg-white);
}

.wrap {
  max-width: 1200px;
  margin: 0 auto;
}

.s-head {
  text-align: center;
  margin-bottom: 56px;
}

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
  margin: 0 0 13px;
  color: var(--brand-main);
}

h2 em {
  font-style: italic;
  color: var(--neutral-500);
}

.s-desc {
  font-size: 15px;
  color: var(--neutral-500);
  font-weight: 300;
  line-height: 1.75;
  max-width: 520px;
  margin: 0 auto;
}

/* Steps */
.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  top: 38px;
  left: 13%;
  right: 13%;
  height: 1px;
  background: var(--brand-light);
  z-index: 0;
}

.step {
  text-align: center;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

.step-icon {
  width: 76px;
  height: 76px;
  background: var(--brand-light);
  border-radius: 14px;
  margin: 0 auto 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s;
  position: relative;
}

.step:hover .step-icon {
  background: var(--brand-main);
}

.step-n {
  position: absolute;
  bottom: -9px;
  right: -9px;
  width: 24px;
  height: 24px;
  background: var(--brand-gold);
  color: #fff;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

.step-t {
  font-size: 14.5px;
  font-weight: 500;
  margin: 20px 0 7px;
  color: var(--brand-main);
}

.step-d {
  font-size: 13px;
  color: var(--neutral-500);
  line-height: 1.7;
}

@media (max-width: 900px) {
  .how { padding: 64px 24px; }
  .steps { grid-template-columns: repeat(2, 1fr); gap: 32px; }
  .steps::before { display: none; }
}

@media (max-width: 520px) {
  .steps { grid-template-columns: 1fr; }
}
</style>

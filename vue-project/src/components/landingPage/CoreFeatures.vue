<template>
  <section class="feat" :id="id">
    <div class="wrap">
      <div class="feat-grid">
        <!-- Left: Features list -->
        <div class="feat-left">
          <span class="eyebrow">{{ $t('home.features.eyebrow') }}</span>
          <h2>{{ $t('home.features.titleBefore') }} <em>{{ $t('home.features.titleAccent') }}</em></h2>
          <p class="feat-desc">{{ $t('home.features.subtitle') }}</p>

          <div class="feat-list">
            <div v-for="feat in features" :key="feat.titleKey" class="feat-item">
              <div class="feat-ico" :style="{ background: feat.icoBg }">{{ feat.icon }}</div>
              <div>
                <h4>{{ $t(feat.titleKey) }}</h4>
                <p>{{ $t(feat.descKey) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: RSVP panel -->
        <div class="feat-right">
          <div class="feat-right-label">{{ $t('home.features.rsvpLabel') }}</div>
          <h3>{{ $t('home.features.rsvpTitle') }}</h3>

          <div v-for="(guest, i) in rsvpGuests" :key="i" class="rsvp-stat">
            <div class="rsvp-stat-left">
              <div class="rsvp-dot" :style="{ background: guest.dotColor }"></div>
              <div>
                <div class="rsvp-name">{{ guest.name }}</div>
                <div class="rsvp-time">{{ guest.time }}</div>
              </div>
            </div>
            <div class="rsvp-badge" :class="guest.status">{{ guest.label }}</div>
          </div>

          <div class="feat-right-bar">
            <div class="bar-label">
              <span>{{ $t('home.features.rsvpConfirmed') }}</span>
              <span>47 / 80</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width: 59%"></div>
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

defineProps({
  id: { type: String, default: "features" }
});

const features = [
  { icon: "🎨", icoBg: "rgba(191,210,164,.3)", titleKey: "home.features.items.beautifulDesigns.title", descKey: "home.features.items.beautifulDesigns.description" },
  { icon: "🔔", icoBg: "rgba(200,162,77,.18)", titleKey: "home.features.items.automatedReminders.title", descKey: "home.features.items.automatedReminders.description" },
  { icon: "📱", icoBg: "rgba(237,110,105,.13)", titleKey: "home.features.items.mobileFriendly.title", descKey: "home.features.items.mobileFriendly.description" },
  { icon: "📍", icoBg: "rgba(93,106,87,.13)", titleKey: "home.features.items.eventDetails.title", descKey: "home.features.items.eventDetails.description" },
];

const rsvpGuests = [
  { name: t('home.features.rsvpGuest1'), time: t('home.features.rsvpTime1'), dotColor: "#BFD2A4", status: "yes", label: t('home.features.rsvpYes') },
  { name: t('home.features.rsvpGuest2'), time: t('home.features.rsvpTime2'), dotColor: "#ED6E69", status: "no", label: t('home.features.rsvpNo') },
  { name: t('home.features.rsvpGuest3'), time: t('home.features.rsvpTime3'), dotColor: "#C8A24D", status: "may", label: t('home.features.rsvpMaybe') },
  { name: t('home.features.rsvpGuest4'), time: t('home.features.rsvpTime4'), dotColor: "#BFD2A4", status: "yes", label: t('home.features.rsvpYes2') },
];
</script>

<style scoped>
.feat {
  padding: 96px 52px;
  background: var(--bg-main);
}

.wrap { max-width: 1200px; margin: 0 auto; }

.feat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}

/* Left */
.feat-left h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(32px, 4vw, 50px);
  font-weight: 400;
  line-height: 1.15;
  text-align: left;
  margin: 0 0 12px;
  color: var(--brand-main);
}

.feat-left h2 em { font-style: italic; color: var(--brand-gold); }

.eyebrow {
  display: inline-block;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--brand-main);
  margin-bottom: 12px;
}

.feat-desc {
  font-size: 17px;
  color: var(--neutral-700);
  line-height: 1.8;
  font-weight: 300;
  margin: 0 0 32px;
}

.feat-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feat-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  background: var(--bg-white);
  border-radius: 14px;
  border: 1.5px solid var(--soft-light);
  transition: all 0.3s;
}

.feat-item:hover {
  border-color: var(--brand-light);
  box-shadow: var(--shadow-sm);
}

.feat-ico {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.feat-item h4 {
  font-size: 15.5px;
  font-weight: 500;
  margin: 0 0 4px;
  color: var(--brand-main);
}

.feat-item p {
  font-size: 14.5px;
  color: var(--neutral-700);
  line-height: 1.6;
  margin: 0;
}

/* Right: RSVP panel */
.feat-right {
  background: var(--brand-main);
  border-radius: 22px;
  padding: 44px 36px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.feat-right::before {
  content: '';
  position: absolute;
  top: -80px;
  right: -80px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(191, 210, 164, 0.15) 0%, transparent 70%);
}

.feat-right-label {
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--brand-light);
  margin-bottom: 16px;
}

.feat-right h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 400;
  font-style: italic;
  margin: 0 0 28px;
  line-height: 1.3;
}

.rsvp-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

.rsvp-stat-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rsvp-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.rsvp-name { font-size: 13px; }
.rsvp-time { font-size: 11px; color: rgba(255, 255, 255, 0.4); }

.rsvp-badge {
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 100px;
}

.rsvp-badge.yes { background: rgba(191, 210, 164, 0.2); color: var(--brand-light); }
.rsvp-badge.no { background: rgba(237, 110, 105, 0.15); color: #ED6E69; }
.rsvp-badge.may { background: rgba(200, 162, 77, 0.15); color: var(--secondary-gold); }

.feat-right-bar { margin-top: 22px; }

.bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 7px;
  color: rgba(255, 255, 255, 0.7);
}

.bar-track {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--brand-light);
  border-radius: 100px;
  transition: width 1s ease;
}

@media (max-width: 900px) {
  .feat { padding: 64px 24px; }
  .feat-grid { grid-template-columns: 1fr; }
  .feat-right { margin-top: 24px; }
}
</style>

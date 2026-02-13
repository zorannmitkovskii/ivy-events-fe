<template>
  <div class="agenda-timeline" :style="cssVars">
    <div class="agenda-header">
      <h2 class="agenda-title">{{ title }}</h2>
      <div class="agenda-divider"></div>
    </div>

    <div class="agenda-track">
      <div class="agenda-line" aria-hidden="true"></div>

      <div
        v-for="(event, idx) in events"
        :key="idx"
        class="agenda-item"
        :class="{ 'agenda-item--last': idx === events.length - 1 }"
      >
        <!-- Desktop left: title + venue -->
        <div class="agenda-left">
          <h3 class="item-title">{{ event.title }}</h3>
          <p v-if="event.venue" class="item-venue">{{ event.venue }}</p>
        </div>

        <!-- Center dot with icon -->
        <div class="agenda-dot">
          <slot :name="'icon-' + idx">
            <span v-if="event.icon" class="dot-icon">{{ event.icon }}</span>
          </slot>
        </div>

        <!-- Right: time badge + description -->
        <div class="agenda-right">
          <span class="time-badge">{{ event.time }}</span>
          <!-- Mobile-only: title + venue repeated -->
          <div class="mobile-info">
            <h3 class="item-title">{{ event.title }}</h3>
            <p v-if="event.venue" class="item-venue">{{ event.venue }}</p>
          </div>
          <p class="item-description">{{ event.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'The Agenda' },
  events: { type: Array, required: true },
  lineColor: { type: String, default: '#dec69a' },
  badgeBg: { type: String, default: '#f6f1e3' },
  badgeText: { type: String, default: '#7f4d36' },
  dotBorder: { type: String, default: '#dec69a' },
  iconColor: { type: String, default: '#b97645' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--at-heading-font': props.headingFont,
  '--at-body-font': props.bodyFont,
  '--at-line-color': props.lineColor,
  '--at-badge-bg': props.badgeBg,
  '--at-badge-text': props.badgeText,
  '--at-dot-border': props.dotBorder,
  '--at-icon-color': props.iconColor,
}));
</script>

<style scoped>
.agenda-header {
  text-align: center;
  margin-bottom: 64px;
}

.agenda-title {
  font-family: var(--at-heading-font);
  font-size: 48px;
  font-weight: 400;
  color: #1f2937;
  margin: 0 0 16px;
}

.agenda-divider {
  width: 96px;
  height: 1px;
  background: #d1d5db;
  margin: 0 auto;
}

/* Track */
.agenda-track {
  position: relative;
  max-width: 750px;
  margin: 0 auto;
}

.agenda-line {
  display: none;
}

.agenda-item {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  position: relative;
  margin-bottom: 48px;
  padding-left: 64px;
}

.agenda-item--last {
  margin-bottom: 0;
}

/* Left side (desktop only) */
.agenda-left {
  display: none;
}

/* Center dot */
.agenda-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid var(--at-dot-border);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  color: var(--at-icon-color);
  flex-shrink: 0;
}

.dot-icon {
  font-size: 16px;
  line-height: 1;
}

/* Right side */
.agenda-right {
  flex: 1;
}

.time-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--at-badge-bg);
  color: var(--at-badge-text);
  font-family: var(--at-heading-font);
  font-size: 13px;
  letter-spacing: 0.15em;
  border-radius: 2px;
  margin-bottom: 8px;
}

.mobile-info {
  margin-bottom: 8px;
}

.item-title {
  font-family: var(--at-heading-font);
  font-size: 24px;
  font-weight: 400;
  color: #1f2937;
  margin: 0;
}

.item-venue {
  font-family: var(--at-body-font);
  font-style: italic;
  font-size: 16px;
  color: #6b7280;
  margin: 2px 0 0;
}

.item-description {
  font-family: var(--at-body-font);
  font-size: 18px;
  line-height: 1.6;
  color: #4b5563;
  margin: 0;
}

/* Desktop: alternating center timeline */
@media (min-width: 768px) {
  .agenda-line {
    display: block;
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--at-line-color);
    transform: translateX(-50%);
  }

  .agenda-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding-left: 0;
  }

  .agenda-left {
    display: block;
    width: calc(50% - 40px);
    text-align: right;
    padding-right: 32px;
  }

  .agenda-dot {
    position: relative;
    left: auto;
    top: auto;
    flex-shrink: 0;
  }

  .agenda-right {
    width: calc(50% - 40px);
    padding-left: 32px;
  }

  .mobile-info {
    display: none;
  }
}

@media (max-width: 767px) {
  .agenda-title {
    font-size: 36px;
  }

  /* Vertical line on the left for mobile */
  .agenda-track::before {
    content: '';
    position: absolute;
    left: 23px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--at-line-color);
  }
}
</style>
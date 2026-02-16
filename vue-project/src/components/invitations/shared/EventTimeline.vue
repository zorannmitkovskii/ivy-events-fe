<template>
  <div class="event-timeline" :style="cssVars">
    <h2 class="timeline-heading">{{ title }}</h2>

    <div class="timeline-track">
      <div class="timeline-line" aria-hidden="true"></div>

      <div
        v-for="(event, idx) in events"
        :key="idx"
        class="timeline-item"
        :class="{ 'timeline-item--flip': idx % 2 !== 0 }"
      >
        <!-- Left / content side -->
        <div class="timeline-content">
          <h3 class="event-title">{{ event.title }}</h3>
          <p v-if="event.subtitle" class="event-subtitle">{{ event.subtitle }}</p>
        </div>

        <!-- Center dot -->
        <div class="timeline-dot" :style="{ background: event.color || lineColor }">
          <slot :name="'icon-' + idx">
            <span v-if="event.icon" class="dot-icon">{{ event.icon }}</span>
          </slot>
        </div>

        <!-- Right / time side -->
        <div class="timeline-time">
          <span class="time-pill" :style="{ background: (event.color || lineColor) + '33' }">{{ event.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'The Big Day' },
  events: { type: Array, required: true },
  lineColor: { type: String, default: '#E6E6FA' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--tl-line-color': props.lineColor,
  '--tl-heading-font': props.headingFont,
  '--tl-body-font': props.bodyFont,
}));
</script>

<style scoped>
.event-timeline {
  width: 100%;
}

.timeline-heading {
  font-family: var(--tl-heading-font);
  font-size: 32px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin: 0 0 48px;
}

.timeline-track {
  position: relative;
  max-width: 700px;
  margin: 0 auto;
}

.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--tl-line-color);
  border-radius: 4px;
  transform: translateX(-50%);
}

.timeline-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: 20px 0;
}

/* Content side (left by default) */
.timeline-content {
  width: calc(50% - 40px);
  text-align: right;
  padding-right: 16px;
}

/* Dot in center */
.timeline-dot {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  flex-shrink: 0;
}

.dot-icon {
  font-size: 16px;
  color: #fff;
  line-height: 1;
}

/* Time side (right by default) */
.timeline-time {
  width: calc(50% - 40px);
  text-align: left;
  padding-left: 16px;
}

/* Flipped row: content right, time left */
.timeline-item--flip .timeline-content {
  order: 3;
  text-align: left;
  padding-right: 0;
  padding-left: 16px;
}

.timeline-item--flip .timeline-time {
  order: 1;
  text-align: right;
  padding-left: 0;
  padding-right: 16px;
}

.timeline-item--flip .timeline-dot {
  order: 2;
}

.event-title {
  font-family: var(--tl-heading-font);
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.event-subtitle {
  font-family: var(--tl-body-font);
  font-size: 14px;
  color: #888;
  margin: 2px 0 0;
}

.time-pill {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 100px;
  font-family: var(--tl-body-font);
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

/* Mobile: stack vertically, line on left */
@media (max-width: 640px) {
  .timeline-line {
    left: 22px;
    transform: none;
  }

  .timeline-item,
  .timeline-item--flip {
    flex-direction: row;
    padding-left: 60px;
  }

  .timeline-dot {
    left: 22px;
    transform: translateX(-50%);
    position: absolute;
  }

  .timeline-content,
  .timeline-item--flip .timeline-content {
    width: auto;
    text-align: left;
    padding: 0;
    order: 1;
  }

  .timeline-time,
  .timeline-item--flip .timeline-time {
    width: auto;
    text-align: left;
    padding: 0;
    order: 2;
    margin-left: 12px;
  }

  .timeline-item--flip .timeline-content {
    padding-left: 0;
  }

  .timeline-item--flip .timeline-time {
    padding-right: 0;
  }
}
</style>

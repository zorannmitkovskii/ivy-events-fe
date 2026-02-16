<template>
  <div class="vertical-timeline" :style="cssVars">
    <h2 v-if="title" class="timeline-title">{{ title }}</h2>

    <div class="timeline-list">
      <div
        v-for="(event, idx) in events"
        :key="idx"
        class="timeline-item"
      >
        <span
          class="time-pill"
          :style="{ background: event.color || pillColors[idx % pillColors.length] }"
        >
          {{ event.time }}
        </span>
        <div class="event-card">
          <h3 class="event-title">{{ event.title }}</h3>
          <p v-if="event.subtitle" class="event-subtitle">{{ event.subtitle }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: '' },
  events: { type: Array, required: true },
  pillColors: { type: Array, default: () => ['#F9A8D4', '#C4B5FD', '#6EE7B7'] },
  cardBg: { type: String, default: '#fff' },
  cardShadow: { type: String, default: '0px 4px 20px rgba(200, 180, 220, 0.15)' },
  cardRadius: { type: String, default: '16px' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--vt-heading-font': props.headingFont,
  '--vt-body-font': props.bodyFont,
  '--vt-card-bg': props.cardBg,
  '--vt-card-shadow': props.cardShadow,
  '--vt-card-radius': props.cardRadius,
}));
</script>

<style scoped>
.vertical-timeline {
  width: 100%;
}

.timeline-title {
  font-family: var(--vt-heading-font);
  font-size: 40px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin: 0 0 48px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.time-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 100px;
  font-family: var(--vt-body-font);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 16px;
}

.event-card {
  flex: 1;
  background: var(--vt-card-bg);
  border-radius: var(--vt-card-radius);
  box-shadow: var(--vt-card-shadow);
  padding: 24px;
}

.event-title {
  font-family: var(--vt-heading-font);
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.event-subtitle {
  font-family: var(--vt-body-font);
  font-size: 15px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .timeline-title {
    font-size: 32px;
  }

  .timeline-item {
    flex-direction: column;
    gap: 8px;
  }

  .time-pill {
    margin-top: 0;
  }

  .event-card {
    padding: 20px;
  }
}
</style>

<template>
  <div class="schedule-list" :style="cssVars">
    <div class="schedule-header">
      <h2 class="schedule-title">{{ title }}</h2>
      <div class="schedule-divider"></div>
    </div>

    <div class="schedule-items">
      <div
        v-for="(item, idx) in events"
        :key="idx"
        class="schedule-item"
        :class="{ 'schedule-item--last': idx === events.length - 1 }"
      >
        <div class="item-time">
          <p class="time-value">{{ item.timeValue }}</p>
          <p class="time-period">{{ item.timePeriod }}</p>
        </div>
        <div class="item-content">
          <h3 class="item-title">{{ item.title }}</h3>
          <p v-if="item.description" class="item-description">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Schedule' },
  events: { type: Array, required: true },
  dividerColor: { type: String, default: '#fda4af' },
  borderColor: { type: String, default: '#e5e7eb' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--sl-heading-font': props.headingFont,
  '--sl-body-font': props.bodyFont,
  '--sl-divider': props.dividerColor,
  '--sl-border': props.borderColor,
}));
</script>

<style scoped>
.schedule-header {
  text-align: center;
  margin-bottom: 64px;
}

.schedule-title {
  font-family: var(--sl-heading-font);
  font-size: 40px;
  font-weight: 400;
  color: #1f2937;
  margin: 0 0 16px;
}

.schedule-divider {
  width: 48px;
  height: 1px;
  background: var(--sl-divider);
  margin: 0 auto;
}

.schedule-items {
  max-width: 640px;
  margin: 0 auto;
}

.schedule-item {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--sl-border);
}

.schedule-item--last {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.item-time {
  text-align: right;
  min-width: 80px;
  flex-shrink: 0;
}

.time-value {
  font-family: var(--sl-heading-font);
  font-size: 28px;
  font-weight: 400;
  color: #1f2937;
  margin: 0;
  line-height: 1.2;
}

.time-period {
  font-family: var(--sl-body-font);
  font-size: 11px;
  text-transform: uppercase;
  color: #6b7280;
  margin: 0;
}

.item-content {
  flex: 1;
  padding-top: 4px;
}

.item-title {
  font-family: var(--sl-heading-font);
  font-size: 20px;
  font-weight: 500;
  color: #1f2937;
  margin: 0 0 4px;
}

.item-description {
  font-family: var(--sl-body-font);
  font-size: 14px;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
}

@media (min-width: 1024px) {
  .schedule-title {
    font-size: 48px;
  }
}
</style>

<template>
  <div class="schedule-table" :style="cssVars">
    <div class="schedule-header">
      <h2 class="schedule-title">{{ title }}</h2>
      <div class="schedule-divider"></div>
    </div>
    <div class="table-wrap">
      <table class="event-table">
        <tbody>
          <tr v-for="(event, idx) in events" :key="idx" class="event-row">
            <td class="time-cell">{{ event.time || (event.timeValue + ' ' + event.timePeriod).trim() }}</td>
            <td class="title-cell">{{ event.title }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Schedule' },
  events: { type: Array, required: true },
  dividerColor: { type: String, default: '#c9a96e' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
});

const cssVars = computed(() => ({
  '--st-heading-font': props.headingFont,
  '--st-body-font': props.bodyFont,
  '--st-divider': props.dividerColor,
}));
</script>

<style scoped>
.schedule-header {
  text-align: center;
  margin-bottom: 48px;
}

.schedule-title {
  font-family: var(--font-heading, var(--st-heading-font));
  font-size: 40px;
  font-weight: 400;
  color: var(--theme-text, #1f2937);
  margin: 0 0 16px;
}

.schedule-divider {
  width: 48px;
  height: 1px;
  background: var(--st-divider);
  margin: 0 auto;
}

.table-wrap {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 16px;
  overflow: hidden;
  background: var(--card-bg, #ffffff);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.event-table {
  width: 100%;
  border-collapse: collapse;
}

.event-row {
  transition: background 0.2s ease;
}

.event-row:hover {
  background: var(--theme-accent, var(--st-divider));
  background: color-mix(in srgb, var(--theme-accent, var(--st-divider)) 8%, transparent);
}

.event-row:not(:last-child) {
  border-bottom: 1px solid var(--theme-text-muted, #e5e7eb);
  border-bottom-color: color-mix(in srgb, var(--theme-text-muted, #e5e7eb) 25%, transparent);
}

.time-cell,
.title-cell {
  padding: 20px 24px;
  vertical-align: middle;
}

.time-cell {
  font-family: var(--font-heading, var(--st-heading-font));
  font-size: 15px;
  font-weight: 500;
  color: var(--theme-text-muted, #6b7280);
  white-space: nowrap;
  width: 1%;
  letter-spacing: 0.05em;
}

.title-cell {
  font-family: var(--font-body, var(--st-body-font));
  font-size: 16px;
  font-weight: 500;
  color: var(--theme-text, #1f2937);
}

@container (min-width: 768px) {
  .schedule-title {
    font-size: 48px;
  }

  .time-cell,
  .title-cell {
    padding: 24px 32px;
  }

  .time-cell {
    font-size: 16px;
  }

  .title-cell {
    font-size: 17px;
  }
}
</style>

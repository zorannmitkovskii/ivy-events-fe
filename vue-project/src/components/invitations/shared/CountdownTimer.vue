<template>
  <div class="countdown-timer" :style="wrapperVars">
    <p v-if="label" class="countdown-label">{{ label }}</p>
    <div class="countdown-units">
      <template v-for="(unit, idx) in displayUnits" :key="unit.label">
        <span v-if="idx > 0 && separator" class="countdown-sep">{{ separator }}</span>
        <div class="countdown-unit">
          <span class="countdown-value" :style="{ color: getColor(idx) }">{{ unit.value }}</span>
          <span class="countdown-unit-label">{{ unit.label }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  targetDate: { type: String, required: true },
  label: { type: String, default: '' },
  showSeconds: { type: Boolean, default: false },
  colors: { type: Array, default: () => ['#333'] },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
  separator: { type: String, default: '' },
  separatorColor: { type: String, default: '#ccc' },
  labelColor: { type: String, default: '#777' },
  unitLabelColor: { type: String, default: '#999' },
  daysLabel: { type: String, default: 'Days' },
  hoursLabel: { type: String, default: 'Hours' },
  minutesLabel: { type: String, default: 'Minutes' },
  secondsLabel: { type: String, default: 'Seconds' },
});

const countdown = reactive({ days: 0, hours: 0, mins: 0, secs: 0 });
let timer = null;

function update() {
  const diff = Math.max(0, new Date(props.targetDate) - new Date());
  countdown.days = Math.floor(diff / 86400000);
  countdown.hours = Math.floor((diff / 3600000) % 24);
  countdown.mins = Math.floor((diff / 60000) % 60);
  countdown.secs = Math.floor((diff / 1000) % 60);
}

const displayUnits = computed(() => {
  const units = [
    { value: countdown.days, label: props.daysLabel },
    { value: countdown.hours, label: props.hoursLabel },
    { value: countdown.mins, label: props.minutesLabel },
  ];
  if (props.showSeconds) {
    units.push({ value: countdown.secs, label: props.secondsLabel });
  }
  return units;
});

function getColor(idx) {
  return props.colors[idx % props.colors.length];
}

const wrapperVars = computed(() => ({
  '--ct-heading-font': props.headingFont,
  '--ct-body-font': props.bodyFont,
  '--ct-sep-color': props.separatorColor,
  '--ct-label-color': props.labelColor,
  '--ct-unit-label-color': props.unitLabelColor,
}));

onMounted(() => {
  update();
  timer = setInterval(update, props.showSeconds ? 1000 : 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.countdown-timer {
  text-align: center;
}

.countdown-label {
  font-family: var(--ct-body-font);
  font-size: 18px;
  color: var(--ct-label-color);
  margin: 0 0 24px;
}

.countdown-units {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 24px;
  flex-wrap: wrap;
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
}

.countdown-value {
  font-family: var(--ct-heading-font);
  font-size: 48px;
  font-weight: 500;
  line-height: 1;
}

.countdown-unit-label {
  font-family: var(--ct-body-font);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--ct-unit-label-color);
  margin-top: 8px;
}

.countdown-sep {
  font-family: var(--ct-heading-font);
  font-size: 36px;
  font-weight: 300;
  color: var(--ct-sep-color);
  padding-top: 4px;
}

@media (max-width: 480px) {
  .countdown-value {
    font-size: 36px;
  }

  .countdown-sep {
    font-size: 28px;
  }

  .countdown-units {
    gap: 16px;
  }
}
</style>

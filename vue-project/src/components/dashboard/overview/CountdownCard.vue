<template>
  <div class="card card-pad-lg">
    <div class="card-head">
      <div class="card-label">{{ t("overview.daysUntilEvent") }}</div>
      <div class="card-icon">⏳</div>
    </div>

    <div class="countdown">
      <div class="cd-unit">
        <div class="cd-value">{{ pad(countdown.days) }}</div>
        <div class="kpi-sub">{{ t("overview.days") }}</div>
      </div>
      <div class="cd-sep">:</div>
      <div class="cd-unit">
        <div class="cd-value">{{ pad(countdown.hours) }}</div>
        <div class="kpi-sub">{{ t("overview.hours") }}</div>
      </div>
      <div class="cd-sep">:</div>
      <div class="cd-unit">
        <div class="cd-value">{{ pad(countdown.mins) }}</div>
        <div class="kpi-sub">{{ t("overview.minutes") }}</div>
      </div>
      <div class="cd-sep">:</div>
      <div class="cd-unit">
        <div class="cd-value">{{ pad(countdown.secs) }}</div>
        <div class="kpi-sub">{{ t("overview.seconds") }}</div>
      </div>
    </div>

    <div class="cd-date kpi-sub">{{ formattedDate }}</div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const props = defineProps({
  targetDate: { type: String, default: "" }
});

const countdown = reactive({ days: 0, hours: 0, mins: 0, secs: 0 });
let timer = null;

function calc() {
  if (!props.targetDate) return;
  const diff = new Date(props.targetDate) - new Date();
  if (diff <= 0) {
    countdown.days = 0;
    countdown.hours = 0;
    countdown.mins = 0;
    countdown.secs = 0;
    return;
  }
  countdown.days = Math.floor(diff / (1000 * 60 * 60 * 24));
  countdown.hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  countdown.mins = Math.floor((diff / (1000 * 60)) % 60);
  countdown.secs = Math.floor((diff / 1000) % 60);
}

function pad(n) {
  return String(n).padStart(2, "0");
}

const formattedDate = computed(() => {
  if (!props.targetDate) return "";
  try {
    return new Date(props.targetDate).toLocaleDateString(
      locale.value === "mk" ? "mk-MK" : "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
  } catch {
    return props.targetDate;
  }
});

watch(() => props.targetDate, () => calc());

onMounted(() => {
  calc();
  timer = setInterval(calc, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.countdown {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 12px;
  margin-top: 24px;
}
.cd-unit {
  text-align: center;
}
.cd-value {
  font-size: 36px;
  font-weight: 950;
  color: var(--neutral-900);
  line-height: 1;
}
.cd-sep {
  font-size: 28px;
  font-weight: 300;
  color: var(--neutral-500);
  padding-top: 2px;
}
.cd-date {
  text-align: center;
  margin-top: 18px;
}
</style>

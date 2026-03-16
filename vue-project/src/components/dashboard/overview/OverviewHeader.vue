<template>
  <div class="hero-banner">
    <div class="orb2"></div>
    <div class="hero-left">
      <div class="hero-eyebrow">{{ eventType }} · {{ event.location || '' }}</div>
      <div class="hero-title"><em>{{ firstName }}</em> {{ separator }} {{ secondName }}</div>
      <div class="hero-meta">
        <div class="hero-meta-item">{{ event.date }}</div>
        <div class="hero-meta-dot">&middot;</div>
        <div class="hero-meta-item">{{ event.daysLeft }} {{ t("overview.daysToGo") }}</div>
        <div class="hero-meta-dot">&middot;</div>
        <span class="pill-status">{{ event.status }}</span>
      </div>
    </div>
    <div class="hero-right">
      <div class="hero-countdown">
        <div class="hc-unit">
          <span class="hc-num">{{ pad(countdown.days) }}</span>
          <span class="hc-lbl">{{ t("overview.days") }}</span>
        </div>
        <div class="hc-sep">:</div>
        <div class="hc-unit">
          <span class="hc-num">{{ pad(countdown.hours) }}</span>
          <span class="hc-lbl">{{ t("overview.hours") }}</span>
        </div>
        <div class="hc-sep">:</div>
        <div class="hc-unit">
          <span class="hc-num">{{ pad(countdown.mins) }}</span>
          <span class="hc-lbl">{{ t("overview.minutes") }}</span>
        </div>
        <div class="hc-sep">:</div>
        <div class="hc-unit">
          <span class="hc-num">{{ pad(countdown.secs) }}</span>
          <span class="hc-lbl">{{ t("overview.seconds") }}</span>
        </div>
      </div>
      <div class="hero-progress-wrap">
        <div class="hp-label">
          <span>{{ t("overview.readiness") }}</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="hp-bar">
          <div class="hp-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  event: { type: Object, default: () => ({}) },
  progress: { type: Number, default: 0 }
});

const countdown = reactive({ days: 0, hours: 0, mins: 0, secs: 0 });
let timer = null;

const eventType = computed(() => {
  const cat = props.event.category;
  if (cat === "WEDDING") return t("overview.weddingEvent");
  if (cat === "GALLERY") return t("sidebar.gallery");
  return t("overview.event");
});

const eventNameParts = computed(() => {
  const name = props.event.name || "";
  // Try to split "Name1 & Name2" or "Name1 and Name2"
  const parts = name.split(/\s*[&]\s*/);
  if (parts.length >= 2) return { first: parts[0], second: parts[1], sep: "&" };
  return { first: name, second: "", sep: "" };
});

const firstName = computed(() => eventNameParts.value.first);
const secondName = computed(() => eventNameParts.value.second);
const separator = computed(() => eventNameParts.value.sep);

function calc() {
  const raw = props.event.rawDate;
  if (!raw) return;
  const diff = new Date(raw) - new Date();
  if (diff <= 0) {
    countdown.days = 0; countdown.hours = 0; countdown.mins = 0; countdown.secs = 0;
    return;
  }
  countdown.days = Math.floor(diff / 86400000);
  countdown.hours = Math.floor((diff % 86400000) / 3600000);
  countdown.mins = Math.floor((diff % 3600000) / 60000);
  countdown.secs = Math.floor((diff % 60000) / 1000);
}

function pad(n) { return String(n).padStart(2, "0"); }

onMounted(() => { calc(); timer = setInterval(calc, 1000); });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

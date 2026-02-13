<template>
  <div class="card card-pad-lg">
    <div class="card-head">
      <div class="card-label">{{ t("overview.budgetStatus") }}</div>
      <div class="card-icon">{{ symbol }}</div>
    </div>

    <div class="donut-wrap">
      <div class="donut" :style="{ background: donutBg }"></div>
      <div class="donut-center">
        <div class="big">{{ fmt(budget.remaining) }}</div>
        <div class="kpi-sub">{{ t("overview.remaining") }}</div>
      </div>
    </div>

    <div class="legend">
      <div v-for="(item, i) in budget.items" :key="item.name" class="legend-item">
        <span class="swatch" :style="{ background: catColor(i) }"></span>
        <span class="legend-name">{{ item.name }}</span>
        <span class="legend-val">{{ fmt(item.used) }}</span>
      </div>
      <div class="legend-item">
        <span class="swatch" style="background: #BFD2A4"></span>
        <span class="legend-name">{{ t("overview.remaining") }}</span>
        <span class="legend-val">{{ fmt(budget.remaining) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({ budget: Object });

const REMAINING_COLOR = "#BFD2A4";
const COLORS = ["#C8A24D", "#c27c7c", "#5D6A57", "#ED6E69", "#6B8EAE", "#D4A373"];

function catColor(i) {
  return COLORS[i % COLORS.length];
}

const symbol = computed(() => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: props.budget?.currency || "EUR" })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value || "$";
  } catch {
    return "$";
  }
});

const donutBg = computed(() => {
  const total = props.budget?.total || 1;
  const items = props.budget?.items || [];
  let angle = 0;
  const stops = [];
  items.forEach((item, i) => {
    const deg = Math.round((item.used / total) * 360);
    if (deg > 0) {
      stops.push(`${catColor(i)} ${angle}deg ${angle + deg}deg`);
      angle += deg;
    }
  });
  stops.push(`${REMAINING_COLOR} ${angle}deg 360deg`);
  return `conic-gradient(${stops.join(", ")})`;
});

function fmt(value) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: props.budget?.currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  } catch {
    return `${value || 0}`;
  }
}
</script>

<style scoped>
.donut-wrap {
  position: relative;
  height: 180px;
  display: grid;
  place-items: center;
  margin-top: 12px;
}
.donut {
  width: 160px;
  height: 160px;
  border-radius: 999px;
  position: relative;
}
.donut::after {
  content: "";
  position: absolute;
  inset: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 999px;
}
.donut-center {
  position: absolute;
  display: grid;
  place-items: center;
  text-align: center;
}
.big {
  font-size: 20px;
  font-weight: 950;
  color: var(--neutral-900);
}

.legend {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}
.legend-name {
  flex: 1;
  font-weight: 600;
  color: var(--neutral-700);
  text-transform: capitalize;
}
.legend-val {
  font-weight: 800;
  color: var(--neutral-900);
}
</style>

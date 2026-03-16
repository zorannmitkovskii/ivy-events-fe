<template>
  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">{{ t("overview.budgetStatus") }}</div>
        <div class="budget-big">
          {{ fmt(budget.used) }}
          <span class="budget-big-label">{{ t("overview.spent") }}</span>
        </div>
      </div>
      <router-link :to="budgetLink" class="card-action">{{ t("overview.viewDetails") }} &rarr;</router-link>
    </div>

    <!-- Budget breakdown bars -->
    <div class="budget-bars">
      <div v-for="(item, i) in budget.items" :key="item.name" class="budget-bar-row">
        <div class="bb-label">{{ item.name }}</div>
        <div class="bb-track">
          <div class="bb-fill" :style="{ width: barWidth(item), background: catColor(i) }"></div>
        </div>
        <div class="bb-val">{{ fmt(item.used) }}</div>
      </div>

      <div class="budget-bar-row">
        <div class="bb-label">{{ t("overview.remaining") }}</div>
        <div class="bb-track">
          <div class="bb-fill" :style="{ width: remainPct + '%', background: '#b2c9aa' }"></div>
        </div>
        <div class="bb-val">{{ fmt(budget.remaining) }}</div>
      </div>
    </div>

    <!-- Summary -->
    <div class="budget-summary">
      <div class="bs-item">
        <span class="bs-dot" style="background: var(--dash-sage)"></span>
        <span>{{ t("overview.totalBudget") }}: {{ fmt(budget.total) }}</span>
      </div>
      <div class="bs-item">
        <span class="bs-dot" style="background: var(--dash-gold)"></span>
        <span>{{ t("overview.spent") }}: {{ fmt(budget.used) }}</span>
      </div>
      <div class="bs-item">
        <span class="bs-dot" style="background: var(--dash-sage-light)"></span>
        <span>{{ t("overview.remaining") }}: {{ fmt(budget.remaining) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");
const budgetLink = computed(() => `/${lang.value}/dashboard/events/budget`);

const props = defineProps({ budget: Object });

const COLORS = ["#b8954e", "#c4968e", "#5a7a52", "#7a9db8", "#d4a373"];

function catColor(i) { return COLORS[i % COLORS.length]; }

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

function barWidth(item) {
  const total = props.budget?.total || 1;
  return Math.min(Math.round((item.used / total) * 100), 100) + "%";
}

const remainPct = computed(() => {
  const total = props.budget?.total || 1;
  return Math.round((props.budget?.remaining || 0) / total * 100);
});
</script>

<style scoped>
.budget-big {
  font-family: 'Playfair Display', serif;
  font-size: 32px;
  font-weight: 400;
  color: var(--dash-charcoal);
  margin-top: 4px;
}

.budget-big-label {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  color: var(--dash-muted);
  font-weight: 400;
}

.budget-bars {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.budget-bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bb-label {
  font-size: 12px;
  color: var(--dash-ink);
  width: 100px;
  flex-shrink: 0;
  text-transform: capitalize;
}

.bb-track {
  flex: 1;
  height: 6px;
  background: var(--dash-sage-ghost);
  border-radius: 20px;
  overflow: hidden;
}

.bb-fill {
  height: 100%;
  border-radius: 20px;
  transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.bb-val {
  font-size: 12px;
  color: var(--dash-muted);
  width: 60px;
  text-align: right;
  flex-shrink: 0;
  font-weight: 500;
}

.budget-summary {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid var(--dash-cream-border);
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.bs-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--dash-muted);
}

.bs-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}
</style>

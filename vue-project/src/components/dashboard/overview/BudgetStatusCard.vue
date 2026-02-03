<template>
  <div class="card card-pad-lg">
    <div class="card-head">
      <div class="card-label">{{ t("overview.budgetStatus") }}</div>
      <div class="card-icon">$</div>
    </div>

    <div class="kpi">
      ${{ budget.used.toLocaleString() }}
      <span class="kpi-sub"> {{ t("overview.of") }} ${{ budget.total.toLocaleString() }} {{ t("overview.budget") }}</span>
    </div>

    <div class="lines">
      <div v-for="b in budget.items" :key="b.name" class="line">
        <div class="row">
          <div class="name">{{ b.name }}</div>
          <div class="kpi-sub">${{ b.used.toLocaleString() }} / ${{ b.limit.toLocaleString() }}</div>
        </div>
        <div class="track">
          <div class="fill" :style="{ width: pct(b.used, b.limit) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
defineProps({ budget: Object });

function pct(a, b) {
  if (!b) return 0;
  return Math.min(100, Math.round((a / b) * 100));
}
</script>

<style scoped>
.lines { margin-top: 14px; display: grid; gap: 12px; }
.line .row { display:flex; justify-content:space-between; gap:10px; }
.name { font-size: 13px; font-weight: 800; color: var(--neutral-900); }
</style>

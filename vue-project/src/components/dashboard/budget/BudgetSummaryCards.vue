<template>
  <section class="cards">
    <BudgetStatCard
      :label="t('budget.totalBudget')"
      :value="money(totalBudget)"
      :pillLeft="t('budget.monthly')"
      :pillRight="t('budget.fixedAndVariable')"
      variant="light"
    />

    <BudgetStatCard
      :label="t('budget.totalSpent')"
      :value="money(totalSpent)"
      :hint="t('budget.ofBudgetUsed', { percent: spentPercent })"
      :progress="spentPercent"
      variant="light"
    />

    <BudgetStatCard
      :label="t('budget.remaining')"
      :value="money(remaining)"
      :hint="t('budget.safeToSpend')"
      variant="dark"
    />
  </section>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import BudgetStatCard from "./BudgetStatCard.vue";

const { t } = useI18n();

const props = defineProps({
  currency: { type: String, default: "EUR" },
  totalBudget: { type: Number, required: true },
  totalSpent: { type: Number, required: true },
  remaining: { type: Number, required: true },
  spentPercent: { type: Number, required: true }
});

function money(v){
  try { return new Intl.NumberFormat(undefined,{style:"currency",currency:props.currency}).format(v||0); }
  catch { return `${v||0} ${props.currency}`; }
}
</script>

<style scoped>
.cards{
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap:16px;
  margin-bottom:18px;
}

@media (max-width: 900px){
  .cards{ grid-template-columns: 1fr; }
}
</style>

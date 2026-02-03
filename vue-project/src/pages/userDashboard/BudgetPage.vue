<template>
  <div class="budget-page">
    <BudgetHeader
      :title="t('budget.title')"
      :subtitle="subtitle"
      :exportLabel="t('budget.export')"
      :addExpenseLabel="t('budget.addExpense')"
      @export="onExport"
      @add="onOpenAdd"
    />

    <section class="content">
      <BudgetSummaryCards
        :currency="currency"
        :totalBudget="summary.totalBudget"
        :totalSpent="summary.totalSpent"
        :remaining="summary.remaining"
        :spentPercent="summary.spentPercent"
      />
      <BudgetCategoryList
        :title="t('budget.categories')"
        :viewAllLabel="t('common.viewAll')"
        :currency="currency"
        :categories="categories"
      />
    </section>

    <!-- ✅ classic v-model -->
    <AddExpenseDialog
      v-model:open="addDialogOpen"
      :title="t('budget.addExpense')"
      :cancelLabel="t('common.cancel')"
      :saveLabel="t('common.save')"
      :currency="currency"
      :categories="categories"
      @save="onCreateExpense"
    />

  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";

import BudgetHeader from "@/components/dashboard/budget/BudgetHeader.vue";
import BudgetSummaryCards from "@/components/dashboard/budget/BudgetSummaryCards.vue";
import BudgetCategoryList from "@/components/dashboard/budget/BudgetCategoryList.vue";
import AddExpenseDialog from "@/components/dashboard/budget/AddExpenseDialog.vue";

import { useBudget } from "@/composables/useBudget";
import { exportBudgetToCsv } from "@/utils/budgetExport";

const { t } = useI18n();
const addDialogOpen = ref(false);

const subtitle = computed(() => t("budget.overviewSubtitle", { monthLabel: "October 2023" }));

const { currency, summary, categories, loadBudget, createExpense } = useBudget({
  budgetId: "demo",
  month: "2023-10"
});

onMounted(loadBudget);

function onOpenAdd() {
  console.log("ADD clicked"); // ✅ if you don’t see this, header emit/listener issue
  addDialogOpen.value = true;
}

async function onCreateExpense(payload) {
  console.log("SAVE expense payload", payload); // ✅ verify save fires
  await createExpense(payload);
  addDialogOpen.value = false;
}

function onExport() {
  console.log("EXPORT clicked"); // ✅ verify export fires
  exportBudgetToCsv({
    month: "2023-10",
    currency: currency.value,
    summary: summary.value,
    categories: categories.value
  });
}
</script>

<style scoped>
.budget-page{
  min-height:100%;
}
.content{
  max-width:1150px;
  margin:0 auto;
  padding:18px 24px 32px;
}
</style>

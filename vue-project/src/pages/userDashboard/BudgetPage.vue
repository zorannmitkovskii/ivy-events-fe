<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t('budget.title') }}</h1>
      <p class="dash-page-subtitle">{{ subtitle }}</p>
    </div>

    <BudgetHeader
      :exportLabel="t('budget.export')"
      :addExpenseLabel="t('budget.addExpense')"
      :createBudgetLabel="t('budget.createBudget')"
      :hasBudget="hasBudget"
      @export="onExport"
      @add="onOpenAdd"
      @create-budget="budgetDialogOpen = true"
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

    <AddBudgetDialog
      :open="budgetDialogOpen"
      @close="budgetDialogOpen = false"
      @save="onCreateBudget"
    />

    <AddExpenseDialog
      v-model:open="addDialogOpen"
      :title="t('budget.addExpense')"
      :cancelLabel="t('common.cancel')"
      :saveLabel="t('common.save')"
      :currency="currency"
      :categories="allCategories"
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
import AddBudgetDialog from "@/components/dashboard/budget/AddBudgetDialog.vue";

import { useBudget } from "@/composables/useBudget";
import { exportBudgetToCsv } from "@/utils/budgetExport";

const { t } = useI18n();
const addDialogOpen = ref(false);
const budgetDialogOpen = ref(false);

const subtitle = computed(() => t("budget.overviewSubtitle", { monthLabel: "October 2023" }));

const { currency, summary, categories, allCategories, hasBudget, loadBudget, createBudget, createExpense } = useBudget();

onMounted(loadBudget);

function onOpenAdd() {
  console.log("ADD clicked");
  addDialogOpen.value = true;
}

async function onCreateBudget(payload) {
  await createBudget(payload);
  budgetDialogOpen.value = false;
}

async function onCreateExpense(payload) {
  await createExpense(payload);
  addDialogOpen.value = false;
}

function onExport() {
  console.log("EXPORT clicked");
  exportBudgetToCsv({
    month: "2023-10",
    currency: currency.value,
    summary: summary.value,
    categories: categories.value
  });
}
</script>

<style scoped>
.content {
  display: grid;
  gap: 24px;
}
</style>

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

    <section v-if="hasBudget" class="content">
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

    <div v-else class="empty-card">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      <h3 class="empty-title">{{ t('budget.emptyTitle') }}</h3>
      <p class="empty-sub">{{ t('budget.emptyMessage') }}</p>
      <ButtonMain variant="main" @click="budgetDialogOpen = true">
        {{ t('budget.createBudget') }}
      </ButtonMain>
    </div>

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
import ButtonMain from "@/components/generic/ButtonMain.vue";

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

.empty-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 48px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  gap: 8px;
}

.empty-icon {
  color: var(--neutral-400);
  margin-bottom: 8px;
}

.empty-title {
  font-weight: 700;
  font-size: 16px;
  color: var(--neutral-900);
  margin: 0;
}

.empty-sub {
  font-size: 13px;
  color: var(--neutral-500);
  margin: 0 0 8px;
}
</style>

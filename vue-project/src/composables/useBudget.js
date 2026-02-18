import { ref, computed } from "vue";
import { budgetsService } from "@/services/budgets.service";
import { onboardingStore } from "@/store/onboarding.store";
import { checkDraftLimit } from "@/utils/draftLimits";
import { BUDGET_CATEGORIES } from "@/enums/BudgetCategory";

export function useBudget() {
  const currency = ref("MKD");
  const budgetId = ref(null);

  const summary = ref({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    spentPercent: 0
  });

  const categories = ref([]);

  async function loadBudget() {
    const eventId = onboardingStore.eventId;
    if (!eventId) return;

    try {
      const data = await budgetsService.list(eventId);
      // /budgets/summary returns a single object (or an array for legacy compat)
      const budget = Array.isArray(data) ? data[0] : data;
      if (!budget) return;
      budgetId.value = budget.id;
      currency.value = budget.currency || "EUR";

      const totalBudget = Number(budget.amount || 0);
      const remaining = Number(budget.remainAmount || 0);
      const totalSpent = totalBudget - remaining;

      summary.value.totalBudget = totalBudget;
      summary.value.totalSpent = totalSpent;
      summary.value.remaining = remaining;
      summary.value.spentPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

      categories.value = (budget.expensesByCategory || []).map(cat => {
        const spent = Number(cat.totalAmount || 0);
        return {
          id: cat.category,
          name: formatCategory(cat.category),
          spent,
          expenses: cat.expenses || [],
        };
      });
    } catch (e) {
      console.warn("[useBudget] failed to load", e);
    }
  }

  async function createExpense(payload) {
    const totalExpenses = categories.value.reduce((sum, c) => sum + (c.expenses?.length || 0), 0);
    const limitHit = checkDraftLimit("budgetItems", totalExpenses);
    if (limitHit) {
      throw new Error(`Draft limit: maximum ${limitHit.limit} budget items. Upgrade your plan to add more.`);
    }
    await budgetsService.createExpense({
      budgetId: budgetId.value,
      category: payload.category,
      name: payload.merchant,
      description: payload.note || null,
      amount: payload.amount,
      dueDate: payload.date || null,
      paymentStatus: null,
      paymentMethod: null,
      receiptUrl: null,
    });

    await loadBudget();
  }

  const hasBudget = computed(() => !!budgetId.value);

  async function createBudget(payload) {
    const eventId = onboardingStore.eventId;
    const data = await budgetsService.create({
      name: payload.name,
      description: payload.description || null,
      amount: payload.amount,
      currency: payload.currency || "MKD",
      eventId,
    });
    budgetId.value = data?.id || data?.budgetId || null;
    await loadBudget();
  }

  const allCategories = BUDGET_CATEGORIES.map(c => ({ id: c, name: formatCategory(c) }));

  return { currency, summary, categories, allCategories, budgetId, hasBudget, loadBudget, createBudget, createExpense };
}

function formatCategory(raw) {
  if (!raw) return "";
  return raw.replace(/_/g, " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
}

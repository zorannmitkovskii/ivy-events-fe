import { ref } from "vue";
import { budgetDemo } from "@/demo/budget.demo.js";

export function useBudget({ budgetId, month }) {
  const currency = ref("USD");

  const summary = ref({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    spentPercent: 0
  });

  const categories = ref([]);

  async function loadBudget() {
    // If you have BE, replace this with real calls.
    // Keeping demo as default for now:
    applyData(budgetDemo);
  }

  async function createExpense(payload) {
    // Demo behavior: add amount to the selected category + update totals.
    const amount = Number(payload.amount || 0);
    if (!(amount > 0)) return;

    const c = categories.value.find(x => x.id === payload.categoryId);
    if (c) {
      c.spent = Number(c.spent || 0) + amount;
      c.percent = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0;
      c.leftLabel = leftLabel(c.budget, c.spent, currency.value);
    }

    // update summary
    summary.value.totalSpent = Number(summary.value.totalSpent || 0) + amount;
    summary.value.remaining = Math.max(0, Number(summary.value.totalBudget || 0) - summary.value.totalSpent);
    summary.value.spentPercent = summary.value.totalBudget > 0
      ? Math.round((summary.value.totalSpent / summary.value.totalBudget) * 100)
      : 0;
  }

  function applyData(data) {
    currency.value = data.currency || "USD";

    const totalBudget = Number(data.summary?.totalBudget || 0);
    const totalSpent = Number(data.summary?.totalSpent || 0);

    summary.value.totalBudget = totalBudget;
    summary.value.totalSpent = totalSpent;
    summary.value.remaining = Math.max(0, totalBudget - totalSpent);
    summary.value.spentPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    categories.value = (data.categories || []).map(c => {
      const spent = Number(c.spent || 0);
      const budget = Number(c.budget || 0);
      const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
      return {
        ...c,
        spent,
        budget,
        percent,
        leftLabel: leftLabel(budget, spent, currency.value)
      };
    });
  }

  return { currency, summary, categories, loadBudget, createExpense };
}

function leftLabel(budget, spent, currency) {
  const left = Math.max(0, Number(budget || 0) - Number(spent || 0));
  if (!(left > 0)) return "";
  try {
    return `${new Intl.NumberFormat(undefined, { style: "currency", currency }).format(left)} left`;
  } catch {
    return `${left} ${currency} left`;
  }
}

<template>
  <DashboardTable>
    <template #head>
      <th>{{ title }}</th>
      <th>{{ t('budget.totalSpent') }}</th>
      <th>{{ t('budget.totalBudget') }}</th>
      <th>{{ t('budget.progress') }}</th>
      <th>{{ t('budget.remaining') }}</th>
    </template>

    <template #body>
      <BudgetCategoryRow
        v-for="c in categories"
        :key="c.id"
        :currency="currency"
        v-bind="c"
      />

      <tr v-if="categories.length === 0">
        <td colspan="5" class="empty-cell">No categories yet.</td>
      </tr>
    </template>

    <template v-if="categories.length > 0" #footer>
      <button class="view-all-link" type="button" @click="$emit('viewAll')">
        {{ viewAllLabel }}
      </button>
    </template>
  </DashboardTable>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import DashboardTable from "@/components/dashboard/DashboardTable.vue";
import BudgetCategoryRow from "./BudgetCategoryRow.vue";

const { t } = useI18n();

defineProps({
  title: { type: String, required: true },
  viewAllLabel: { type: String, required: true },
  currency: { type: String, default: "EUR" },
  categories: { type: Array, default: () => [] }
});

defineEmits(["viewAll"]);
</script>

<style scoped>
.empty-cell {
  text-align: center;
  padding: 32px 24px !important;
  color: var(--dash-muted);
  font-size: 13px;
}

.view-all-link {
  border: 0;
  background: transparent;
  color: var(--dash-sage);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s;
  padding: 0;
}

.view-all-link:hover {
  color: var(--dash-sage-dark);
}
</style>

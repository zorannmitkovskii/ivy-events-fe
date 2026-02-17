<template>
  <DashboardToolbar>
    <template v-if="hasBudget" #actions>
      <ButtonMain variant="main" @click="emit('add')">
        + {{ addExpenseLabel }}
      </ButtonMain>

      <ButtonMain variant="outline" @click="emit('export')">
        {{ exportLabel }}
      </ButtonMain>
    </template>
  </DashboardToolbar>
</template>

<script setup>
import ButtonMain from "@/components/generic/ButtonMain.vue";
import DashboardToolbar from "@/components/dashboard/DashboardToolbar.vue";

defineProps({
  exportLabel: String,
  addExpenseLabel: String,
  createBudgetLabel: String,
  hasBudget: { type: Boolean, default: false }
});

const emit = defineEmits(["add", "export", "createBudget"]);
</script>

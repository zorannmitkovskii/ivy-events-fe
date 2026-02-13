<template>
  <DashboardToolbar>
    <template #actions>
      <ButtonMain v-if="!hasBudget" variant="main" @click="emit('createBudget')">
        + {{ createBudgetLabel }}
      </ButtonMain>

      <template v-else>
        <ButtonMain variant="ghost" @click="emit('export')">
          {{ exportLabel }}
        </ButtonMain>

        <ButtonMain variant="gold" @click="emit('add')">
          + {{ addExpenseLabel }}
        </ButtonMain>
      </template>
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

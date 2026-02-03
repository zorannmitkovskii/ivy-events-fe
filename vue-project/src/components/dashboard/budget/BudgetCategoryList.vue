<template>
  <section class="list">
    <div class="head">
      <h2 class="title">{{ title }}</h2>
      <button class="link" type="button" @click="$emit('viewAll')">
        {{ viewAllLabel }}
      </button>
    </div>

    <div class="rows">
      <BudgetCategoryRow
        v-for="c in categories"
        :key="c.id"
        :currency="currency"
        v-bind="c"
       name="2"/>
    </div>
  </section>
</template>

<script setup>

import BudgetCategoryRow from "@/components/dashboard/budget/BudgetCategoryRow.vue";

defineProps({
  title: { type: String, required: true },
  viewAllLabel: { type: String, required: true },
  currency: { type: String, default: "USD" },
  categories: { type: Array, default: () => [] }
});

defineEmits(["viewAll"]);
</script>

<style scoped>
.list{
  background:#fff;
  border: 1px solid var(--brand-dark);
  border-radius:18px;
  overflow:hidden;
  box-shadow: 0 6px 16px #00000012;
}

.head{
  padding:18px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  border-bottom: 1px solid var(--brand-dark);
}

.title{
  margin:0;
  font-size:16px;
  font-weight:900;
  color: var(--brand-main);
}

.link{
  border:0;
  background:transparent;
  color: var(--brand-gold);
  font-weight:900;
  cursor:pointer;
}

.rows{ display:grid; }
</style>

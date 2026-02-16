<template>
  <BaseModal :open="open" :title="title" @close="close">
    <form class="form" @submit.prevent="submit">
      <div class="two">
        <div class="field">
          <label>{{ t("budget.expense.date") }} *</label>
          <input class="input" type="date" v-model="draft.date" required />
        </div>

        <div class="field">
          <label>{{ t("budget.expense.category") }} *</label>
          <select class="select" v-model="draft.category" required>
            <option value="" disabled>{{ t("budget.expense.categoryPh") }}</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>{{ t("budget.expense.merchant") }} *</label>
        <input
          class="input"
          v-model="draft.merchant"
          :placeholder="t('budget.expense.merchantPh')"
          required
        />
      </div>

      <div class="two">
        <div class="field">
          <label>{{ t("budget.expense.amount") }} ({{ currency }}) *</label>
          <input
            class="input"
            type="number"
            v-model.number="draft.amount"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>

        <div class="field">
          <label>{{ t("budget.expense.note") }}</label>
          <input
            class="input"
            v-model="draft.note"
            :placeholder="t('budget.expense.notePh')"
          />
        </div>
      </div>

      <div v-if="error" class="err">{{ error }}</div>
    </form>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="close">
        {{ cancelLabel }}
      </ButtonMain>
      <ButtonMain variant="main" type="button" @click="submit">
        {{ saveLabel }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t } = useI18n();

const props = defineProps({
  open: Boolean,
  title: String,
  cancelLabel: String,
  saveLabel: String,
  currency: { type: String, default: "EUR" },
  categories: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:open", "save"]);

const draft = reactive({
  date: "",
  category: "",
  merchant: "",
  amount: 0,
  note: ""
});

const error = ref("");

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    draft.date = new Date().toISOString().slice(0, 10);
    draft.category = "";
    draft.merchant = "";
    draft.amount = 0;
    draft.note = "";
    error.value = "";
  }
);

function close() {
  emit("update:open", false);
}

function submit() {
  error.value = "";

  if (!draft.merchant.trim()) {
    error.value = t("budget.expense.merchantRequired");
    return;
  }
  if (!(draft.amount > 0)) {
    error.value = t("budget.expense.amountRequired");
    return;
  }

  emit("save", {
    date: draft.date,
    category: draft.category || null,
    merchant: draft.merchant.trim(),
    amount: draft.amount,
    note: draft.note.trim() || null
  });
  emit("update:open", false);
}
</script>

<style scoped>
.form { display: grid; gap: 16px; }

.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-main);
  display: block;
  margin-bottom: 6px;
}

.input, .select {
  width: 100%;
  border: 2px solid var(--neutral-300);
  background: var(--bg-main);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--brand-main);
  outline: none;
  transition: border-color 0.2s ease;
}
.input:focus, .select:focus {
  border-color: var(--brand-gold);
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .two { grid-template-columns: 1fr; }
}

.err {
  margin-top: 2px;
  font-size: 12px;
  color: var(--error);
  font-weight: 600;
}
</style>

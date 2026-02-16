<template>
  <BaseModal :open="open" :title="t('budget.createBudget')" @close="close">
    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label>{{ t("budget.budgetDialog.name") }} *</label>
        <input
          class="input"
          v-model="draft.name"
          :placeholder="t('budget.budgetDialog.namePh')"
          required
        />
      </div>

      <div class="field">
        <label>{{ t("budget.budgetDialog.description") }}</label>
        <input
          class="input"
          v-model="draft.description"
          :placeholder="t('budget.budgetDialog.descriptionPh')"
        />
      </div>

      <div class="field">
        <label>{{ t("budget.budgetDialog.amount") }} *</label>
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

      <div v-if="error" class="err">{{ error }}</div>
    </form>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="close">
        {{ t("common.cancel") }}
      </ButtonMain>
      <ButtonMain variant="main" type="button" :loading="saving" @click="submit">
        {{ t("common.save") }}
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
});

const emit = defineEmits(["close", "save"]);

const draft = reactive({ name: "", description: "", amount: 0 });
const error = ref("");
const saving = ref(false);

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    draft.name = "";
    draft.description = "";
    draft.amount = 0;
    error.value = "";
  }
);

function close() {
  emit("close");
}

function submit() {
  error.value = "";

  if (!draft.name.trim()) {
    error.value = t("budget.budgetDialog.nameRequired");
    return;
  }
  if (!(draft.amount > 0)) {
    error.value = t("budget.budgetDialog.amountRequired");
    return;
  }

  emit("save", {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    amount: draft.amount,
  });
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

.input {
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
.input:focus {
  border-color: var(--brand-gold);
}

.err {
  margin-top: 2px;
  font-size: 12px;
  color: var(--error);
  font-weight: 600;
}
</style>

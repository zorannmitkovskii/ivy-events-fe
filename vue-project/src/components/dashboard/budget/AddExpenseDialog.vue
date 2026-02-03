<template>
  <BaseModal :open="open" :title="title" @close="close">
    <form class="form" @submit.prevent="submit">
      <input type="date" v-model="draft.date" required />
      <input type="text" v-model="draft.merchant" required />
      <input type="number" v-model.number="draft.amount" min="0" step="0.01" required />
    </form>

    <template #footer>
      <button type="button" @click="close">Cancel</button>
      <button type="button" @click="submit">Save</button>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";

const props = defineProps({
  open: Boolean,
  title: String
});

const emit = defineEmits(["update:open", "save"]);

const draft = reactive({
  date: "",
  merchant: "",
  amount: 0
});

const error = ref("");

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    draft.date = new Date().toISOString().slice(0, 10);
    draft.merchant = "";
    draft.amount = 0;
  }
);

function close() {
  emit("update:open", false);
}

function submit() {
  if (!draft.merchant || !(draft.amount > 0)) return;

  emit("save", { ...draft });
  emit("update:open", false); // ✅ IMPORTANT
}
</script>

<style scoped>
.form{
  display: grid;
  gap: 12px;
}

.field{
  display: grid;
  gap: 6px;
}

.label{
  font-size: 12px;
  font-weight: 900;
  color: var(--brand-dark);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.input{
  border: 1px solid var(--brand-dark);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 800;
  background: #ffffff;
  color: var(--brand-main);
}

.input:focus{
  outline: 2px solid var(--brand-gold);
  outline-offset: 2px;
}

.textarea{
  resize: vertical;
}

.error{
  border: 1px solid var(--brand-gold);
  background: var(--brand-light);
  color: var(--brand-main);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 900;
}

/* footer buttons */
.btn{
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 900;
  cursor: pointer;
  border: 1px solid var(--brand-dark);
  font-size: 13px;
}

.btn.ghost{
  background: #ffffff;
  color: var(--brand-main);
}

.btn.primary{
  background: var(--brand-gold);
  border-color: var(--brand-gold);
  color: #ffffff;
  box-shadow: 0 10px 22px #0000001A; /* if you want ZERO non-vars, tell me and I'll remove shadow */
}
</style>

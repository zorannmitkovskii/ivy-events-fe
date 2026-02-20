<template>
  <BaseModal :open="open" :title="t('tables.addTableDialog.title')" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label>{{ t("tables.addTableDialog.name") }} *</label>
        <input
          class="input"
          v-model="name"
          :placeholder="t('tables.addTableDialog.namePh')"
        />
        <div v-if="errors.name" class="err">{{ errors.name }}</div>
      </div>

      <div class="field">
        <label>{{ t("tables.addTableDialog.maxGuests") }} *</label>
        <input
          class="input"
          v-model.number="maxGuests"
          type="number"
          min="1"
          :placeholder="t('tables.addTableDialog.maxGuestsPh')"
        />
        <div v-if="errors.maxGuests" class="err">{{ errors.maxGuests }}</div>
      </div>
    </form>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t("common.cancel") }}
      </ButtonMain>
      <ButtonMain variant="main" type="button" @click="submit">
        {{ t("common.save") }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  nextNumber: { type: Number, default: 1 }
});

const emit = defineEmits(["close", "submit"]);

const name = ref("");
const maxGuests = ref(8);
const errors = ref({ name: "", maxGuests: "" });

watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = t('tables.defaultTableName', { number: props.nextNumber });
      maxGuests.value = 8;
      errors.value = { name: "", maxGuests: "" };
    }
  }
);

function validate() {
  errors.value.name = name.value.trim() ? "" : t("tables.addTableDialog.nameRequired");
  errors.value.maxGuests = maxGuests.value > 0 ? "" : t("tables.addTableDialog.maxGuestsRequired");
  return !errors.value.name && !errors.value.maxGuests;
}

function submit() {
  if (!validate()) return;

  emit("submit", {
    name: name.value.trim(),
    capacity: maxGuests.value
  });
}
</script>

<style scoped>
.form {
  display: grid;
  gap: 16px;
}

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
  margin-top: 6px;
  font-size: 12px;
  color: var(--error);
  font-weight: 600;
}
</style>

<template>
  <BaseModal :open="open" :title="t('tables.addGuest')" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label>{{ t("tables.form.name") }} *</label>
        <input
          class="input"
          v-model="name"
          :placeholder="t('tables.form.namePh')"
        />
        <div v-if="errors.name" class="err">{{ errors.name }}</div>
      </div>

      <div class="two">
        <div class="field">
          <label>{{ t("tables.form.phone") }}</label>
          <input
            class="input"
            v-model="phone"
            :placeholder="t('tables.form.phonePh')"
          />
        </div>

        <div class="field">
          <label>{{ t("tables.form.email") }}</label>
          <input
            class="input"
            v-model="email"
            :placeholder="t('tables.form.emailPh')"
          />
        </div>
      </div>

      <div class="field">
        <label>{{ t("tables.form.status") }} *</label>
        <select class="select" v-model="status">
          <option value="confirmed">{{ t("tables.confirmed") }}</option>
          <option value="pending">{{ t("tables.pending") }}</option>
        </select>
        <div v-if="errors.status" class="err">{{ errors.status }}</div>
      </div>
    </form>

    <!-- ✅ IMPORTANT: footer slot must be here (direct child of BaseModal) -->
    <template #footer>
      <BaseButton variant="outline" type="button" @click="emit('close')">
        {{ t("common.cancel") }}
      </BaseButton>

      <BaseButton variant="primary" type="button" @click="submit">
        {{ t("common.save") }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false }
});

const emit = defineEmits(["close", "submit"]);

const name = ref("");
const phone = ref("");
const email = ref("");
const status = ref("confirmed");

const errors = reactive({ name: "", status: "" });

watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = "";
      phone.value = "";
      email.value = "";
      status.value = "confirmed";
      errors.name = "";
      errors.status = "";
    }
  }
);

function validate() {
  errors.name = name.value.trim() ? "" : t("tables.errors.nameRequired");
  errors.status = status.value ? "" : t("tables.errors.statusRequired");
  return !errors.name && !errors.status;
}

function submit() {
  if (!validate()) return;

  emit("submit", {
    name: name.value.trim(),
    phone: phone.value.trim() || null,
    email: email.value.trim() || null,
    status: status.value
  });
}
</script>

<style scoped>
.form { display: grid; gap: 12px; }

.field label {
  font-size: 12px;
  font-weight: 900;
  color: var(--neutral-700);
  display: block;
  margin-bottom: 6px;
}

.input, .select {
  width: 100%;
  border: 1px solid rgba(0,0,0,0.10);
  background: rgba(255,255,255,0.90);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 600px) {
  .two { grid-template-columns: 1fr; }
}

.err {
  margin-top: 6px;
  font-size: 12px;
  color: #b42318;
  font-weight: 800;
}
</style>

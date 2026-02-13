<template>
  <BaseModal :open="open" :title="isEdit ? t('guests.editGuest') : t('tables.addGuest')" @close="emit('close')">
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

      <div class="two">
        <div class="field">
          <label>{{ t("guests.dietary") }}</label>
          <select class="select" v-model="dietaryValue">
            <option value="">{{ t("guests.noDietaryRestrictions") }}</option>
            <option value="VEGETARIAN">{{ t("guests.dietaryOptions.vegetarian") }}</option>
            <option value="VEGAN">{{ t("guests.dietaryOptions.vegan") }}</option>
            <option value="GLUTEN_FREE">{{ t("guests.dietaryOptions.glutenFree") }}</option>
            <option value="FISH">{{ t("guests.dietaryOptions.fish") }}</option>
            <option value="CHICKEN">{{ t("guests.dietaryOptions.chicken") }}</option>
            <option value="OTHER">{{ t("guests.dietaryOptions.other") }}</option>
          </select>
        </div>

        <div class="field">
          <label>{{ t("tables.form.status") }}</label>
          <select class="select" v-model="status">
            <option value="PENDING">{{ t("guests.pending") }}</option>
            <option value="CONFIRMED">{{ t("guests.confirmed") }}</option>
            <option value="DECLINED">{{ t("guests.declined") }}</option>
          </select>
        </div>
      </div>

      <div v-if="dietaryValue === 'OTHER'" class="field">
        <label>{{ t("guests.dietaryDescription") }}</label>
        <input
          class="input"
          v-model="dietaryDescription"
          :placeholder="t('guests.dietaryDescriptionPh')"
        />
      </div>

      <div class="field checkbox-field">
        <label class="checkbox-label">
          <input type="checkbox" v-model="isChild" />
          {{ t("guests.isChild") }}
        </label>
      </div>

      <div class="field">
        <label>{{ t("guests.note") }}</label>
        <textarea
          class="input textarea"
          v-model="note"
          :placeholder="t('guests.notePh')"
          rows="2"
        />
      </div>
    </form>

    <template #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">
        {{ t("common.cancel") }}
      </ButtonMain>

      <ButtonMain variant="main" type="button" @click="submit">
        {{ isEdit ? t("common.save") : t("common.save") }}
      </ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t } = useI18n();

const props = defineProps({
  open: { type: Boolean, default: false },
  guest: { type: Object, default: null }
});

const emit = defineEmits(["close", "submit"]);

const isEdit = computed(() => !!props.guest);

const name = ref("");
const phone = ref("");
const email = ref("");
const status = ref("PENDING");
const dietaryValue = ref("");
const dietaryDescription = ref("");
const isChild = ref(false);
const note = ref("");

const errors = ref({ name: "" });

watch(
  () => props.open,
  (v) => {
    if (v) {
      if (props.guest) {
        // Edit mode: prefill from guest (raw DTO stored on _raw or flat props)
        const raw = props.guest._raw || props.guest;
        name.value = raw.name || "";
        phone.value = raw.phone || "";
        email.value = raw.email || "";
        status.value = (raw.inviteStatus || raw.status || "PENDING").toUpperCase();
        note.value = raw.note || "";
        isChild.value = !!raw.isChild;
        const dp = raw.dietaryPreferences;
        if (dp && dp.value) {
          dietaryValue.value = dp.value;
          dietaryDescription.value = dp.description || "";
        } else {
          dietaryValue.value = "";
          dietaryDescription.value = "";
        }
      } else {
        // Create mode: reset
        name.value = "";
        phone.value = "";
        email.value = "";
        status.value = "PENDING";
        dietaryValue.value = "";
        dietaryDescription.value = "";
        isChild.value = false;
        note.value = "";
      }
      errors.value = { name: "" };
    }
  }
);

function validate() {
  errors.value.name = name.value.trim() ? "" : t("tables.errors.nameRequired");
  return !errors.value.name;
}

function submit() {
  if (!validate()) return;

  const payload = {
    name: name.value.trim(),
    phone: phone.value.trim() || null,
    email: email.value.trim() || null,
    inviteStatus: status.value,
    isChild: isChild.value,
    note: note.value.trim() || null,
    dietaryPreferences: dietaryValue.value
      ? { value: dietaryValue.value, description: dietaryValue.value === "OTHER" ? dietaryDescription.value.trim() : null }
      : null
  };

  if (isEdit.value) {
    emit("submit", { id: props.guest.id, ...payload });
  } else {
    emit("submit", payload);
  }
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

.textarea {
  resize: vertical;
  font-family: inherit;
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 600px) {
  .two { grid-template-columns: 1fr; }
}

.checkbox-field {
  margin-top: -4px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-main);
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--brand-gold);
  cursor: pointer;
}

.err {
  margin-top: 6px;
  font-size: 12px;
  color: var(--error);
  font-weight: 600;
}
</style>

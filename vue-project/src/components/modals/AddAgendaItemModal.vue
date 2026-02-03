<template>
  <BaseModal :open="open" :title="t('agenda.addDialog.title')" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label>{{ t("agenda.form.title") }} *</label>
        <input class="input" v-model="title" :placeholder="t('agenda.addDialog.titlePh')" />
        <div v-if="errors.title" class="err">{{ errors.title }}</div>
      </div>

      <div class="two">
        <div class="field">
          <label>{{ t("agenda.form.startTime") }} *</label>
          <input class="input" v-model="start" placeholder="15:30" />
          <div v-if="errors.start" class="err">{{ errors.start }}</div>
        </div>
        <div class="field">
          <label>{{ t("agenda.form.endTime") }} *</label>
          <input class="input" v-model="end" placeholder="16:30" />
          <div v-if="errors.end" class="err">{{ errors.end }}</div>
        </div>
      </div>

      <div class="field">
        <label>{{ t("agenda.form.location") }}</label>
        <input class="input" v-model="location" :placeholder="t('agenda.addDialog.locationPh')" />
      </div>

      <div class="field">
        <label>{{ t("agenda.form.notes") }}</label>
        <textarea class="textarea" rows="4" v-model="description" :placeholder="t('agenda.addDialog.notesPh')" />
      </div>

      <div class="two">
        <div class="field">
          <label>{{ t("agenda.form.responsible") }}</label>
          <input class="input" v-model="responsible" :placeholder="t('agenda.addDialog.responsiblePh')" />
        </div>
        <div class="field">
          <label>{{ t("agenda.form.visibility") }}</label>
          <select class="select" v-model="visibility">
            <option value="everyone">{{ t("agenda.visibility.everyone") }}</option>
            <option value="team">{{ t("agenda.visibility.team") }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>{{ t("agenda.form.status") }}</label>
        <select class="select" v-model="status">
          <option value="upcoming">{{ t("agenda.status.upcoming") }}</option>
          <option value="in_progress">{{ t("agenda.status.inProgress") }}</option>
          <option value="completed">{{ t("agenda.status.completed") }}</option>
          <option value="break">{{ t("agenda.status.break") }}</option>
        </select>
      </div>

      <!-- ✅ IMPORTANT: footer slot must be sibling, not inside form -->
    </form>

    <template #footer>
      <BaseButton variant="outline" @click="emit('close')">
        {{ t("common.cancel") }}
      </BaseButton>
      <BaseButton variant="primary" @click="submit">
        {{ t("agenda.addDialog.create") }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import BaseModal from "@/components/ui/BaseModal.vue";
import BaseButton from "@/components/ui/BaseButton.vue";

const props = defineProps({ open: Boolean });
const emit = defineEmits(["close", "submit"]);
const { t } = useI18n();

const title = ref("");
const start = ref("");
const end = ref("");
const location = ref("");
const description = ref("");
const responsible = ref("");
const visibility = ref("everyone");
const status = ref("upcoming");

const errors = reactive({ title: "", start: "", end: "" });

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    title.value = "";
    start.value = "";
    end.value = "";
    location.value = "";
    description.value = "";
    responsible.value = "";
    visibility.value = "everyone";
    status.value = "upcoming";
    errors.title = "";
    errors.start = "";
    errors.end = "";
  }
);

function validate() {
  errors.title = title.value.trim() ? "" : t("agenda.errors.titleRequired");
  errors.start = start.value.trim() ? "" : t("agenda.errors.startRequired");
  errors.end = end.value.trim() ? "" : t("agenda.errors.endRequired");
  return !errors.title && !errors.start && !errors.end;
}

function submit() {
  if (!validate()) return;

  emit("submit", {
    title: title.value.trim(),
    start: start.value.trim(),
    end: end.value.trim(),
    location: location.value.trim() || "",
    description: description.value.trim() || "",
    responsible: responsible.value.trim() || "",
    visibility: visibility.value,
    status: status.value
  });
}
</script>

<style scoped>
.form{ display:grid; gap: 12px; }

.field label{
  font-size: 11px;
  font-weight: 900;
  color: var(--neutral-700);
  display:block;
  margin-bottom: 6px;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.input, .select, .textarea{
  width: 100%;
  border: 1px solid rgba(0,0,0,0.10);
  background: rgba(255,255,255,0.92);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
}
.input:focus, .select:focus, .textarea:focus{
  border-color: rgba(200,162,77,0.55);
  box-shadow: 0 0 0 3px rgba(200,162,77,0.14);
}

.two{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 600px){ .two{ grid-template-columns: 1fr; } }

.err{ margin-top: 6px; font-size: 12px; color: #b42318; font-weight: 800; }
</style>

<template>
  <BaseModal :open="open" :title="modalTitle" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label>{{ t("tables.tasks.form.title") }} *</label>
        <input
          class="input"
          v-model="title"
          :placeholder="t('tables.tasks.form.titlePh')"
        />
        <div v-if="errors.title" class="err">{{ errors.title }}</div>
      </div>

      <div class="field">
        <label>{{ t("tables.tasks.form.description") }}</label>
        <textarea
          class="input textarea"
          v-model="description"
          :placeholder="t('tables.tasks.form.descriptionPh')"
          rows="3"
        />
      </div>

      <div class="two">
        <div class="field">
          <label>{{ t("tables.tasks.form.dueDate") }}</label>
          <input class="input" type="date" v-model="dueDate" />
        </div>

        <div class="field">
          <label>{{ t("tables.tasks.form.status") }} *</label>
          <select class="select" v-model="status">
            <option value="PENDING">{{ t("tables.tasks.pending") }}</option>
            <option value="IN_PROGRESS">{{ t("tables.tasks.inProgress") }}</option>
            <option value="COMPLETED">{{ t("tables.tasks.completed") }}</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label>{{ t("tables.tasks.form.priority") }}</label>
        <select class="select" v-model="priority">
          <option value="LOW">{{ t("tables.tasks.priorityLow") }}</option>
          <option value="MEDIUM">{{ t("tables.tasks.priorityMedium") }}</option>
          <option value="HIGH">{{ t("tables.tasks.priorityHigh") }}</option>
        </select>
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
  type: { type: String, default: "TASK" },
  task: { type: Object, default: null }
});

const emit = defineEmits(["close", "submit"]);

const isEdit = computed(() => !!props.task);

const title = ref("");
const description = ref("");
const dueDate = ref("");
const status = ref("PENDING");
const priority = ref("MEDIUM");
const errors = ref({ title: "" });

const modalTitle = computed(() => {
  if (isEdit.value) return t("tables.tasks.editTask");
  return props.type === "REMINDER"
    ? t("tables.tasks.addReminder")
    : t("tables.tasks.addTask");
});

watch(
  () => props.open,
  (v) => {
    if (v) {
      if (props.task) {
        title.value = props.task.title || "";
        description.value = props.task.description || "";
        dueDate.value = props.task.dueDate ? props.task.dueDate.substring(0, 10) : "";
        status.value = props.task.status || "PENDING";
        priority.value = props.task.priority || "MEDIUM";
      } else {
        title.value = "";
        description.value = "";
        dueDate.value = "";
        status.value = "PENDING";
        priority.value = "MEDIUM";
      }
      errors.value = { title: "" };
    }
  }
);

function submit() {
  errors.value.title = title.value.trim() ? "" : t("tables.tasks.form.titleRequired");
  if (errors.value.title) return;

  const payload = {
    title: title.value.trim(),
    description: description.value.trim() || null,
    dueDate: dueDate.value || null,
    status: status.value,
    priority: priority.value,
    type: props.task?.type || props.type
  };

  if (isEdit.value) payload.id = props.task.id;

  emit("submit", payload);
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

.err {
  margin-top: 6px;
  font-size: 12px;
  color: var(--error);
  font-weight: 600;
}
</style>

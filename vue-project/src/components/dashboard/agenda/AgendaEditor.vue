<template>
  <div class="editor">
    <div class="editor-head">
      <h3 class="editor-title">{{ titleLabel }}</h3>
      <button class="icon-btn" type="button" @click="$emit('close')" aria-label="Close">
        ✕
      </button>
    </div>

    <form class="form" @submit.prevent="submit">
      <div class="field">
        <label class="label">Day</label>
        <select class="input" v-model="draft.dayId" required>
          <option v-for="d in days" :key="d.id" :value="d.id">
            {{ d.title }}
          </option>
        </select>
      </div>

      <div class="field">
        <label class="label">Title</label>
        <input class="input" v-model.trim="draft.title" type="text" required />
      </div>

      <div class="row">
        <div class="field">
          <label class="label">Start time</label>
          <input class="input" v-model="draft.startTime" type="time" required />
        </div>
        <div class="field">
          <label class="label">End time</label>
          <input class="input" v-model="draft.endTime" type="time" required />
        </div>
      </div>

      <div class="field">
        <label class="label">Location</label>
        <input class="input" v-model.trim="draft.location" type="text" placeholder="e.g. Foyer" />
      </div>

      <div class="field">
        <label class="label">Notes</label>
        <textarea class="input textarea" v-model.trim="draft.notes" rows="4"></textarea>
      </div>

      <div class="row">
        <div class="field">
          <label class="label">Responsible</label>
          <input class="input" v-model.trim="draft.responsible" type="text" placeholder="e.g. Sarah J." />
        </div>

        <div class="field">
          <label class="label">Visibility</label>
          <select class="input" v-model="draft.visibility">
            <option value="EVERYONE">Everyone</option>
            <option value="TEAM_ONLY">Team only</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label">Tag</label>
          <input class="input" v-model.trim="draft.tag" type="text" placeholder="e.g. Reception" />
        </div>

        <div class="field">
          <label class="label">Status</label>
          <select class="input" v-model="draft.status">
            <option value="">—</option>
            <option value="UPCOMING">Upcoming</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div v-if="validationError" class="error">
        {{ validationError }}
      </div>

      <div class="actions">
        <ButtonMain
          v-if="draft.id"
          variant="danger"
          type="button"
          @click="$emit('delete', draft.id)"
        >
          {{ deleteLabel }}
        </ButtonMain>

        <div class="actions-right">
          <ButtonMain variant="ghost" type="button" @click="$emit('close')">
            {{ cancelLabel }}
          </ButtonMain>

          <ButtonMain variant="main" type="submit">
            {{ saveLabel }}
          </ButtonMain>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from "vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const props = defineProps({
  modelValue: { type: Object, default: null }, // selected item
  days: { type: Array, default: () => [] },

  titleLabel: { type: String, required: true },
  saveLabel: { type: String, required: true },
  cancelLabel: { type: String, required: true },
  deleteLabel: { type: String, required: true }
});

const emit = defineEmits(["close", "save", "delete"]);

const validationError = ref("");

const draft = reactive({
  id: null,
  dayId: "",
  title: "",
  startTime: "",
  endTime: "",
  location: "",
  notes: "",
  responsible: "",
  visibility: "EVERYONE",
  status: "",
  tag: ""
});

watch(
  () => props.modelValue,
  (val) => {
    validationError.value = "";
    if (!val) return;

    draft.id = val.id ?? null;
    draft.dayId = val.dayId ?? (props.days[0]?.id ?? "");
    draft.title = val.title ?? "";
    draft.startTime = val.startTime ?? "";
    draft.endTime = val.endTime ?? "";
    draft.location = val.location ?? "";
    draft.notes = val.notes ?? "";
    draft.responsible = val.responsible ?? "";
    draft.visibility = val.visibility ?? "EVERYONE";
    draft.status = val.status ?? "";
    draft.tag = val.tag ?? "";
  },
  { immediate: true }
);

function submit() {
  validationError.value = "";

  if (!draft.dayId) {
    validationError.value = "Day is required.";
    return;
  }
  if (!draft.title.trim()) {
    validationError.value = "Title is required.";
    return;
  }
  if (!draft.startTime || !draft.endTime) {
    validationError.value = "Start and end time are required.";
    return;
  }
  if (draft.endTime <= draft.startTime) {
    validationError.value = "End time must be after start time.";
    return;
  }

  emit("save", { ...draft });
}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee8d6;
  margin-bottom: 14px;
}

.editor-title {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #1e1d1a;
}

.icon-btn {
  border: 1px solid #ece7d8;
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
  font-weight: 900;
  color: #6e6a5f;
}

.form {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
}

.label {
  font-size: 12px;
  font-weight: 900;
  color: #6e6a5f;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.input {
  width: 100%;
  border: 1px solid #ece7d8;
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 700;
  font-size: 14px;
  color: #2b2a27;
  background: #fff;
}

.textarea {
  resize: vertical;
  min-height: 90px;
}

.error {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #ffd2d2;
  background: #fff5f5;
  color: #b00020;
  font-weight: 800;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid #eee8d6;
  margin-top: 6px;
}

.actions-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>

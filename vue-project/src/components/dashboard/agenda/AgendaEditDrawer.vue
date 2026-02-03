<template>
  <div class="card card-pad-lg">
    <div class="row">
      <div style="font-weight:900; font-size:18px;">{{ t("agenda.editItem") }}</div>
      <button class="btn btn-ghost" style="padding:8px 12px;" @click="$emit('close')">✕</button>
    </div>

    <div class="divider" style="margin:12px 0;"></div>

    <label class="small" style="font-weight:900;">{{ t("agenda.fieldTitle") }}</label>
    <input class="input" :value="modelValue.title" @input="u('title', $event.target.value)" />

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px;">
      <div>
        <label class="small" style="font-weight:900;">{{ t("agenda.fieldStart") }}</label>
        <input class="input" :value="modelValue.start" @input="u('start', $event.target.value)" />
      </div>
      <div>
        <label class="small" style="font-weight:900;">{{ t("agenda.fieldEnd") }}</label>
        <input class="input" :value="modelValue.end" @input="u('end', $event.target.value)" />
      </div>
    </div>

    <div style="margin-top:12px;">
      <label class="small" style="font-weight:900;">{{ t("agenda.fieldLocation") }}</label>
      <input class="input" :value="modelValue.location" @input="u('location', $event.target.value)" />
    </div>

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px;">
      <div>
        <label class="small" style="font-weight:900;">{{ t("agenda.fieldResponsible") }}</label>
        <input class="input" :value="modelValue.responsible" @input="u('responsible', $event.target.value)" />
      </div>
      <div>
        <label class="small" style="font-weight:900;">{{ t("agenda.fieldVisibility") }}</label>
        <select class="select" :value="modelValue.visibility" @change="u('visibility', $event.target.value)">
          <option value="everyone">{{ t("agenda.visibilityEveryone") }}</option>
          <option value="team">{{ t("agenda.visibilityTeam") }}</option>
        </select>
      </div>
    </div>

    <div style="margin-top:12px;">
      <label class="small" style="font-weight:900;">{{ t("agenda.fieldNotes") }}</label>
      <textarea class="textarea" rows="5" :value="modelValue.notes" @input="u('notes', $event.target.value)"></textarea>
    </div>

    <div class="row" style="margin-top:16px;">
      <button class="btn btn-ghost" style="color:var(--error);" @click="$emit('delete')">🗑 {{ t("agenda.delete") }}</button>

      <div style="display:flex; gap:10px;">
        <button class="btn btn-ghost" @click="$emit('cancel')">{{ t("agenda.cancel") }}</button>
        <button class="btn btn-primary" style="border-radius:12px;" @click="$emit('save')">{{ t("agenda.save") }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const props = defineProps({ modelValue: Object });
const emit = defineEmits(["update:modelValue", "close", "save", "cancel", "delete"]);

function u(key, value) {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}
</script>

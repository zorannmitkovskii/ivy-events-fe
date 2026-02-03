<template>
  <div class="page">
    <AgendaToolbar @add="onAdd" />

    <div v-if="loading" class="card card-pad">
      {{ t("agenda.loading") }}
    </div>

    <div v-else-if="error" class="card card-pad">
      <div style="font-weight:900;">{{ t("agenda.errorTitle") }}</div>
      <div class="small" style="margin-top:6px;">{{ error }}</div>
      <div style="margin-top:12px;">
        <button class="btn btn-primary" @click="run">{{ t("agenda.retry") }}</button>
      </div>
    </div>

    <template v-else>
      <div v-if="items.length === 0" class="card card-pad">
        <div style="font-weight:900;">{{ t("agenda.emptyTitle") }}</div>
        <div class="small" style="margin-top:6px;">{{ t("agenda.emptyMessage") }}</div>
        <div style="margin-top:12px;">
          <button class="btn btn-primary" @click="onAdd">{{ t("agenda.addItem") }}</button>
        </div>
      </div>

      <div v-else style="display:grid; grid-template-columns: 1fr 420px; gap:14px;">
        <AgendaTimeline :items="items" :date="date" @select="openEdit" />

        <AgendaEditDrawer
          v-if="drawerOpen"
          v-model="form"
          @close="closeEdit"
          @cancel="closeEdit"
          @delete="remove"
          @save="onSave"
        />
        <div v-else class="card card-pad" style="display:flex; align-items:center; justify-content:center; color: var(--neutral-700);">
          Select an agenda item to edit
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { useAgenda } from "@/composables/useAgenda";

import AgendaToolbar from "@/components/dashboard/agenda/AgendaToolbar.vue";
import AgendaTimeline from "@/components/dashboard/agenda/AgendaTimeline.vue";
import AgendaEditDrawer from "@/components/dashboard/agenda/AgendaEditDrawer.vue";

const { t } = useI18n();

const {
  items,
  date,
  loading,
  error,
  run,
  drawerOpen,
  form,
  openEdit,
  closeEdit,
  addNew,
  save,
  create,
  remove
} = useAgenda();

function onAdd() {
  addNew();
}

async function onSave() {
  // if creating a new item:
  // composable uses selectedId="__new__" when addNew()
  // so decide between create vs save:
  if (form.value && form.value.title && form.value.start && form.value.end) {
    // create if new draft
    // the composable will only create when selectedId === "__new__"
    await create().catch(() => {});
    await save().catch(() => {});
  } else {
    // basic safeguard; you can add validation UI later
    await save().catch(() => {});
  }
}
</script>

<style scoped>
@media (max-width: 1100px){
  .page > div[style*="grid-template-columns: 1fr 420px"] { grid-template-columns: 1fr !important; }
}
</style>

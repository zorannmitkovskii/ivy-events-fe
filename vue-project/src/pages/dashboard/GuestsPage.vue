<template>
  <div class="page">
    <GuestsToolbar @add="onAdd" @import="onImport" @remind="onRemind" />

    <div v-if="loading" class="card card-pad">
      {{ t("guests.loading") }}
    </div>

    <div v-else-if="error" class="card card-pad">
      <div style="font-weight:900;">{{ t("guests.errorTitle") }}</div>
      <div class="small" style="margin-top:6px;">{{ error }}</div>
      <div style="margin-top:12px;">
        <button class="btn btn-primary" @click="run">{{ t("guests.retry") }}</button>
      </div>
    </div>

    <template v-else>
      <GuestsFilters v-model="filters" :tables="tables" @apply="applyFilters" />

      <div v-if="items.length === 0" class="card card-pad">
        <div style="font-weight:900;">{{ t("guests.emptyTitle") }}</div>
        <div class="small" style="margin-top:6px;">{{ t("guests.emptyMessage") }}</div>
        <div style="margin-top:12px;">
          <button class="btn btn-primary" @click="onAdd">{{ t("guests.addGuest") }}</button>
        </div>
      </div>

      <GuestsTable
        v-else
        :rows="items"
        :tables="tables"
        :totals="totals"
        @changeTable="onChangeTable"
        @remove="onRemove"
      />
    </template>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { useGuests } from "@/composables/useGuests";

import GuestsToolbar from "@/components/dashboard/guests/GuestsToolbar.vue";
import GuestsFilters from "@/components/dashboard/guests/GuestsFilters.vue";
import GuestsTable from "@/components/dashboard/guests/GuestsTable.vue";

const { t } = useI18n();

const {
  items,
  tables,
  totals,
  filters,
  loading,
  error,
  run,
  applyFilters,
  updateTable,
  removeGuest
} = useGuests();

function onAdd() {
  // open modal later
  console.log("Add guest");
}
function onImport() {
  console.log("Import guests");
}
function onRemind() {
  console.log("Send reminder");
}

async function onChangeTable({ guestId, tableId }) {
  await updateTable(guestId, tableId);
}

async function onRemove(guestId) {
  // you can add ConfirmDialog later
  await removeGuest(guestId);
}
</script>

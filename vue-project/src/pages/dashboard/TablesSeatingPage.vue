<template>
  <TablesLayout
    :title="t('tables.title')"
    :subtitle="t('tables.subtitle')"
  >
    <template #actions>
      <BaseButton variant="primary" @click="openAddTable">
        {{ t("tables.addTable") }}
      </BaseButton>
      <BaseButton variant="gold" @click="printExport">
        {{ t("tables.printExport") }}
      </BaseButton>
    </template>

    <template #left>
      <TableListCard
        :tables="tables"
        :selectedId="selectedTableId"
        @select="selectedTableId = $event"
      />
    </template>

    <template #right>
      <div v-if="loading" class="card card-pad">Loading…</div>
      <div v-else-if="error" class="card card-pad">{{ error }}</div>
      <GuestAssignmentCard
        v-else
        :guests="guests"
        :tables="tables"
        @add-guest="modalOpen = true"
        @change-table="changeTable"
        @remove="removeGuest"
      />
    </template>
  </TablesLayout>

  <AddGuestModal
    :open="modalOpen"
    @close="modalOpen = false"
    @submit="handleAddGuest"
  />
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTablesSeating } from "@/composables/useTablesSeating";

import BaseButton from "@/components/ui/BaseButton.vue";
import TablesLayout from "@/components/dashboard/tables/TablesLayout.vue";
import TableListCard from "@/components/dashboard/tables/TableListCard.vue";
import GuestAssignmentCard from "@/components/dashboard/tables/GuestAssignmentCard.vue";
import AddGuestModal from "@/components/dashboard/tables/AddGuestsModal.vue";

const { t } = useI18n();
const modalOpen = ref(false);

const {
  loading, error, tables, guests, selectedTableId,
  load, addGuest, changeTable, removeGuest
} = useTablesSeating();

onMounted(load);

async function handleAddGuest(payload) {
  await addGuest(payload);
  modalOpen.value = false;
}

function openAddTable() {
  // placeholder (later modal)
  alert("Add Table (next)");
}

function printExport() {
  window.print();
}
</script>

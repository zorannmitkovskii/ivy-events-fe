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
        :tables="tablesForList"
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
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTablesSeating } from "@/composables/useTablesSeating";

import BaseButton from "@/components/ui/BaseButton.vue";
import TablesLayout from "@/components/dashboard/tables/TablesLayout.vue";
import TableListCard from "@/components/dashboard/tables/TableListCard.vue";
import GuestAssignmentCard from "@/components/dashboard/tables/GuestAssignmentCard.vue";
import AddGuestModal from "@/components/dashboard/tables/AddGuestModal.vue";

// ✅ FIX: correct filename (singular)

const { t } = useI18n();
const modalOpen = ref(false);

const {
  loading, error, tables, guests, selectedTableId,
  load, addGuest, changeTable, removeGuest
} = useTablesSeating();

onMounted(load);

// ✅ add "Unassigned" item on the left
const tablesForList = computed(() => {
  const unassignedCount = guests.value.filter(g => !g.tableId).length;

  return [
    {
      id: "unassigned",
      name: t("tables.unassigned"),
      capacity: Math.max(unassignedCount, 1),
      assigned: unassignedCount
    },
    ...tables.value
  ];
});

async function handleAddGuest(payload) {
  await addGuest(payload);
  modalOpen.value = false;
}

function openAddTable() {
  alert("Add Table (next)");
}

function printExport() {
  window.print();
}
</script>

<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t("tables.title") }}</h1>
      <p class="dash-page-subtitle">{{ t("tables.subtitle") }}</p>
    </div>

    <TablesLayout>
      <template #actions>
        <ButtonMain variant="main" @click="tableModalOpen = true">
          {{ t("tables.addTable") }}
        </ButtonMain>
        <ButtonMain variant="outline" @click="guestModalOpen = true">
          {{ t("tables.addGuest") }}
        </ButtonMain>
        <ButtonMain variant="outline" @click="printExport">
          {{ t("tables.printExport") }}
        </ButtonMain>
        <ButtonMain variant="gold" :disabled="sending" @click="sendNotification">
          {{ sending ? t("overview.sending") : t("tables.sendNotification") }}
        </ButtonMain>
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
          @add-guest="guestModalOpen = true"
          @change-table="changeTable"
          @remove="removeGuest"
          @edit="openEditGuest"
        />
      </template>
    </TablesLayout>

    <AddTableModal
      :open="tableModalOpen"
      :nextNumber="nextTableNumber"
      @close="tableModalOpen = false"
      @submit="handleAddTable"
    />

    <AddGuestModal
      :open="guestModalOpen"
      :guest="editingGuest"
      @close="closeGuestModal"
      @submit="handleAddGuest"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTablesSeating } from "@/composables/useTablesSeating";

import ButtonMain from "@/components/generic/ButtonMain.vue";
import { guestsService } from "@/services/guests.service";
import { onboardingStore } from "@/store/onboarding.store";
import TablesLayout from "@/components/dashboard/tables/TablesLayout.vue";
import TableListCard from "@/components/dashboard/tables/TableListCard.vue";
import GuestAssignmentCard from "@/components/dashboard/tables/GuestAssignmentCard.vue";
import AddGuestModal from "@/components/dashboard/tables/AddGuestModal.vue";
import AddTableModal from "@/components/dashboard/tables/AddTableModal.vue";

const { t } = useI18n();
const guestModalOpen = ref(false);
const tableModalOpen = ref(false);
const editingGuest = ref(null);
const sending = ref(false);

const {
  loading, error, tables, guests, selectedTableId,
  load, addTable, addGuest, updateGuest, changeTable, removeGuest
} = useTablesSeating();

onMounted(load);

const nextTableNumber = computed(() => tables.value.length + 1);

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

async function handleAddTable(payload) {
  await addTable(payload);
  tableModalOpen.value = false;
}

async function handleAddGuest(payload) {
  if (payload.id) {
    const { id, ...body } = payload;
    await updateGuest(id, body);
  } else {
    await addGuest(payload);
  }
  closeGuestModal();
}

function openEditGuest(guest) {
  editingGuest.value = guest;
  guestModalOpen.value = true;
}

function closeGuestModal() {
  guestModalOpen.value = false;
  editingGuest.value = null;
}

function printExport() {
  window.print();
}

async function sendNotification() {
  const eventId = onboardingStore.eventId;
  if (sending.value || !eventId) return;
  sending.value = true;
  try {
    await guestsService.sendNotification(eventId);
  } finally {
    sending.value = false;
  }
}
</script>

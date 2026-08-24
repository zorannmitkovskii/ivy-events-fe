<template>
  <div class="dash-page">
    <PageHeader :title="t('tables.title')" :subtitle="t('tables.subtitle')" />

    <div class="view-switch" role="tablist" :aria-label="t('tables.title')">
      <button
        role="tab"
        :aria-selected="view === 'list'"
        :class="{ on: view === 'list' }"
        @click="view = 'list'"
      >{{ t("tables.listView") }}</button>
      <button
        role="tab"
        :aria-selected="view === 'plan'"
        :class="{ on: view === 'plan' }"
        @click="view = 'plan'"
      >{{ t("tables.planView") }}</button>
    </div>

    <SeatingEditor v-if="view === 'plan' && eventId" :event-id="eventId" />

    <TablesLayout v-else>
      <template #actions>
        <ButtonMain variant="main" @click="tableModalOpen = true">
          {{ t("tables.addTable") }}
        </ButtonMain>
        <ButtonMain variant="outline" @click="guestModalOpen = true">
          {{ t("tables.addGuest") }}
        </ButtonMain>
        <ButtonMain variant="outline" :disabled="exporting" @click="onExport">
          {{ exporting ? t("guests.exporting") : t("tables.printExport") }}
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
      v-if="view === 'list'"
      :open="tableModalOpen"
      :nextNumber="nextTableNumber"
      @close="tableModalOpen = false"
      @submit="handleAddTable"
    />

    <AddGuestModal
      v-if="view === 'list'"
      :open="guestModalOpen"
      :guest="editingGuest"
      @close="closeGuestModal"
      @submit="handleAddGuest"
    />
  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
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
import SeatingEditor from "@/components/dashboard/tables/SeatingEditor.vue";

const { t } = useI18n();

/** The list view is what people use today and works; the plan is the new way
 *  to do the same thing. A tab rather than a replacement. */
const view = ref("list");
const eventId = computed(() => onboardingStore.eventId || "");

const guestModalOpen = ref(false);
const tableModalOpen = ref(false);
const editingGuest = ref(null);
const sending = ref(false);
const exporting = ref(false);

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

async function onExport() {
  const eventId = onboardingStore.eventId;
  if (exporting.value || !eventId) return;
  exporting.value = true;
  try {
    const blob = await guestsService.exportPdf(eventId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "guests.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed", e);
  } finally {
    exporting.value = false;
  }
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

<style scoped>
.view-switch { display: flex; gap: 6px; margin-bottom: 16px; }
.view-switch button {
  padding: 7px 16px; border: 1px solid var(--line); border-radius: 20px;
  background: #fff; color: var(--ink-3); font-family: inherit; font-size: 13px;
  font-weight: 600; cursor: pointer;
}
.view-switch button.on { background: var(--brand); border-color: var(--brand); color: #fff; }
</style>

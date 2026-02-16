<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useAgenda } from "@/composables/useAgenda.js";
import AddAgendaItemModal from "@/components/modals/AddAgendaItemModal.vue";
import AgendaHeader from "@/components/dashboard/agenda/AgendaHeader.vue";
import DashboardTable from "@/components/dashboard/DashboardTable.vue";
import AgendaTableRow from "@/components/dashboard/agenda/AgendaTableRow.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t } = useI18n();

const {
  loading, error,
  items,
  loadAgenda, createItem, updateItem, deleteItem,
} = useAgenda();

// Modal state
const modalOpen = ref(false);
const editingItem = ref(null);

function openCreateModal() {
  editingItem.value = null;
  modalOpen.value = true;
}

function openEditModal(item) {
  editingItem.value = { ...item };
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  editingItem.value = null;
}

onMounted(() => {
  loadAgenda();
});

async function onSave(payload) {
  if (payload.id) {
    await updateItem(payload.id, payload);
  } else {
    await createItem(payload);
  }
  closeModal();
}

async function onDelete(id) {
  await deleteItem(id);
  closeModal();
}
</script>

<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t('agenda.title') }}</h1>
      <p class="dash-page-subtitle">{{ t('agenda.subtitle', { event: '', dateRange: '' }) }}</p>
    </div>

    <AgendaHeader
      :addLabel="t('agenda.addItem')"
      @add="openCreateModal"
    />

    <div v-if="loading" class="loading-msg">Loading...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>

    <div v-else-if="items.length === 0" class="empty-card">
      <div class="empty-title">{{ t('agenda.emptyTitle') }}</div>
      <div class="empty-sub">{{ t('agenda.emptyMessage') }}</div>
      <div style="margin-top:12px;">
        <ButtonMain variant="main" @click="openCreateModal">{{ t('agenda.addItem') }}</ButtonMain>
      </div>
    </div>

    <DashboardTable v-else>
      <template #head>
        <th>{{ t("agenda.th.title") }}</th>
        <th>{{ t("agenda.th.type") }}</th>
        <th>{{ t("agenda.th.dateTime") }}</th>
        <th>{{ t("agenda.th.location") }}</th>
        <th>{{ t("agenda.th.visibility") }}</th>
        <th>{{ t("agenda.th.actions") }}</th>
      </template>

      <template #body>
        <AgendaTableRow
          v-for="item in items"
          :key="item.id"
          :item="item"
          @edit="openEditModal"
          @delete="onDelete"
        />
      </template>

      <template #footer>
        <span>{{ t("agenda.totalItems", { count: items.length }) }}</span>
      </template>
    </DashboardTable>

    <AddAgendaItemModal
      :open="modalOpen"
      :item="editingItem"
      @close="closeModal"
      @submit="onSave"
      @delete="onDelete"
    />
  </div>
</template>

<style scoped>
.loading-msg {
  padding: 18px 0;
  color: var(--neutral-500);
}

.error-msg {
  padding: 18px 0;
  color: #b00020;
}

.empty-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
}

.empty-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--neutral-900);
}

.empty-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--neutral-500);
}
</style>

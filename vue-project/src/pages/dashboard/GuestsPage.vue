<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <h1 class="dash-page-title">{{ t("guests.title") }}</h1>
      <p class="dash-page-subtitle">{{ t("guests.subtitle") }}</p>
    </div>

    <div v-if="loading" class="g-card g-card-pad">
      {{ t("guests.loading") }}
    </div>

    <div v-else-if="error" class="g-card g-card-pad">
      <div class="empty-title">{{ t("guests.errorTitle") }}</div>
      <div class="empty-sub">{{ error }}</div>
      <div style="margin-top:12px;">
        <ButtonMain variant="main" @click="run">{{ t("guests.retry") }}</ButtonMain>
      </div>
    </div>

    <template v-else>
      <GuestsToolbar
        v-model="filters"
        :tables="tables"
        :sending="sending"
        :has-guests="items.length > 0"
        @add="openCreateModal"
        @import="onImport"
        @remind="onRemind"
        @apply="applyFilters"
      />

      <div v-if="items.length === 0" class="g-card g-card-pad">
        <div class="empty-title">{{ t("guests.emptyTitle") }}</div>
        <div class="empty-sub">{{ t("guests.emptyMessage") }}</div>
        <div style="margin-top:12px;">
          <ButtonMain variant="main" @click="openCreateModal">{{ t("guests.addGuest") }}</ButtonMain>
        </div>
      </div>

      <GuestsTable
        v-else
        :rows="items"
        :tables="tables"
        :totals="totals"
        @changeTable="onChangeTable"
        @changeStatus="onChangeStatus"
        @remove="onRemove"
        @edit="openEditModal"
      />
    </template>

    <AddGuestModal
      :open="modalOpen"
      :guest="editingGuest"
      @close="closeModal"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useGuests } from "@/composables/useGuests";
import { guestsService } from "@/services/guests.service";
import { onboardingStore } from "@/store/onboarding.store";

import GuestsToolbar from "@/components/dashboard/guests/GuestsToolbar.vue";
import GuestsTable from "@/components/dashboard/guests/GuestsTable.vue";
import AddGuestModal from "@/components/dashboard/tables/AddGuestModal.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const modalOpen = ref(false);
const editingGuest = ref(null);
const sending = ref(false);
const eventId = computed(() => onboardingStore.eventId);

const {
  items,
  tables,
  totals,
  filters,
  loading,
  error,
  run,
  applyFilters,
  addGuest,
  updateGuest,
  updateTable,
  removeGuest
} = useGuests();

// Auto-open modal when navigated with ?action=add
watch(() => route.query.action, (action) => {
  if (action === "add") {
    openCreateModal();
    router.replace({ ...route, query: {} });
  }
}, { immediate: true });

function openCreateModal() {
  editingGuest.value = null;
  modalOpen.value = true;
}

function openEditModal(guest) {
  editingGuest.value = guest;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  editingGuest.value = null;
}

async function handleSubmit(payload) {
  if (payload.id) {
    const { id, ...body } = payload;
    await updateGuest(id, body);
  } else {
    await addGuest(payload);
  }
  closeModal();
}

function onImport() {
  console.log("Import guests");
}
async function onRemind() {
  if (sending.value || !eventId.value) return;
  sending.value = true;
  try {
    await guestsService.sendNotification(eventId.value);
  } finally {
    sending.value = false;
  }
}

async function onChangeTable({ guestId, tableId }) {
  await updateTable(guestId, tableId);
}

async function onChangeStatus({ guestId, status }) {
  await guestsService.updateStatus(guestId, { inviteStatus: status.toUpperCase() });
  await run();
}

async function onRemove(guestId) {
  await removeGuest(guestId);
}
</script>

<style scoped>
.g-card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.g-card-pad {
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

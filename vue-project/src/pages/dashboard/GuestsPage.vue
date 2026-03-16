<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <div>
        <div class="page-eyebrow">{{ t("sidebar.navigation") }}</div>
        <h1 class="dash-page-title">{{ t("guests.title") }}</h1>
        <p class="dash-page-subtitle">{{ t("guests.subtitle") }}</p>
      </div>
    </div>

    <div v-if="loading" class="d-card d-card-pad">
      {{ t("guests.loading") }}
    </div>

    <div v-else-if="error" class="d-card d-card-pad">
      <div class="empty-title">{{ t("guests.errorTitle") }}</div>
      <div class="empty-sub">{{ error }}</div>
      <div style="margin-top:12px;">
        <ButtonMain variant="main" @click="run">{{ t("guests.retry") }}</ButtonMain>
      </div>
    </div>

    <template v-else>
      <!-- Summary Stat Cards -->
      <div class="summary-row" v-if="items.length > 0">
        <div class="summary-card">
          <div class="sc-accent accent-sage"></div>
          <div class="sc-icon ic-sage">&#128101;</div>
          <div class="sc-value">{{ totals?.total || 0 }}</div>
          <div class="sc-label">{{ t("guests.totalGuests") }}</div>
        </div>
        <div class="summary-card">
          <div class="sc-accent accent-green"></div>
          <div class="sc-icon ic-green">&#10003;</div>
          <div class="sc-value">{{ totals?.confirmed || 0 }}</div>
          <div class="sc-label">{{ t("guests.confirmed") }}</div>
        </div>
        <div class="summary-card">
          <div class="sc-accent accent-gold"></div>
          <div class="sc-icon ic-gold">&#9679;</div>
          <div class="sc-value">{{ totals?.pending || 0 }}</div>
          <div class="sc-label">{{ t("guests.pending") }}</div>
        </div>
        <div class="summary-card">
          <div class="sc-accent accent-blush"></div>
          <div class="sc-icon ic-blush">&#10007;</div>
          <div class="sc-value">{{ totals?.declined || 0 }}</div>
          <div class="sc-label">{{ t("guests.declined") }}</div>
        </div>
      </div>

      <GuestsToolbar
        v-model="filters"
        :tables="tables"
        :sending="sending"
        :exporting="exporting"
        :has-guests="items.length > 0"
        @add="openCreateModal"
        @import="onImport"
        @remind="onRemind"
        @export="onExport"
        @apply="applyFilters"
      />

      <div v-if="items.length === 0" class="d-card d-card-pad empty-state">
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
const exporting = ref(false);
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

async function onExport() {
  if (exporting.value || !eventId.value) return;
  exporting.value = true;
  try {
    const blob = await guestsService.exportPdf(eventId.value);
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
.d-card {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
}

.d-card-pad {
  padding: 24px;
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
}

.empty-title {
  font-family: 'Playfair Display', serif;
  font-weight: 400;
  font-size: 18px;
  color: var(--dash-charcoal);
}

.empty-sub {
  margin-top: 6px;
  font-size: 13px;
  color: var(--dash-muted);
}

/* Summary Cards */
.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.summary-card {
  background: var(--dash-cream-card);
  border: 1px solid var(--dash-cream-border);
  border-radius: var(--dash-radius);
  padding: 18px 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.22s;
}

.summary-card:hover {
  border-color: var(--dash-sage-pale);
  box-shadow: var(--dash-shadow-md);
  transform: translateY(-2px);
}

.sc-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  border-radius: var(--dash-radius) var(--dash-radius) 0 0;
}

.accent-sage { background: linear-gradient(90deg, var(--dash-sage-light), var(--dash-sage-pale)); }
.accent-green { background: linear-gradient(90deg, #5a7a52, #b2c9aa); }
.accent-gold { background: linear-gradient(90deg, var(--dash-gold), var(--dash-gold-light)); }
.accent-blush { background: linear-gradient(90deg, var(--dash-blush), #d4b0a8); }

.sc-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  margin-bottom: 10px;
}

.ic-sage { background: rgba(90, 122, 82, 0.1); }
.ic-green { background: rgba(90, 122, 82, 0.12); color: var(--dash-sage); }
.ic-gold { background: rgba(184, 149, 78, 0.1); }
.ic-blush { background: rgba(196, 150, 142, 0.12); }

.sc-value {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 400;
  line-height: 1;
  color: var(--dash-charcoal);
}

.sc-label {
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dash-muted);
  font-weight: 600;
  margin-top: 6px;
}

.summary-row > *:nth-child(1) { animation: fadeUp 0.4s 0.05s ease both; }
.summary-row > *:nth-child(2) { animation: fadeUp 0.4s 0.1s ease both; }
.summary-row > *:nth-child(3) { animation: fadeUp 0.4s 0.15s ease both; }
.summary-row > *:nth-child(4) { animation: fadeUp 0.4s 0.2s ease both; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1100px) {
  .summary-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .summary-row { grid-template-columns: 1fr; }
}
</style>

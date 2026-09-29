<template>
  <div class="admin-page">
    <!-- Header -->
    <PageHeader :title="$t('admin.contacts.title')" :subtitle="$t('admin.contacts.subtitle')" />

    <!-- Toolbar -->
    <Toolbar v-model:search="search" :search-placeholder="$t('admin.contacts.searchPh')">
      <template #filters>
        <select v-model="statusFilter" class="filter-select">
        <option value="">{{ $t('admin.contacts.allStatuses') }}</option>
        <option value="IN_REVIEW">{{ $t('admin.contacts.statusInReview') }}</option>
        <option value="RESOLVED">{{ $t('admin.contacts.statusResolved') }}</option>
        </select>
      </template>
    </Toolbar>

    <!-- Table Card -->
    <DataTable
      :columns="columns"
      :rows="paginated"
      row-key="id"
      :loading="loading"
      :loading-label="$t('admin.contacts.loading') "
      :empty-title="$t('admin.contacts.empty')"
    >
      <template #cell-contact="{ row }">
        <div class="cell-main">
        <div>
        <div class="cell-title">{{ row.name || '—' }}</div>
        <div class="text-sub">{{ row.email }}</div>
        </div>
        </div>
      </template>

      <template #cell-subject="{ row }">
        <div class="cell-title">{{ row.subject || '—' }}</div>
      </template>

      <template #cell-message="{ row }">
        <div class="text-sub text-sub--wide">{{ row.message || '—' }}</div>
      </template>

      <template #cell-status="{ row }">
        <StatusPill :tone="row.status === 'RESOLVED' ? 'ok' : 'info'">{{ row.status === 'RESOLVED' ? $t('admin.contacts.statusResolved') : $t('admin.contacts.statusInReview') }}</StatusPill>
      </template>

      <template #cell-date="{ row }">
        <span class="text-sub">{{ formatDate(row.createdAt) }}</span>
      </template>

      <template #cell-actions="{ row }">
        <div class="actions">
        <button class="action-btn action-btn--edit" @click="viewMessage(row)" :title="$t('admin.contacts.view')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button
        class="action-btn"
        :class="row.status === 'RESOLVED' ? 'action-btn--reopen' : 'action-btn--resolve'"
        @click="toggleStatus(row)"
        :title="row.status === 'RESOLVED' ? $t('admin.contacts.reopen') : $t('admin.contacts.resolve')"
        >
        <svg v-if="row.status !== 'RESOLVED'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 2v6h6"/><path d="M2.5 8a10 10 0 0 1 19 2"/><path d="M21.5 22v-6h-6"/><path d="M21.5 16a10 10 0 0 1-19-2"/></svg>
        </button>
        </div>
      </template>
      <template v-if="filtered.length" #footer>
        <ListPager v-model:page="page" :total-pages="totalPages" :from="startIndex" :to="endIndex" :total="filtered.length" />
      </template>
    </DataTable>

    <!-- View Message Modal -->
    <BaseModal :open="modalOpen" :title="$t('admin.contacts.viewTitle')" @close="modalOpen = false">
      <div v-if="selectedRow" class="modal-content">
        <div class="modal-field">
          <span class="modal-label">{{ $t('admin.contacts.thContact') }}</span>
          <span>{{ selectedRow.name || '—' }} ({{ selectedRow.email }})</span>
        </div>
        <div class="modal-field">
          <span class="modal-label">{{ $t('admin.contacts.thSubject') }}</span>
          <span>{{ selectedRow.subject || '—' }}</span>
        </div>
        <div class="modal-field">
          <span class="modal-label">{{ $t('admin.contacts.thMessage') }}</span>
          <p class="modal-message">{{ selectedRow.message || '—' }}</p>
        </div>
        <div class="modal-field">
          <span class="modal-label">{{ $t('admin.contacts.thStatus') }}</span>
          <StatusPill :tone="selectedRow.status === 'RESOLVED' ? 'ok' : 'info'">{{ selectedRow.status === 'RESOLVED' ? $t('admin.contacts.statusResolved') : $t('admin.contacts.statusInReview') }}</StatusPill>
        </div>
        <div class="modal-field">
          <span class="modal-label">{{ $t('admin.contacts.thDate') }}</span>
          <span>{{ formatDate(selectedRow.createdAt) }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="modalOpen = false">{{ $t('common.cancel') }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import DataTable from '@/components/ui/DataTable.vue'
import ListPager from '@/components/ui/ListPager.vue'
import { useI18n } from 'vue-i18n'
import StatusPill from '@/components/ui/StatusPill.vue'
import Toolbar from '@/components/ui/Toolbar.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ref, computed, onMounted, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { contactService } from "@/services/contact.service";

const { t: tt } = useI18n()

const columns = computed(() => [
  { key: 'contact', label: tt('admin.contacts.thContact') },
  { key: 'subject', label: tt('admin.contacts.thSubject') },
  { key: 'message', label: tt('admin.contacts.thMessage') },
  { key: 'status', label: tt('admin.contacts.thStatus') },
  { key: 'date', label: tt('admin.contacts.thDate') },
  { key: 'actions', label: tt('admin.contacts.thActions'), align: 'right' },
])

const contacts = ref([]);
const loading = ref(true);

async function fetchData() {
  loading.value = true;
  try {
    const data = await contactService.listAll();
    contacts.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load contacts:", e);
    contacts.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);

/* ---- filters ---- */
const search = ref("");
const statusFilter = ref("");

watch([search, statusFilter], () => { page.value = 1; });

const filtered = computed(() => {
  let result = contacts.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(r =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.subject || "").toLowerCase().includes(q)
    );
  }
  if (statusFilter.value) {
    result = result.filter(r => r.status === statusFilter.value);
  }
  return result;
});

/* ---- pagination ---- */
const page = ref(1);
const perPage = 10;

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));
const paginated = computed(() =>
  filtered.value.slice((page.value - 1) * perPage, page.value * perPage)
);
const startIndex = computed(() =>
  filtered.value.length === 0 ? 0 : (page.value - 1) * perPage + 1
);
const endIndex = computed(() =>
  Math.min(page.value * perPage, filtered.value.length)
);


/* ---- modal ---- */
const modalOpen = ref(false);
const selectedRow = ref(null);

function viewMessage(row) {
  selectedRow.value = row;
  modalOpen.value = true;
}

/* ---- status toggle ---- */
async function toggleStatus(row) {
  const newStatus = row.status === "RESOLVED" ? "IN_REVIEW" : "RESOLVED";
  try {
    await contactService.update(row.id, { ...row, status: newStatus });
    row.status = newStatus;
  } catch (e) {
    console.error("Failed to update status:", e);
  }
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}
</script>

<style scoped>

.filter-select {
  padding: 9px 14px; border: 1px solid var(--line); border-radius: 10px;
  font-size: 14px; background: #fff; cursor: pointer; outline: none; min-width: 160px;
}
.filter-select:focus { border-color: var(--brand-main); }

@keyframes spin { to { transform: rotate(360deg); } }

.table thead tr { background: var(--sunken); border-bottom: 1px solid var(--line); }
.table th { padding: 14px 20px; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.table td { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid var(--sunken); vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }

.row-hover:hover { background: var(--sunken); }

.cell-main { display: flex; align-items: center; gap: 12px; }
.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: var(--ink-4); margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-sub--wide { max-width: 300px; }

.td-actions { text-align: right; }
/* Always visible: DataTable rows carry no hover class, and touch screens have no hover. */
.actions { display: flex; justify-content: flex-end; gap: 6px; }

.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; background: transparent; color: var(--ink-4);
}
.action-btn svg { width: 16px; height: 16px; }
.action-btn--edit:hover { background: #eff6ff; color: #2563eb; }
.action-btn--resolve:hover { background: #ecfdf5; color: #059669; }
.action-btn--reopen:hover { background: #eff6ff; color: #2563eb; }

.pagination-info strong { color: var(--ink); }
.pagination-btns { display: flex; gap: 4px; }

.pg-btn {
  padding: 6px 14px; border: 1px solid var(--line); border-radius: 8px;
  font-size: 13px; font-weight: 500; background: #fff; color: var(--ink-2);
  cursor: pointer; transition: all 0.15s;
}
.pg-btn:hover:not(:disabled) { background: var(--sunken); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-btn--active { background: var(--brand-main); color: #fff; border-color: var(--brand-main); }
.pg-btn--active:hover { background: var(--brand-dark); }

/* Modal content */
.modal-content { display: flex; flex-direction: column; gap: 16px; }
.modal-field { display: flex; flex-direction: column; gap: 4px; }
.modal-label { font-size: 12px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; }
.modal-message { margin: 0; line-height: 1.6; color: var(--ink-2); white-space: pre-wrap; }

.btn-cancel {
  padding: 9px 20px; border: 1px solid var(--line); border-radius: 8px;
  background: #fff; color: var(--ink-2); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: var(--sunken); }

@media (max-width: 600px) {
  }
</style>

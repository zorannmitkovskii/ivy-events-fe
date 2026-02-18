<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('admin.contacts.title') }}</h2>
        <p class="page-subtitle">{{ $t('admin.contacts.subtitle') }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="search" :placeholder="$t('admin.contacts.searchPh')" class="search-input" />
        </div>
        <select v-model="statusFilter" class="filter-select">
          <option value="">{{ $t('admin.contacts.allStatuses') }}</option>
          <option value="IN_REVIEW">{{ $t('admin.contacts.statusInReview') }}</option>
          <option value="RESOLVED">{{ $t('admin.contacts.statusResolved') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>{{ $t('admin.contacts.loading') }}</span>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('admin.contacts.thContact') }}</th>
              <th>{{ $t('admin.contacts.thSubject') }}</th>
              <th>{{ $t('admin.contacts.thMessage') }}</th>
              <th>{{ $t('admin.contacts.thStatus') }}</th>
              <th>{{ $t('admin.contacts.thDate') }}</th>
              <th class="th-right">{{ $t('admin.contacts.thActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="6" class="empty">{{ $t('admin.contacts.empty') }}</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover">
              <td>
                <div class="cell-main">
                  <div>
                    <div class="cell-title">{{ row.name || '—' }}</div>
                    <div class="text-sub">{{ row.email }}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="cell-title">{{ row.subject || '—' }}</div>
              </td>
              <td>
                <div class="text-sub text-sub--wide">{{ row.message || '—' }}</div>
              </td>
              <td>
                <span class="pill" :class="row.status === 'RESOLVED' ? 'pill--green' : 'pill--blue'">
                  {{ row.status === 'RESOLVED' ? $t('admin.contacts.statusResolved') : $t('admin.contacts.statusInReview') }}
                </span>
              </td>
              <td>
                <span class="text-sub">{{ formatDate(row.createdAt) }}</span>
              </td>
              <td class="td-actions">
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="filtered.length > 0" class="pagination-bar">
        <span class="pagination-info">
          Showing <strong>{{ startIndex }}</strong> - <strong>{{ endIndex }}</strong> of <strong>{{ filtered.length }}</strong>
        </span>
        <div class="pagination-btns">
          <button class="pg-btn" :disabled="page === 1" @click="prev">Previous</button>
          <button
            v-for="n in totalPages"
            :key="n"
            class="pg-btn"
            :class="{ 'pg-btn--active': n === page }"
            @click="goto(n)"
          >{{ n }}</button>
          <button class="pg-btn" :disabled="page === totalPages" @click="next">Next</button>
        </div>
      </div>
    </div>

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
          <span class="pill" :class="selectedRow.status === 'RESOLVED' ? 'pill--green' : 'pill--blue'">
            {{ selectedRow.status === 'RESOLVED' ? $t('admin.contacts.statusResolved') : $t('admin.contacts.statusInReview') }}
          </span>
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
import { ref, computed, onMounted, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { contactService } from "@/services/contact.service";

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

function next() { if (page.value < totalPages.value) page.value++; }
function prev() { if (page.value > 1) page.value--; }
function goto(n) { page.value = n; }

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
.admin-page { max-width: 1200px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 24px; font-weight: 700; color: var(--neutral-900); margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }

.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.toolbar-left { display: flex; gap: 12px; flex: 1; flex-wrap: wrap; }

.search-box { position: relative; flex: 1; max-width: 360px; min-width: 200px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #94a3b8; pointer-events: none; }
.search-input {
  width: 100%; padding: 9px 14px 9px 38px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

.filter-select {
  padding: 9px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; background: #fff; cursor: pointer; outline: none; min-width: 160px;
}
.filter-select:focus { border-color: var(--brand-main); }

.loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: #64748b; font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: var(--brand-main); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.table-card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
.table-wrap { overflow-x: auto; }

.table { width: 100%; border-collapse: collapse; text-align: left; }
.table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.table th { padding: 14px 20px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.th-right { text-align: right; }
.table td { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }

.row-hover { transition: background 0.15s; }
.row-hover:hover { background: #f8fafc; }
.empty { text-align: center; color: #94a3b8; padding: 40px 20px !important; }

.cell-main { display: flex; align-items: center; gap: 12px; }
.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-sub--wide { max-width: 300px; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--blue { background: #eff6ff; color: #2563eb; }
.pill--green { background: #ecfdf5; color: #059669; }

.td-actions { text-align: right; }
.actions { display: flex; justify-content: flex-end; gap: 6px; opacity: 0; transition: opacity 0.15s; }
.row-hover:hover .actions { opacity: 1; }

.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; background: transparent; color: #94a3b8;
}
.action-btn svg { width: 16px; height: 16px; }
.action-btn--edit:hover { background: #eff6ff; color: #2563eb; }
.action-btn--resolve:hover { background: #ecfdf5; color: #059669; }
.action-btn--reopen:hover { background: #eff6ff; color: #2563eb; }

.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid #e2e8f0; flex-wrap: wrap; gap: 12px; }
.pagination-info { font-size: 13px; color: #64748b; }
.pagination-info strong { color: #0f172a; }
.pagination-btns { display: flex; gap: 4px; }

.pg-btn {
  padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; font-weight: 500; background: #fff; color: #475569;
  cursor: pointer; transition: all 0.15s;
}
.pg-btn:hover:not(:disabled) { background: #f8fafc; }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-btn--active { background: var(--brand-main); color: #fff; border-color: var(--brand-main); }
.pg-btn--active:hover { background: var(--brand-dark); }

/* Modal content */
.modal-content { display: flex; flex-direction: column; gap: 16px; }
.modal-field { display: flex; flex-direction: column; gap: 4px; }
.modal-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.modal-message { margin: 0; line-height: 1.6; color: #334155; white-space: pre-wrap; }

.btn-cancel {
  padding: 9px 20px; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #475569; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: #f8fafc; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; }
}
</style>

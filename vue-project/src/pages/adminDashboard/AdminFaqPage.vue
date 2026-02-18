<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('admin.faq.title') }}</h2>
        <p class="page-subtitle">{{ $t('admin.faq.subtitle') }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="search" :placeholder="$t('admin.faq.searchPh')" class="search-input" />
        </div>
      </div>
      <button class="btn-add" @click="openCreate">+ {{ $t('admin.faq.addBtn') }}</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>{{ $t('admin.faq.loading') }}</span>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('admin.faq.thQuestion') }}</th>
              <th>{{ $t('admin.faq.thAnswer') }}</th>
              <th>{{ $t('admin.faq.thOrder') }}</th>
              <th>{{ $t('admin.faq.thActive') }}</th>
              <th class="th-right">{{ $t('admin.faq.thActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="5" class="empty">{{ $t('admin.faq.empty') }}</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover">
              <td>
                <div class="cell-title">{{ row.question || '—' }}</div>
              </td>
              <td>
                <div class="text-sub text-sub--wide">{{ truncate(row.answer, 80) }}</div>
              </td>
              <td>{{ row.displayOrder ?? '—' }}</td>
              <td>
                <span class="pill" :class="row.active ? 'pill--green' : 'pill--gray'">
                  {{ row.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="td-actions">
                <div class="actions">
                  <button class="action-btn action-btn--edit" @click="openEdit(row)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn action-btn--delete" @click="confirmDelete(row)" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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

    <!-- Create/Edit Modal -->
    <BaseModal :open="modalOpen" :title="isEditing ? $t('admin.faq.editTitle') : $t('admin.faq.createTitle')" @close="modalOpen = false">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">{{ $t('admin.faq.question') }}</label>
          <input type="text" v-model="form.question" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.faq.answer') }}</label>
          <textarea v-model="form.answer" class="form-textarea" rows="4"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ $t('admin.faq.displayOrder') }}</label>
            <input type="number" v-model.number="form.displayOrder" class="form-input" min="0" />
          </div>
          <div class="form-group form-check-group">
            <label class="form-check">
              <input type="checkbox" v-model="form.active" />
              <span>{{ $t('admin.faq.active') }}</span>
            </label>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="modalOpen = false">{{ $t('common.cancel') }}</button>
        <button class="btn-save" :disabled="saving" @click="saveForm">
          {{ saving ? '...' : $t('common.save') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { faqService } from "@/services/faq.service";

const items = ref([]);
const loading = ref(true);

async function fetchData() {
  loading.value = true;
  try {
    const data = await faqService.listAll();
    items.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load FAQs:", e);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);

/* ---- filters ---- */
const search = ref("");

watch(search, () => { page.value = 1; });

const filtered = computed(() => {
  if (!search.value) return items.value;
  const q = search.value.toLowerCase();
  return items.value.filter(r =>
    (r.question || "").toLowerCase().includes(q) ||
    (r.answer || "").toLowerCase().includes(q)
  );
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
const isEditing = ref(false);
const editingId = ref(null);
const saving = ref(false);

const form = ref({ question: "", answer: "", displayOrder: 0, active: true });

function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  form.value = { question: "", answer: "", displayOrder: 0, active: true };
  modalOpen.value = true;
}

function openEdit(row) {
  isEditing.value = true;
  editingId.value = row.id;
  form.value = {
    question: row.question || "",
    answer: row.answer || "",
    displayOrder: row.displayOrder ?? 0,
    active: row.active ?? true,
  };
  modalOpen.value = true;
}

async function saveForm() {
  if (saving.value) return;
  saving.value = true;
  try {
    if (isEditing.value) {
      await faqService.update(editingId.value, form.value);
    } else {
      await faqService.create(form.value);
    }
    modalOpen.value = false;
    await fetchData();
  } catch (e) {
    console.error("Failed to save FAQ:", e);
  } finally {
    saving.value = false;
  }
}

/* ---- delete ---- */
async function confirmDelete(row) {
  if (!window.confirm(`Delete "${row.question}"?`)) return;
  try {
    await faqService.remove(row.id);
    await fetchData();
  } catch (e) {
    console.error("Failed to delete FAQ:", e);
  }
}

function truncate(str, len) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
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

.btn-add {
  padding: 9px 18px; border: none; border-radius: 10px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-add:hover { filter: brightness(0.95); }

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

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-sub--wide { max-width: 300px; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--green { background: #ecfdf5; color: #059669; }
.pill--gray { background: #f1f5f9; color: #94a3b8; }

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
.action-btn--delete:hover { background: #fef2f2; color: #dc2626; }

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

/* Modal form */
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.form-input {
  padding: 9px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.form-textarea {
  padding: 9px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; background: #fff; outline: none; resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit;
}
.form-textarea:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.form-row { display: flex; gap: 16px; align-items: flex-end; }
.form-check-group { display: flex; align-items: center; padding-bottom: 4px; }
.form-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: #334155; }
.form-check input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--brand-main); cursor: pointer; }

.btn-cancel {
  padding: 9px 20px; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #475569; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: #f8fafc; }

.btn-save {
  padding: 9px 20px; border: none; border-radius: 8px;
  background: var(--brand-main); color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-save:hover { filter: brightness(0.95); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; }
  .form-row { flex-direction: column; }
}
</style>

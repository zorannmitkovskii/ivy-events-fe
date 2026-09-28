<template>
  <div class="admin-page">
    <!-- Header -->
    <PageHeader :title="$t('admin.faq.title')" :subtitle="$t('admin.faq.subtitle')" />

    <!-- Toolbar -->
    <Toolbar v-model:search="search" :search-placeholder="$t('admin.faq.searchPh')" />

    <DataTable
      :columns="columns"
      :rows="paginated"
      row-key="id"
      :loading="loading"
      :loading-label="$t('admin.faq.loading')"
      :empty-title="$t('admin.faq.empty')"
    >
      <template #cell-question="{ row }">
        <div class="cell-title">{{ row.question || '—' }}</div>
      </template>

      <template #cell-answer="{ row }">
        <div class="text-sub text-sub--wide">{{ truncate(row.answer, 80) }}</div>
      </template>

      <template #cell-displayOrder="{ row }">{{ row.displayOrder ?? '—' }}</template>

      <template #cell-active="{ row }">
        <StatusPill :tone="row.active ? 'ok' : 'neutral'">
          {{ row.active ? $t('admin.faq.statusActive') : $t('admin.faq.statusInactive') }}
        </StatusPill>
      </template>

      <template #cell-actions="{ row }">
        <div class="actions">
          <button class="action-btn action-btn--edit" @click="openEdit(row)" :title="$t('common.edit')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-btn action-btn--delete" @click="confirmDelete(row)" :title="$t('common.delete')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </template>

      <template v-if="filtered.length" #footer>
        <span>{{ $t('common.showingRange', { from: startIndex, to: endIndex, total: filtered.length }) }}</span>
        <span class="pagination-btns">
          <button class="pg-btn" :disabled="page === 1" @click="prev">{{ $t('userDirectory.previous') }}</button>
          <button
            v-for="n in totalPages"
            :key="n"
            class="pg-btn"
            :class="{ 'pg-btn--active': n === page }"
            @click="goto(n)"
          >{{ n }}</button>
          <button class="pg-btn" :disabled="page === totalPages" @click="next">{{ $t('userDirectory.next') }}</button>
        </span>
      </template>
    </DataTable>

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
import StatusPill from '@/components/ui/StatusPill.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Toolbar from '@/components/ui/Toolbar.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ref, computed, onMounted, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { faqService } from "@/services/faq.service";
import { useI18n } from 'vue-i18n';

const { t: tt } = useI18n();

const columns = computed(() => [
  { key: 'question', label: tt('admin.faq.thQuestion') },
  { key: 'answer', label: tt('admin.faq.thAnswer') },
  { key: 'displayOrder', label: tt('admin.faq.thOrder'), align: 'right' },
  { key: 'active', label: tt('admin.faq.thActive') },
  { key: 'actions', label: tt('admin.faq.thActions'), align: 'right' },
]);

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

.btn-add {
  padding: 9px 18px; border: none; border-radius: 10px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.15s;
}
.btn-add:hover { filter: brightness(0.95); }

.loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: var(--ink-3); font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2.5px solid var(--line); border-top-color: var(--brand-main); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.table-card { background: #fff; border-radius: 14px; border: 1px solid var(--line); box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
.table-wrap { overflow-x: auto; }

.table { width: 100%; border-collapse: collapse; text-align: left; }
.table thead tr { background: var(--sunken); border-bottom: 1px solid var(--line); }
.table th { padding: 14px 20px; font-size: 11px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.th-right { text-align: right; }
.table td { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid var(--sunken); vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }

.row-hover { transition: background 0.15s; }
.row-hover:hover { background: var(--sunken); }
.empty { text-align: center; color: var(--ink-4); padding: 40px 20px !important; }

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
.action-btn--delete:hover { background: #fef2f2; color: #dc2626; }

.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid var(--line); flex-wrap: wrap; gap: 12px; }
.pagination-info { font-size: 13px; color: var(--ink-3); }
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

/* Modal form */
.modal-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; }
.form-input {
  padding: 9px 14px; border: 1px solid var(--line); border-radius: 10px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.form-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.form-textarea {
  padding: 9px 14px; border: 1px solid var(--line); border-radius: 10px;
  font-size: 14px; background: #fff; outline: none; resize: vertical;
  transition: border-color 0.2s, box-shadow 0.2s; font-family: inherit;
}
.form-textarea:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.form-row { display: flex; gap: 16px; align-items: flex-end; }
.form-check-group { display: flex; align-items: center; padding-bottom: 4px; }
.form-check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: var(--ink-2); }
.form-check input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--brand-main); cursor: pointer; }

.btn-cancel {
  padding: 9px 20px; border: 1px solid var(--line); border-radius: 8px;
  background: #fff; color: var(--ink-2); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: var(--sunken); }

.btn-save {
  padding: 9px 20px; border: none; border-radius: 8px;
  background: var(--brand-main); color: #fff; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.btn-save:hover { filter: brightness(0.95); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 600px) {
    .form-row { flex-direction: column; }
}
</style>

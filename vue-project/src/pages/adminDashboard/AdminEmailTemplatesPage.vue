<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('admin.emailTemplates.title') }}</h2>
        <p class="page-subtitle">{{ $t('admin.emailTemplates.subtitle') }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="search" :placeholder="$t('admin.emailTemplates.searchPh')" class="search-input" />
        </div>
      </div>
      <button class="btn-add" @click="openCreate">+ {{ $t('admin.emailTemplates.addBtn') }}</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>{{ $t('admin.emailTemplates.loading') }}</span>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('admin.emailTemplates.thName') }}</th>
              <th>{{ $t('admin.emailTemplates.thSubject') }}</th>
              <th>{{ $t('admin.emailTemplates.thDescription') }}</th>
              <th>{{ $t('admin.emailTemplates.thCreatedAt') }}</th>
              <th class="th-right">{{ $t('admin.emailTemplates.thActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="5" class="empty">{{ $t('admin.emailTemplates.empty') }}</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover">
              <td>
                <div class="cell-title">{{ row.name || '—' }}</div>
              </td>
              <td>{{ row.subject || '—' }}</td>
              <td>
                <span class="text-sub">{{ truncate(row.description, 60) }}</span>
              </td>
              <td>
                <span class="text-sub">{{ formatDate(row.createdAt) }}</span>
              </td>
              <td class="td-actions">
                <div class="actions">
                  <button class="action-btn action-btn--view" @click="openPreview(row)" title="Preview">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="action-btn action-btn--edit" @click="openEdit(row)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn action-btn--upload" @click="openUpload(row)" title="Upload HTML">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
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

    <!-- Create Modal -->
    <BaseModal :open="createModalOpen" :title="$t('admin.emailTemplates.createTitle')" @close="createModalOpen = false">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.name') }}</label>
          <input type="text" v-model="createForm.name" class="form-input" placeholder="e.g. Welcome Email" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.subject') }}</label>
          <input type="text" v-model="createForm.subject" class="form-input" placeholder="e.g. Welcome to Ivy Events!" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.description') }}</label>
          <input type="text" v-model="createForm.description" class="form-input" placeholder="Optional description" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.htmlFile') }}</label>
          <div class="upload-area" @click="$refs.createFileInput?.click()">
            <input ref="createFileInput" type="file" accept=".html" class="file-input-hidden" @change="onCreateFileChange" />
            <div class="upload-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>{{ createFile ? createFile.name : $t('admin.emailTemplates.uploadHint') }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="createModalOpen = false">{{ $t('common.cancel') }}</button>
        <button class="btn-save" :disabled="saving" @click="saveCreate">
          {{ saving ? '...' : $t('common.save') }}
        </button>
      </template>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal :open="editModalOpen" :title="$t('admin.emailTemplates.editTitle')" @close="editModalOpen = false">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.name') }}</label>
          <input type="text" v-model="editForm.name" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.subject') }}</label>
          <input type="text" v-model="editForm.subject" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.description') }}</label>
          <input type="text" v-model="editForm.description" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.htmlContent') }}</label>
          <textarea v-model="editForm.htmlContent" class="form-input form-textarea" rows="10"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="editModalOpen = false">{{ $t('common.cancel') }}</button>
        <button class="btn-save" :disabled="saving" @click="saveEdit">
          {{ saving ? '...' : $t('common.save') }}
        </button>
      </template>
    </BaseModal>

    <!-- Upload HTML Modal -->
    <BaseModal :open="uploadModalOpen" :title="$t('admin.emailTemplates.replaceFile')" @close="uploadModalOpen = false">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">{{ $t('admin.emailTemplates.htmlFile') }}</label>
          <div class="upload-area" @click="$refs.uploadFileInput?.click()">
            <input ref="uploadFileInput" type="file" accept=".html" class="file-input-hidden" @change="onUploadFileChange" />
            <div class="upload-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>{{ uploadFile ? uploadFile.name : $t('admin.emailTemplates.uploadHint') }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="uploadModalOpen = false">{{ $t('common.cancel') }}</button>
        <button class="btn-save" :disabled="saving || !uploadFile" @click="saveUpload">
          {{ saving ? '...' : $t('common.save') }}
        </button>
      </template>
    </BaseModal>

    <!-- Preview Modal -->
    <BaseModal :open="previewModalOpen" :title="$t('admin.emailTemplates.previewTitle')" @close="previewModalOpen = false">
      <iframe
        v-if="previewHtml"
        :srcdoc="previewHtml"
        sandbox="allow-same-origin"
        class="preview-iframe"
      ></iframe>
      <p v-else class="text-sub" style="padding: 20px; text-align: center;">No HTML content</p>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { emailTemplateService } from "@/services/emailTemplate.service";

const items = ref([]);
const loading = ref(true);

async function fetchData() {
  loading.value = true;
  try {
    const data = await emailTemplateService.listAll();
    items.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load email templates:", e);
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
  let result = items.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(r =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.subject || "").toLowerCase().includes(q)
    );
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

/* ---- helpers ---- */
function truncate(str, len) {
  if (!str) return "—";
  return str.length > len ? str.slice(0, len) + "…" : str;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString();
  } catch {
    return dateStr;
  }
}

/* ---- create modal ---- */
const createModalOpen = ref(false);
const createForm = ref({ name: "", subject: "", description: "" });
const createFile = ref(null);
const saving = ref(false);

function openCreate() {
  createForm.value = { name: "", subject: "", description: "" };
  createFile.value = null;
  createModalOpen.value = true;
}

function onCreateFileChange(e) {
  const file = e.target.files?.[0];
  if (file) createFile.value = file;
}

async function saveCreate() {
  if (saving.value) return;
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append("name", createForm.value.name);
    fd.append("subject", createForm.value.subject);
    fd.append("description", createForm.value.description);
    if (createFile.value) {
      fd.append("file", createFile.value);
    }
    await emailTemplateService.create(fd);
    createModalOpen.value = false;
    await fetchData();
  } catch (e) {
    console.error("Failed to create email template:", e);
  } finally {
    saving.value = false;
  }
}

/* ---- edit modal ---- */
const editModalOpen = ref(false);
const editingId = ref(null);
const editForm = ref({ name: "", subject: "", description: "", htmlContent: "" });

function openEdit(row) {
  editingId.value = row.id;
  editForm.value = {
    name: row.name || "",
    subject: row.subject || "",
    description: row.description || "",
    htmlContent: row.htmlContent || "",
  };
  editModalOpen.value = true;
}

async function saveEdit() {
  if (saving.value) return;
  saving.value = true;
  try {
    await emailTemplateService.update(editingId.value, {
      name: editForm.value.name,
      subject: editForm.value.subject,
      description: editForm.value.description,
      htmlContent: editForm.value.htmlContent,
    });
    editModalOpen.value = false;
    await fetchData();
  } catch (e) {
    console.error("Failed to update email template:", e);
  } finally {
    saving.value = false;
  }
}

/* ---- upload modal ---- */
const uploadModalOpen = ref(false);
const uploadingId = ref(null);
const uploadFile = ref(null);

function openUpload(row) {
  uploadingId.value = row.id;
  uploadFile.value = null;
  uploadModalOpen.value = true;
}

function onUploadFileChange(e) {
  const file = e.target.files?.[0];
  if (file) uploadFile.value = file;
}

async function saveUpload() {
  if (saving.value || !uploadFile.value) return;
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append("file", uploadFile.value);
    await emailTemplateService.uploadHtml(uploadingId.value, fd);
    uploadModalOpen.value = false;
    await fetchData();
  } catch (e) {
    console.error("Failed to upload HTML:", e);
  } finally {
    saving.value = false;
  }
}

/* ---- preview modal ---- */
const previewModalOpen = ref(false);
const previewHtml = ref("");

function openPreview(row) {
  previewHtml.value = row.htmlContent || "";
  previewModalOpen.value = true;
}

/* ---- delete ---- */
async function confirmDelete(row) {
  if (!window.confirm(`Delete "${row.name}"?`)) return;
  try {
    await emailTemplateService.remove(row.id);
    await fetchData();
  } catch (e) {
    console.error("Failed to delete email template:", e);
  }
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
  transition: background 0.15s; white-space: nowrap;
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
.text-sub { font-size: 13px; color: #94a3b8; }

.td-actions { text-align: right; }
.actions { display: flex; justify-content: flex-end; gap: 6px; opacity: 0; transition: opacity 0.15s; }
.row-hover:hover .actions { opacity: 1; }

.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; background: transparent; color: #94a3b8;
}
.action-btn svg { width: 16px; height: 16px; }
.action-btn--view:hover { background: #f0fdf4; color: #16a34a; }
.action-btn--edit:hover { background: #eff6ff; color: #2563eb; }
.action-btn--upload:hover { background: #fefce8; color: #ca8a04; }
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
.form-textarea { font-family: monospace; font-size: 13px; resize: vertical; min-height: 200px; }

.upload-area {
  border: 2px dashed #e2e8f0; border-radius: 10px; padding: 16px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.2s, background 0.2s;
  min-height: 80px;
}
.upload-area:hover { border-color: var(--brand-main); background: #f8fafc; }
.file-input-hidden { display: none; }
.upload-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  color: #94a3b8; font-size: 13px;
}

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

.preview-iframe {
  width: 100%; min-height: 400px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff;
}

@media (max-width: 600px) {
  .page-header { flex-direction: column; }
}
</style>

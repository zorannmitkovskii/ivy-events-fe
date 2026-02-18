<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('admin.invitationTemplates.title') }}</h2>
        <p class="page-subtitle">{{ $t('admin.invitationTemplates.subtitle') }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="search" :placeholder="$t('admin.invitationTemplates.searchPh')" class="search-input" />
        </div>
        <select v-model="categoryFilter" class="filter-select">
          <option value="">{{ $t('admin.invitationTemplates.allCategories') }}</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
      <button class="btn-add" @click="openCreate">+ {{ $t('admin.invitationTemplates.addBtn') }}</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>{{ $t('admin.invitationTemplates.loading') }}</span>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('admin.invitationTemplates.thThumbnail') }}</th>
              <th>{{ $t('admin.invitationTemplates.thName') }}</th>
              <th>{{ $t('admin.invitationTemplates.thPath') }}</th>
              <th>{{ $t('admin.invitationTemplates.thCategory') }}</th>
              <th>{{ $t('admin.invitationTemplates.thActive') }}</th>
              <th class="th-right">{{ $t('admin.invitationTemplates.thActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="6" class="empty">{{ $t('admin.invitationTemplates.empty') }}</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover">
              <td>
                <img
                  v-if="row.thumbnailImage"
                  :src="row.thumbnailImage"
                  :alt="row.name"
                  class="thumbnail"
                />
                <div v-else class="thumbnail-placeholder">—</div>
              </td>
              <td>
                <div class="cell-title">{{ row.name || '—' }}</div>
              </td>
              <td>
                <span class="text-mono">{{ buildFullPath(row.path) }}</span>
              </td>
              <td>
                <span class="pill pill--blue">{{ row.eventCategory || '—' }}</span>
              </td>
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
    <BaseModal :open="modalOpen" :title="isEditing ? $t('admin.invitationTemplates.editTitle') : $t('admin.invitationTemplates.createTitle')" @close="modalOpen = false">
      <div class="modal-form">
        <div class="form-group">
          <label class="form-label">{{ $t('admin.invitationTemplates.name') }}</label>
          <input type="text" v-model="form.name" class="form-input" placeholder="e.g. Persian Wedding" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.invitationTemplates.path') }}</label>
          <input type="text" v-model="form.path" class="form-input" placeholder="e.g. invitations/persian-wedding" />
          <span class="form-hint">{{ $t('admin.invitationTemplates.pathHint') }}: /{{ lang }}/{{ form.path || '...' }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.invitationTemplates.thumbnailImage') }}</label>
          <div class="upload-area" @click="triggerFileInput">
            <input ref="fileInput" type="file" accept="image/*" class="file-input-hidden" @change="onFileChange" />
            <img v-if="thumbnailPreview" :src="thumbnailPreview" class="thumbnail-preview-lg" />
            <div v-else class="upload-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>Click to upload image</span>
            </div>
          </div>
          <button v-if="thumbnailPreview" type="button" class="btn-remove-thumb" @click.stop="removeThumbnail">Remove image</button>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('admin.invitationTemplates.category') }}</label>
          <select v-model="form.eventCategory" class="form-input">
            <option value="" disabled>Select category</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="form-group form-check-group">
          <label class="form-check">
            <input type="checkbox" v-model="form.active" />
            <span>{{ $t('admin.invitationTemplates.active') }}</span>
          </label>
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
import { useRoute } from "vue-router";
import BaseModal from "@/components/ui/BaseModal.vue";
import { invitationTemplateService } from "@/services/invitationTemplate.service";
import { EventCategoryEnum } from "@/enums/EventCategory";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const categories = Object.values(EventCategoryEnum);

const items = ref([]);
const loading = ref(true);

async function fetchData() {
  loading.value = true;
  try {
    const data = await invitationTemplateService.listAll();
    items.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load invitation templates:", e);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);

/* ---- filters ---- */
const search = ref("");
const categoryFilter = ref("");

watch([search, categoryFilter], () => { page.value = 1; });

const filtered = computed(() => {
  let result = items.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(r =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.path || "").toLowerCase().includes(q)
    );
  }
  if (categoryFilter.value) {
    result = result.filter(r => r.eventCategory === categoryFilter.value);
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

/* ---- path helper ---- */
function buildFullPath(path) {
  if (!path) return "—";
  return `/${lang.value}/${path}`;
}

/* ---- modal ---- */
const modalOpen = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const saving = ref(false);

const form = ref({ name: "", path: "", thumbnailImage: "", eventCategory: "", active: true });
const thumbnailFile = ref(null);
const fileInput = ref(null);

const thumbnailPreview = computed(() => {
  if (thumbnailFile.value) return URL.createObjectURL(thumbnailFile.value);
  return form.value.thumbnailImage || "";
});

function triggerFileInput() {
  fileInput.value?.click();
}

function onFileChange(e) {
  const file = e.target.files?.[0];
  if (file) {
    thumbnailFile.value = file;
  }
}

function removeThumbnail() {
  thumbnailFile.value = null;
  form.value.thumbnailImage = "";
  if (fileInput.value) fileInput.value.value = "";
}

function openCreate() {
  isEditing.value = false;
  editingId.value = null;
  form.value = { name: "", path: "", thumbnailImage: "", eventCategory: "", active: true };
  thumbnailFile.value = null;
  modalOpen.value = true;
}

function openEdit(row) {
  isEditing.value = true;
  editingId.value = row.id;
  form.value = {
    name: row.name || "",
    path: row.path || "",
    thumbnailImage: row.thumbnailImage || "",
    eventCategory: row.eventCategory || "",
    active: row.active ?? true,
  };
  thumbnailFile.value = null;
  modalOpen.value = true;
}

function buildFormData() {
  const fd = new FormData();
  fd.append("name", form.value.name);
  fd.append("path", form.value.path);
  fd.append("eventCategory", form.value.eventCategory);
  fd.append("active", String(form.value.active));
  if (thumbnailFile.value) {
    fd.append("thumbnail", thumbnailFile.value);
  }
  return fd;
}

async function saveForm() {
  if (saving.value) return;
  saving.value = true;
  try {
    const fd = buildFormData();
    const config = { headers: { "Content-Type": "multipart/form-data" } };
    if (isEditing.value) {
      await invitationTemplateService.update(editingId.value, fd, config);
    } else {
      await invitationTemplateService.create(fd, config);
    }
    modalOpen.value = false;
    await fetchData();
  } catch (e) {
    console.error("Failed to save invitation template:", e);
  } finally {
    saving.value = false;
  }
}

/* ---- delete ---- */
async function confirmDelete(row) {
  if (!window.confirm(`Delete "${row.name}"?`)) return;
  try {
    await invitationTemplateService.remove(row.id);
    await fetchData();
  } catch (e) {
    console.error("Failed to delete invitation template:", e);
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

.filter-select {
  padding: 9px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; background: #fff; cursor: pointer; outline: none; min-width: 160px;
}
.filter-select:focus { border-color: var(--brand-main); }

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

.thumbnail { width: 56px; height: 40px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }
.thumbnail-placeholder { width: 56px; height: 40px; border-radius: 6px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 12px; }

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-mono { font-size: 13px; color: #64748b; font-family: monospace; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--blue { background: #eff6ff; color: #2563eb; }

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
.form-hint { font-size: 12px; color: #94a3b8; margin-top: 2px; }

.upload-area {
  border: 2px dashed #e2e8f0; border-radius: 10px; padding: 16px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.2s, background 0.2s;
  min-height: 100px;
}
.upload-area:hover { border-color: var(--brand-main); background: #f8fafc; }
.file-input-hidden { display: none; }
.upload-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  color: #94a3b8; font-size: 13px;
}
.thumbnail-preview-lg { max-width: 160px; max-height: 120px; border-radius: 8px; object-fit: cover; }
.btn-remove-thumb {
  margin-top: 6px; padding: 4px 10px; border: 1px solid #e2e8f0; border-radius: 6px;
  background: #fff; color: #dc2626; font-size: 12px; cursor: pointer;
  transition: all 0.15s;
}
.btn-remove-thumb:hover { background: #fef2f2; border-color: #fecaca; }

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
}
</style>

<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Packages</h2>
        <p class="page-subtitle">Manage subscription packages and pricing</p>
      </div>
      <button class="btn-create" @click="openCreate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Create Package
      </button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="nameSearch" placeholder="Search packages..." class="search-input" />
        </div>
        <select v-model="selectedCategory" class="filter-select">
          <option value="">All Categories</option>
          <option v-for="cat in packageCategoryOptions" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading packages...</span>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Package Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Price</th>
              <th>Discount</th>
              <th class="th-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="6" class="empty">No packages found</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover">
              <td>
                <div class="cell-main">
                  <div class="icon-box icon-box--purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4A2 2 0 0 1 2 16.76V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/><path d="M2.32 6.16L12 11l9.68-4.84"/><path d="M12 22.76V11"/></svg>
                  </div>
                  <div>
                    <div class="cell-title">{{ row.name || '—' }}</div>
                    <div class="text-sub">{{ row.description || `ID: ${row.id}` }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="pill pill--blue">{{ row.packageCategory || '—' }}</span>
              </td>
              <td>
                <span class="pill pill--gray">{{ row.packageType || '—' }}</span>
              </td>
              <td>
                <span class="price">{{ row.price != null ? `${row.price} ${row.currency || 'MKD'}` : '—' }}</span>
              </td>
              <td>
                <template v-if="row.activeDiscount && row.discount">
                  <span class="pill pill--green">{{ row.discount }}%</span>
                </template>
                <template v-else>—</template>
              </td>
              <td class="td-actions">
                <div class="actions">
                  <button class="action-btn action-btn--edit" @click="openEdit(row)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="action-btn action-btn--danger" @click="remove(row)" title="Delete">
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

    <!-- Create/Edit Dialog -->
    <div v-if="dialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ editingId ? 'Edit Package' : 'Create Package' }}</h3>
          <button class="dialog-close" @click="closeDialog">&times;</button>
        </div>

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Name <span class="req">*</span></label>
              <input v-model="form.name" type="text" placeholder="e.g. Wedding Premium" class="form-input" />
            </div>

            <div class="form-group">
              <label>Description</label>
              <input v-model="form.description" type="text" placeholder="Short description" class="form-input" />
            </div>

            <div class="form-group">
              <label>Package Category <span class="req">*</span></label>
              <select v-model="form.packageCategory" class="form-input">
                <option value="" disabled>Select category</option>
                <option v-for="cat in packageCategoryOptions" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Package Type <span class="req">*</span></label>
              <select v-model="form.packageType" class="form-input">
                <option value="" disabled>Select type</option>
                <option v-for="pt in packageTypeOptions" :key="pt" :value="pt">{{ pt }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>Price <span class="req">*</span></label>
              <input v-model.number="form.price" type="number" step="0.01" min="0" placeholder="0.00" class="form-input" />
            </div>

            <div class="form-group">
              <label>Currency</label>
              <select v-model="form.currency" class="form-input">
                <option value="MKD">MKD</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div class="form-group">
              <label>Discount (%)</label>
              <input v-model.number="form.discount" type="number" step="0.01" min="0" max="100" placeholder="0" class="form-input" />
            </div>

            <div class="form-group form-group--check">
              <label class="check-label">
                <input v-model="form.activeDiscount" type="checkbox" />
                Active Discount
              </label>
            </div>
          </div>

          <!-- Features -->
          <div class="features-section">
            <div class="features-header">
              <label>Features</label>
              <button class="btn-add-feature" @click="addFeature">+ Add Feature</button>
            </div>
            <div v-for="(feat, i) in form.features" :key="i" class="feature-row">
              <input v-model="feat.name" type="text" placeholder="Feature name" class="form-input feature-input" />
              <input v-model="feat.description" type="text" placeholder="Description (optional)" class="form-input feature-input" />
              <button class="btn-remove-feature" @click="form.features.splice(i, 1)" title="Remove">&times;</button>
            </div>
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDialog">Cancel</button>
          <button class="btn-save" :disabled="saving" @click="save">
            {{ saving ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { packageService } from "@/services/package.service";
import { PackageCategoryEnum } from "@/enums/PackageCategory";
import { PackageTypeEnum } from "@/enums/PackageType";

const packageCategoryOptions = Object.values(PackageCategoryEnum);
const packageTypeOptions = Object.values(PackageTypeEnum);

const packages = ref([]);
const loading = ref(true);

async function fetchPackages() {
  loading.value = true;
  try {
    const data = await packageService.list();
    packages.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load packages:", e);
    packages.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchPackages);

/* ---- filters ---- */
const nameSearch = ref("");
const selectedCategory = ref("");

watch([nameSearch, selectedCategory], () => { page.value = 1; });

const filtered = computed(() => {
  let result = packages.value;
  if (nameSearch.value) {
    const q = nameSearch.value.toLowerCase();
    result = result.filter(p => (p.name || "").toLowerCase().includes(q));
  }
  if (selectedCategory.value) {
    result = result.filter(p => p.packageCategory === selectedCategory.value);
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

/* ---- dialog ---- */
const dialogOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref("");

const defaultForm = () => ({
  name: "",
  description: "",
  price: null,
  currency: "MKD",
  discount: null,
  activeDiscount: false,
  packageType: "",
  packageCategory: "",
  features: [],
});

const form = ref(defaultForm());

function openCreate() {
  editingId.value = null;
  form.value = defaultForm();
  formError.value = "";
  dialogOpen.value = true;
}

function openEdit(pkg) {
  editingId.value = pkg.id;
  form.value = {
    name: pkg.name || "",
    description: pkg.description || "",
    price: pkg.price ?? null,
    currency: pkg.currency || "MKD",
    discount: pkg.discount ?? null,
    activeDiscount: !!pkg.activeDiscount,
    packageType: pkg.packageType || "",
    packageCategory: pkg.packageCategory || "",
    features: Array.isArray(pkg.features)
      ? pkg.features.map(f => ({ name: f.name || "", description: f.description || "" }))
      : [],
  };
  formError.value = "";
  dialogOpen.value = true;
}

function closeDialog() {
  dialogOpen.value = false;
  editingId.value = null;
  formError.value = "";
}

function addFeature() {
  form.value.features.push({ name: "", description: "" });
}

async function save() {
  formError.value = "";

  if (!form.value.name.trim()) { formError.value = "Name is required"; return; }
  if (!form.value.packageCategory) { formError.value = "Category is required"; return; }
  if (!form.value.packageType) { formError.value = "Type is required"; return; }
  if (form.value.price == null || form.value.price < 0) { formError.value = "Price must be 0 or greater"; return; }

  const payload = {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    price: form.value.price,
    currency: form.value.currency,
    discount: form.value.discount ?? 0,
    activeDiscount: form.value.activeDiscount,
    packageType: form.value.packageType,
    packageCategory: form.value.packageCategory,
    features: form.value.features
      .filter(f => f.name.trim())
      .map(f => ({ name: f.name.trim(), description: f.description.trim() })),
  };

  saving.value = true;
  try {
    if (editingId.value) {
      const updated = await packageService.update(editingId.value, payload);
      const idx = packages.value.findIndex(p => p.id === editingId.value);
      if (idx !== -1) packages.value[idx] = { ...packages.value[idx], ...updated };
    } else {
      const created = await packageService.create(payload);
      packages.value.unshift(created);
    }
    closeDialog();
  } catch (e) {
    formError.value = e.message || "Failed to save package";
  } finally {
    saving.value = false;
  }
}

/* ---- delete ---- */
async function remove(pkg) {
  if (!confirm(`Delete package "${pkg.name}"?`)) return;
  try {
    await packageService.remove(pkg.id);
    packages.value = packages.value.filter(p => p.id !== pkg.id);
  } catch (e) {
    console.error("Failed to delete package:", e);
  }
}
</script>

<style scoped>
.admin-page { max-width: 1200px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 24px; font-weight: 700; color: var(--neutral-900); margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }

.btn-create {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border: none; border-radius: 10px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
}
.btn-create:hover { background: var(--brand-dark); }

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
.icon-box { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.icon-box svg { width: 18px; height: 18px; }
.icon-box--purple { background: #f3e8ff; color: #7c3aed; }

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--blue { background: #eff6ff; color: #2563eb; }
.pill--gray { background: #f1f5f9; color: #475569; }
.pill--green { background: #ecfdf5; color: #059669; }

.price { font-weight: 700; color: #0f172a; font-size: 15px; }

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
.action-btn--danger:hover { background: #fef2f2; color: #dc2626; }

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

/* ---- Dialog ---- */
.dialog-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}

.dialog {
  background: #fff; border-radius: 16px;
  width: 100%; max-width: 620px; max-height: 90vh;
  display: flex; flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.dialog-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
}
.dialog-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
.dialog-close {
  background: none; border: none; font-size: 24px; color: #94a3b8;
  cursor: pointer; line-height: 1; padding: 0;
}
.dialog-close:hover { color: #475569; }

.dialog-body {
  padding: 24px; overflow-y: auto; flex: 1;
}

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}

.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #dc2626; }

.form-input {
  padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--brand-main); }

.form-group--check { display: flex; align-items: flex-end; }
.check-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 500; color: #475569; cursor: pointer;
}
.check-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }

/* Features */
.features-section { margin-top: 20px; }
.features-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.features-header label { font-size: 13px; font-weight: 600; color: #475569; }

.btn-add-feature {
  background: none; border: 1px dashed #cbd5e1; border-radius: 6px;
  padding: 4px 12px; font-size: 13px; font-weight: 500; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.btn-add-feature:hover { border-color: var(--brand-main); color: var(--brand-main); }

.feature-row {
  display: flex; gap: 8px; align-items: center; margin-bottom: 8px;
}
.feature-input { flex: 1; }
.btn-remove-feature {
  background: none; border: none; font-size: 20px; color: #94a3b8;
  cursor: pointer; line-height: 1; padding: 4px;
}
.btn-remove-feature:hover { color: #dc2626; }

.form-error {
  margin-top: 12px; padding: 8px 12px; background: #fef2f2;
  border: 1px solid #fecaca; border-radius: 8px;
  color: #dc2626; font-size: 13px; font-weight: 500;
}

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #e2e8f0;
}

.btn-cancel {
  padding: 9px 20px; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #475569; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: #f8fafc; }

.btn-save {
  padding: 9px 24px; border: none; border-radius: 8px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
}
.btn-save:hover:not(:disabled) { background: var(--brand-dark); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; }
}
</style>

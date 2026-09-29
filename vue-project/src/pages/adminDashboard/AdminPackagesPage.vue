<template>
  <div class="admin-page">
    <!-- Header -->
    <PageHeader :title="t('adminPackages.title')" :subtitle="t('adminPackages.subtitle')">
      <template #actions>
        <button class="btn-create" @click="openCreate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Create Package
        </button>
      </template>
    </PageHeader>

    <!-- Toolbar -->
    <Toolbar v-model:search="nameSearch" :search-placeholder="t('adminPackages.search')">
      <template #filters>
        <select v-model="selectedCategory" class="filter-select">
        <option value="">{{ t('adminPackages.allCategories') }}</option>
        <option v-for="cat in packageCategoryOptions" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </template>
    </Toolbar>

<!-- Table Card -->
    <DataTable
      :columns="columns"
      :rows="paginated"
      row-key="id"
      :loading="loading"
      :empty-title="t('adminPackages.empty')"
    >
      <template #cell-packageName="{ row }">
        <div class="cell-main">
        <div class="icon-box icon-box--purple">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.89 1.45l8 4A2 2 0 0 1 22 7.24v9.53a2 2 0 0 1-1.11 1.79l-8 4a2 2 0 0 1-1.79 0l-8-4A2 2 0 0 1 2 16.76V7.24a2 2 0 0 1 1.11-1.79l8-4a2 2 0 0 1 1.78 0z"/><path d="M2.32 6.16L12 11l9.68-4.84"/><path d="M12 22.76V11"/></svg>
        </div>
        <div>
        <div class="cell-title">{{ row.name || '—' }}</div>
        <div class="text-sub">{{ row.description || `ID: ${row.id}` }}</div>
        </div>
        </div>
      </template>

      <template #cell-category="{ row }">
        <StatusPill tone="info">{{ row.packageCategory || '—' }}</StatusPill>
      </template>

      <template #cell-type="{ row }">
        <StatusPill tone="neutral">{{ row.packageType || '—' }}</StatusPill>
      </template>

      <template #cell-price="{ row }">
        <span class="price">{{ row.price != null ? `${row.price} ${row.currency || 'MKD'}` : '—' }}</span>
      </template>

      <template #cell-discount="{ row }">
        <template v-if="row.activeDiscount && row.discount">
        <StatusPill tone="ok">{{ row.discount }}%</StatusPill>
        </template>
        <template v-else>—</template>
      </template>

      <template #cell-actions="{ row }">
        <div class="actions">
        <button class="action-btn action-btn--edit" @click="openEdit(row)" :title="t('adminPackages.edit')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="action-btn action-btn--danger" @click="remove(row)" :title="t('adminPackages.delete')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
        </div>
      </template>
      <template v-if="filtered.length" #footer>
        <ListPager v-model:page="page" :total-pages="totalPages" :from="startIndex" :to="endIndex" :total="filtered.length" />
      </template>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <div v-if="dialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ editingId ? 'Edit Package' : 'Create Package' }}</h3>
          <button class="dialog-close" @click="closeDialog">&times;</button>
        </div>

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group form-group--full">
              <label>{{ t('adminPackages.name') }} <span class="req">*</span></label>
              <input v-model="form.name" type="text" :placeholder="t('adminPackages.namePlaceholder')" class="form-input" />
              <div class="i18n-group">
                <div class="i18n-field">
                  <span class="i18n-tag">EN</span>
                  <input v-model="form.nameI18n.en" type="text" :placeholder="t('adminPackages.englishName')" class="form-input" />
                </div>
                <div class="i18n-field">
                  <span class="i18n-tag">MK</span>
                  <input v-model="form.nameI18n.mk" type="text" placeholder="Македонски назив" class="form-input" />
                </div>
                <div class="i18n-field">
                  <span class="i18n-tag">SQ</span>
                  <input v-model="form.nameI18n.sq" type="text" placeholder="Emri shqip" class="form-input" />
                </div>
              </div>
            </div>

            <div class="form-group form-group--full">
              <label>{{ t('adminPackages.description') }}</label>
              <input v-model="form.description" type="text" :placeholder="t('adminPackages.shortDescription')" class="form-input" />
              <div class="i18n-group">
                <div class="i18n-field">
                  <span class="i18n-tag">EN</span>
                  <input v-model="form.descriptionI18n.en" type="text" :placeholder="t('adminPackages.englishDescription')" class="form-input" />
                </div>
                <div class="i18n-field">
                  <span class="i18n-tag">MK</span>
                  <input v-model="form.descriptionI18n.mk" type="text" placeholder="Опис на македонски" class="form-input" />
                </div>
                <div class="i18n-field">
                  <span class="i18n-tag">SQ</span>
                  <input v-model="form.descriptionI18n.sq" type="text" placeholder="Përshkrimi shqip" class="form-input" />
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('adminPackages.packageCategory') }} <span class="req">*</span></label>
              <select v-model="form.packageCategory" class="form-input">
                <option value="" disabled>{{ t('adminPackages.selectCategory') }}</option>
                <option v-for="cat in packageCategoryOptions" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t('adminPackages.packageType') }} <span class="req">*</span></label>
              <select v-model="form.packageType" class="form-input">
                <option value="" disabled>{{ t('adminPackages.selectType') }}</option>
                <option v-for="pt in packageTypeOptions" :key="pt" :value="pt">{{ pt }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ t('adminPackages.price') }} <span class="req">*</span></label>
              <input v-model.number="form.price" type="number" step="0.01" min="0" placeholder="0.00" class="form-input" />
            </div>

            <div class="form-group">
              <label>{{ t('adminPackages.currency') }}</label>
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
              <label>{{ t('adminPackages.features') }}</label>
              <button class="btn-add-feature" @click="addFeature">+ Add Feature</button>
            </div>
            <div v-for="(feat, i) in form.features" :key="i" class="feature-card">
              <div class="feature-card-head">
                <span class="feature-num">#{{ i + 1 }}</span>
                <label class="check-label check-label--sm">
                  <input v-model="feat.included" type="checkbox" />
                  Included
                </label>
                <button class="btn-remove-feature" @click="form.features.splice(i, 1)" :title="t('adminPackages.removeRow')">&times;</button>
              </div>
              <div class="feature-fields">
                <div class="form-group">
                  <label>{{ t('adminPackages.name') }}</label>
                  <input v-model="feat.name" type="text" :placeholder="t('adminPackages.featureName')" class="form-input" />
                  <div class="i18n-group">
                    <div class="i18n-field">
                      <span class="i18n-tag">EN</span>
                      <input v-model="feat.nameI18n.en" type="text" placeholder="EN" class="form-input" />
                    </div>
                    <div class="i18n-field">
                      <span class="i18n-tag">MK</span>
                      <input v-model="feat.nameI18n.mk" type="text" placeholder="MK" class="form-input" />
                    </div>
                    <div class="i18n-field">
                      <span class="i18n-tag">SQ</span>
                      <input v-model="feat.nameI18n.sq" type="text" placeholder="SQ" class="form-input" />
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label>{{ t('adminPackages.description') }}</label>
                  <input v-model="feat.description" type="text" :placeholder="t('adminPackages.descriptionOptional')" class="form-input" />
                  <div class="i18n-group">
                    <div class="i18n-field">
                      <span class="i18n-tag">EN</span>
                      <input v-model="feat.descriptionI18n.en" type="text" placeholder="EN" class="form-input" />
                    </div>
                    <div class="i18n-field">
                      <span class="i18n-tag">MK</span>
                      <input v-model="feat.descriptionI18n.mk" type="text" placeholder="MK" class="form-input" />
                    </div>
                    <div class="i18n-field">
                      <span class="i18n-tag">SQ</span>
                      <input v-model="feat.descriptionI18n.sq" type="text" placeholder="SQ" class="form-input" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDialog">{{ t('adminPackages.cancel') }}</button>
          <button class="btn-save" :disabled="saving" @click="save">
            {{ saving ? 'Saving...' : (editingId ? 'Update' : 'Create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import DataTable from '@/components/ui/DataTable.vue'
import ListPager from '@/components/ui/ListPager.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import Toolbar from '@/components/ui/Toolbar.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useI18n } from "vue-i18n";

const { t: tt } = useI18n()

const columns = computed(() => [
  { key: 'packageName', label: tt('adminPackages.packageName') },
  { key: 'category', label: tt('adminPackages.category') },
  { key: 'type', label: tt('adminPackages.type') },
  { key: 'price', label: tt('adminPackages.price') },
  { key: 'discount', label: tt('adminPackages.discount') },
  { key: 'actions', label: tt('adminPackages.actions'), align: 'right' },
])

const { t } = useI18n();
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


/* ---- dialog ---- */
const dialogOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref("");

const emptyI18n = () => ({ en: "", mk: "", sq: "" });

const defaultForm = () => ({
  name: "",
  description: "",
  nameI18n: emptyI18n(),
  descriptionI18n: emptyI18n(),
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

async function openEdit(pkg) {
  editingId.value = pkg.id;
  formError.value = "";
  form.value = defaultForm();
  dialogOpen.value = true;

  try {
    const full = await packageService.getById(pkg.id);
    form.value = {
      name: full.name || "",
      description: full.description || "",
      nameI18n: { en: full.nameI18n?.en || "", mk: full.nameI18n?.mk || "", sq: full.nameI18n?.sq || "" },
      descriptionI18n: { en: full.descriptionI18n?.en || "", mk: full.descriptionI18n?.mk || "", sq: full.descriptionI18n?.sq || "" },
      price: full.price ?? null,
      currency: full.currency || "MKD",
      discount: full.discount ?? null,
      activeDiscount: !!full.activeDiscount,
      packageType: full.packageType || "",
      packageCategory: full.packageCategory || "",
      features: Array.isArray(full.features)
        ? full.features.map(f => ({
            id: f.id || null,
            name: f.name || "",
            description: f.description || "",
            nameI18n: { en: f.nameI18n?.en || "", mk: f.nameI18n?.mk || "", sq: f.nameI18n?.sq || "" },
            descriptionI18n: { en: f.descriptionI18n?.en || "", mk: f.descriptionI18n?.mk || "", sq: f.descriptionI18n?.sq || "" },
            included: f.included ?? true,
          }))
        : [],
    };
  } catch {
    formError.value = "Failed to load package details";
  }
}

function closeDialog() {
  dialogOpen.value = false;
  editingId.value = null;
  formError.value = "";
}

function addFeature() {
  form.value.features.push({
    name: "",
    description: "",
    nameI18n: emptyI18n(),
    descriptionI18n: emptyI18n(),
    included: true,
  });
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
    nameI18n: form.value.nameI18n,
    descriptionI18n: form.value.descriptionI18n,
    price: form.value.price,
    currency: form.value.currency,
    discount: form.value.discount ?? 0,
    activeDiscount: form.value.activeDiscount,
    packageType: form.value.packageType,
    packageCategory: form.value.packageCategory,
    features: form.value.features
      .filter(f => f.name.trim())
      .map(f => ({
        ...(f.id ? { id: f.id } : {}),
        name: f.name.trim(),
        description: f.description.trim(),
        nameI18n: f.nameI18n,
        descriptionI18n: f.descriptionI18n,
        included: f.included,
      })),
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

.btn-create {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border: none; border-radius: 10px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
}
.btn-create:hover { background: var(--brand-dark); }

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
.icon-box { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.icon-box svg { width: 18px; height: 18px; }
.icon-box--purple { background: #f3e8ff; color: #7c3aed; }

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: var(--ink-4); margin-top: 2px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.price { font-weight: 700; color: var(--ink); font-size: 15px; }

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
.action-btn--danger:hover { background: #fef2f2; color: #dc2626; }

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
  padding: 20px 24px; border-bottom: 1px solid var(--line);
}
.dialog-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--ink); }
.dialog-close {
  background: none; border: none; font-size: 24px; color: var(--ink-4);
  cursor: pointer; line-height: 1; padding: 0;
}
.dialog-close:hover { color: var(--ink-2); }

.dialog-body {
  padding: 24px; overflow-y: auto; flex: 1;
}

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}

.form-group { display: flex; flex-direction: column; gap: 4px; }
.form-group--full { grid-column: 1 / -1; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--ink-2); }
.req { color: #dc2626; }

.i18n-group { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; padding-left: 10px; border-left: 2px solid var(--line); }
.i18n-field { display: flex; align-items: center; gap: 8px; }
.i18n-tag {
  font-size: 11px; font-weight: 700; color: var(--ink-4); text-transform: uppercase;
  min-width: 22px; text-align: center;
}

.form-input {
  padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--brand-main); }

.form-group--check { display: flex; align-items: flex-end; }
.check-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 500; color: var(--ink-2); cursor: pointer;
}
.check-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; }

/* Features */
.features-section { margin-top: 20px; }
.features-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.features-header label { font-size: 13px; font-weight: 600; color: var(--ink-2); }

.btn-add-feature {
  background: none; border: 1px dashed var(--line-2); border-radius: 6px;
  padding: 4px 12px; font-size: 13px; font-weight: 500; color: var(--ink-3);
  cursor: pointer; transition: all 0.15s;
}
.btn-add-feature:hover { border-color: var(--brand-main); color: var(--brand-main); }

.feature-card {
  border: 1px solid var(--line); border-radius: 10px; padding: 14px;
  margin-bottom: 10px; background: #fafbfc;
}
.feature-card-head {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.feature-num { font-size: 12px; font-weight: 700; color: var(--ink-4); }
.feature-fields { display: flex; flex-direction: column; gap: 12px; }

.check-label--sm { font-size: 13px; }

.btn-remove-feature {
  background: none; border: none; font-size: 20px; color: var(--ink-4);
  cursor: pointer; line-height: 1; padding: 4px; margin-left: auto;
}
.btn-remove-feature:hover { color: #dc2626; }

.form-error {
  margin-top: 12px; padding: 8px 12px; background: #fef2f2;
  border: 1px solid #fecaca; border-radius: 8px;
  color: #dc2626; font-size: 13px; font-weight: 500;
}

.dialog-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--line);
}

.btn-cancel {
  padding: 9px 20px; border: 1px solid var(--line); border-radius: 8px;
  background: #fff; color: var(--ink-2); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { background: var(--sunken); }

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
  }
</style>

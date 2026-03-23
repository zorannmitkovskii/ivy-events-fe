<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Events</h2>
        <p class="page-subtitle">Manage and monitor all events on the platform</p>
      </div>
      <button class="btn-create" @click="openCreate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        Create Event
      </button>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="searchQuery" placeholder="Search events..." class="search-input" />
        </div>
        <select v-model="selectedCategory" class="filter-select">
          <option value="">All Categories</option>
          <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading events...</span>
    </div>

    <!-- Bulk Actions -->
    <Transition name="bulk-fade">
      <div v-if="selected.size > 0" class="bulk-bar">
        <span class="bulk-count">{{ selected.size }} selected</span>
        <button class="bulk-btn bulk-btn--danger" @click="bulkDelete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Delete
        </button>
        <button class="bulk-btn" @click="clearSelection">Clear</button>
        <span v-if="bulkError" class="bulk-error">{{ bulkError }}</span>
      </div>
    </Transition>

    <!-- Table Card -->
    <div v-if="!loading" class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="th-check">
                <input type="checkbox" :checked="allPageSelected" :indeterminate="somePageSelected" @change="toggleAllPage" />
              </th>
              <th>Event Name</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              <th class="th-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="6" class="empty">No events found</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover" :class="{ 'row-selected': selected.has(row.id) }">
              <td class="td-check">
                <input type="checkbox" :checked="selected.has(row.id)" @change="toggleRow(row.id)" />
              </td>
              <td>
                <div class="cell-main">
                  <div class="icon-box icon-box--indigo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </div>
                  <div>
                    <div class="cell-title cell-title--link" @click="openDetail(row)">{{ row.name || '—' }}</div>
                    <div class="text-sub">ID: {{ row.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="pill pill--blue">{{ row.categoryType || '—' }}</span>
              </td>
              <td class="text-muted">{{ formatDate(row.date) }}</td>
              <td>
                <span class="status" :class="statusClass(row.status)">
                  <span class="status-dot"></span>
                  {{ row.status || '—' }}
                </span>
              </td>
              <td class="td-actions">
                <div class="actions">
                  <button
                    v-if="row.status !== 'ACTIVATED'"
                    class="action-btn action-btn--activate"
                    @click="openActivate(row)"
                    title="Activate & Assign Package"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </button>
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

    <!-- Delete error -->
    <p v-if="deleteError" class="inline-error">{{ deleteError }}</p>

    <!-- Detail Dialog -->
    <div v-if="detailOpen" class="dialog-overlay" @click.self="closeDetail">
      <div class="dialog dialog--wide">
        <div class="dialog-header">
          <h3>{{ detail?.name || 'Event Detail' }}</h3>
          <button class="dialog-close" @click="closeDetail">&times;</button>
        </div>

        <div class="dialog-body" v-if="detailLoading">
          <div class="loading"><div class="spinner"></div><span>Loading...</span></div>
        </div>

        <div class="dialog-body" v-else-if="detail">
          <!-- Info -->
          <div class="detail-section">
            <h4 class="detail-heading">Info</h4>
            <div class="detail-grid">
              <div class="detail-item"><span class="detail-label">Category</span><span class="pill pill--blue">{{ detail.categoryType }}</span></div>
              <div class="detail-item"><span class="detail-label">Status</span><span class="status" :class="statusClass(detail.status)"><span class="status-dot"></span>{{ detail.status }}</span></div>
              <div class="detail-item"><span class="detail-label">Date</span><span>{{ formatDate(detail.date) }}</span></div>
              <div class="detail-item"><span class="detail-label">Admin Created</span><span>{{ detail.adminCreated ? 'Yes' : 'No' }}</span></div>
              <div v-if="detail.groomName" class="detail-item"><span class="detail-label">Groom</span><span>{{ detail.groomName }}</span></div>
              <div v-if="detail.brideName" class="detail-item"><span class="detail-label">Bride</span><span>{{ detail.brideName }}</span></div>
            </div>
          </div>

          <!-- URLs / QR -->
          <div class="detail-section" v-if="detail.galleryUrl || detail.invitationUrl">
            <h4 class="detail-heading">URLs & QR Codes</h4>
            <div class="qr-grid">
              <div v-if="detail.galleryUrl" class="qr-card">
                <div class="qr-label">Gallery</div>
                <img :src="qrUrl(detail.galleryUrl)" alt="Gallery QR" class="qr-img" />
                <a :href="detail.galleryUrl" target="_blank" class="qr-link">{{ detail.galleryUrl }}</a>
              </div>
              <div v-if="detail.invitationUrl" class="qr-card">
                <div class="qr-label">Invitation</div>
                <img :src="qrUrl(detail.invitationUrl)" alt="Invitation QR" class="qr-img" />
                <a :href="detail.invitationUrl" target="_blank" class="qr-link">{{ detail.invitationUrl }}</a>
              </div>
              <div v-if="detail.privateInvitationUrl" class="qr-card">
                <div class="qr-label">Private Invitation</div>
                <img :src="qrUrl(detail.privateInvitationUrl)" alt="Private QR" class="qr-img" />
                <a :href="detail.privateInvitationUrl" target="_blank" class="qr-link">{{ detail.privateInvitationUrl }}</a>
              </div>
            </div>
          </div>

          <!-- Packages -->
          <div class="detail-section">
            <h4 class="detail-heading">Packages</h4>
            <div v-if="!detail.packages?.length" class="detail-empty">No packages assigned</div>
            <div v-else class="pkg-list">
              <div v-for="pkg in detail.packages" :key="pkg.id" class="pkg-card">
                <div class="pkg-header">
                  <span class="pill pill--blue">{{ pkg.packageType }}</span>
                  <span class="status" :class="pkg.status === 'ACTIVE' ? 'status--green' : 'status--red'">
                    <span class="status-dot"></span>{{ pkg.status }}
                  </span>
                </div>
                <div class="pkg-details">
                  <span>Storage limit: {{ pkg.storageLimitFormatted }}</span>
                  <span v-if="pkg.accessUntil">Access until: {{ formatDateTime(pkg.accessUntil) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Storage -->
          <div class="detail-section">
            <h4 class="detail-heading">Gallery Storage</h4>
            <div class="storage-bar-wrap">
              <div class="storage-info">
                <span>Used: <strong>{{ detail.storageUsedFormatted }}</strong></span>
                <span v-if="storageLimit">/ {{ storageLimit }}</span>
              </div>
              <div v-if="storagePct !== null" class="storage-bar">
                <div class="storage-fill" :style="{ width: Math.min(storagePct, 100) + '%' }" :class="{ 'storage-fill--warn': storagePct > 80 }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDetail">Close</button>
        </div>
      </div>
    </div>

    <!-- Activate Dialog -->
    <div v-if="activateDialogOpen" class="dialog-overlay" @click.self="closeActivateDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>Activate Event</h3>
          <button class="dialog-close" @click="closeActivateDialog">&times;</button>
        </div>

        <div class="dialog-body">
          <p class="activate-info">
            Activating <strong>{{ activateTarget?.name }}</strong> will set its status to ACTIVATED
            and assign a package to the user in Keycloak.
          </p>

          <div class="form-group">
            <label>Package Type <span class="req">*</span></label>
            <select v-model="activatePackageType" class="form-input">
              <option value="" disabled>Select package</option>
              <option v-for="pt in packageTypeOptions" :key="pt" :value="pt">{{ pt }}</option>
            </select>
          </div>

          <p v-if="activateError" class="form-error">{{ activateError }}</p>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeActivateDialog">Cancel</button>
          <button class="btn-activate" :disabled="activating" @click="activateEvent">
            {{ activating ? 'Activating...' : 'Activate' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <div v-if="dialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ editingId ? 'Edit Event' : 'Create Event' }}</h3>
          <button class="dialog-close" @click="closeDialog">&times;</button>
        </div>

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group form-group--full">
              <label>Event Name <span class="req">*</span></label>
              <input v-model="form.name" type="text" placeholder="e.g. Wedding Reception" class="form-input" />
            </div>
            <div class="form-group">
              <label>Category <span class="req">*</span></label>
              <select v-model="form.categoryType" class="form-input">
                <option value="" disabled>Select category</option>
                <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Event Date</label>
              <input
                v-model="form.dateDisplay"
                type="text"
                placeholder="dd/mm/yyyy"
                maxlength="10"
                class="form-input"
                @input="onDateInput"
              />
            </div>
            <div class="form-group">
              <label>Groom Name</label>
              <input v-model="form.groomName" type="text" placeholder="Groom name" class="form-input" />
            </div>
            <div class="form-group">
              <label>Bride Name</label>
              <input v-model="form.brideName" type="text" placeholder="Bride name" class="form-input" />
            </div>
            <div class="form-group form-group--full">
              <AuthLocationInput
                v-model="form.location"
                label="Location"
                placeholder="Venue name or address"
              />
            </div>
            <div v-if="!editingId" class="form-group form-group--full">
              <label>Invitation Template</label>
              <select v-model="form.invitationName" class="form-input">
                <option value="">None (set later)</option>
                <option v-for="tpl in templates" :key="tpl.id" :value="tpl.path">
                  {{ tpl.name }}
                </option>
              </select>
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
import { eventsService } from "@/services/events.service";
import { invitationTemplateService } from "@/services/invitationTemplate.service";
import { EventCategoryEnum } from "@/enums/EventCategory";
import { getErrorMessage } from "@/services/apiError";
import AuthLocationInput from "@/components/auth/AuthLocationInput.vue";

const categoryOptions = Object.values(EventCategoryEnum);
const events = ref([]);
const loading = ref(true);
const templates = ref([]);

async function fetchEvents() {
  loading.value = true;
  try {
    const data = await eventsService.getAll();
    events.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load events:", e);
    events.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchEvents);

/* ---- filters ---- */
const searchQuery = ref("");
const selectedCategory = ref("");

watch([searchQuery, selectedCategory], () => { page.value = 1; });

const filtered = computed(() => {
  let result = events.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(e => (e.name || "").toLowerCase().includes(q));
  }
  if (selectedCategory.value) {
    result = result.filter(e => e.categoryType === selectedCategory.value);
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

/* ---- selection ---- */
const selected = ref(new Set());

function toggleRow(id) {
  const s = new Set(selected.value);
  if (s.has(id)) s.delete(id); else s.add(id);
  selected.value = s;
}

const allPageSelected = computed(() =>
  paginated.value.length > 0 && paginated.value.every(r => selected.value.has(r.id))
);

const somePageSelected = computed(() =>
  !allPageSelected.value && paginated.value.some(r => selected.value.has(r.id))
);

function toggleAllPage() {
  const s = new Set(selected.value);
  if (allPageSelected.value) {
    paginated.value.forEach(r => s.delete(r.id));
  } else {
    paginated.value.forEach(r => s.add(r.id));
  }
  selected.value = s;
}

function clearSelection() {
  selected.value = new Set();
}

const bulkError = ref("");

async function bulkDelete() {
  const ids = [...selected.value];
  if (!ids.length) return;
  bulkError.value = "";
  try {
    await eventsService.bulkDelete(ids);
    const idSet = new Set(ids);
    events.value = events.value.filter(e => !idSet.has(e.id));
    selected.value = new Set();
  } catch (e) {
    bulkError.value = getErrorMessage(e);
  }
}

/* ---- dialog ---- */
const dialogOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref("");

const defaultForm = () => ({
  name: "",
  categoryType: "",
  date: "",
  dateDisplay: "",
  groomName: "",
  brideName: "",
  location: { name: "", address: "", lat: null, lng: null, placeId: null },
  invitationName: "",
});

function onDateInput(e) {
  let v = e.target.value.replace(/[^0-9]/g, "");
  if (v.length > 8) v = v.slice(0, 8);
  // Auto-insert slashes: dd/mm/yyyy
  if (v.length >= 5) v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
  else if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
  form.value.dateDisplay = v;
  // Parse to ISO when complete
  if (v.length === 10) {
    const [dd, mm, yyyy] = v.split("/");
    form.value.date = `${yyyy}-${mm}-${dd}`;
  } else {
    form.value.date = "";
  }
}

const form = ref(defaultForm());

async function fetchTemplates(category) {
  if (!category) { templates.value = []; return; }
  try {
    templates.value = await invitationTemplateService.listByCategory(category);
  } catch { templates.value = []; }
}

watch(() => form.value.categoryType, (cat) => {
  if (!editingId.value) fetchTemplates(cat);
});

function openCreate() {
  editingId.value = null;
  form.value = defaultForm();
  formError.value = "";
  dialogOpen.value = true;
}

async function openEdit(event) {
  editingId.value = event.id;
  formError.value = "";
  form.value = defaultForm();
  dialogOpen.value = true;

  try {
    const full = await eventsService.getById(event.id);
    const loc = full.location || {};
    const isoDate = full.date ? full.date.substring(0, 10) : "";
    form.value = {
      name: full.name || "",
      categoryType: full.categoryType || "",
      date: isoDate,
      dateDisplay: isoDate ? isoDate.slice(8, 10) + "/" + isoDate.slice(5, 7) + "/" + isoDate.slice(0, 4) : "",
      groomName: full.invitation?.groomName || "",
      brideName: full.invitation?.brideName || "",
      location: {
        name: loc.name || "",
        address: loc.addressLine || loc.address || "",
        lat: loc.latitude ?? loc.lat ?? null,
        lng: loc.longitude ?? loc.lng ?? null,
        placeId: loc.placeId ?? null,
      },
      invitationName: full.invitation?.invitationName || "",
    };
  } catch (e) {
    formError.value = "Failed to load event details";
  }
}

function closeDialog() {
  dialogOpen.value = false;
  editingId.value = null;
  formError.value = "";
}

async function save() {
  formError.value = "";

  if (!form.value.name.trim()) { formError.value = "Event name is required"; return; }
  if (!form.value.categoryType) { formError.value = "Category is required"; return; }

  const loc = form.value.location || {};
  const hasLocation = loc.name || loc.address || loc.lat != null;
  const payload = {
    name: form.value.name.trim(),
    categoryType: form.value.categoryType,
    date: form.value.date || null,
    groomName: form.value.groomName.trim() || null,
    brideName: form.value.brideName.trim() || null,
    location: hasLocation ? {
      name: loc.name || loc.address || null,
      type: "VENUE",
      addressLine: loc.address || null,
      latitude: loc.lat,
      longitude: loc.lng,
      isActive: true,
    } : null,
    invitationName: form.value.invitationName || null,
  };

  saving.value = true;
  try {
    if (editingId.value) {
      const updated = await eventsService.update(editingId.value, payload);
      const idx = events.value.findIndex(e => e.id === editingId.value);
      if (idx !== -1) events.value[idx] = { ...events.value[idx], ...updated };
    } else {
      const result = await eventsService.createAdmin(payload);
      const created = result?.data ?? result;
      events.value.unshift(created);
    }
    closeDialog();
  } catch (e) {
    formError.value = e.message || "Failed to save event";
  } finally {
    saving.value = false;
  }
}

/* ---- activate ---- */
const packageTypeOptions = [
  "INV_BASIC", "INV_PRO", "INV_PREMIUM",
  "GALLERY_BASIC", "GALLERY_PREMIUM"
];
const activateDialogOpen = ref(false);
const activateTarget = ref(null);
const activatePackageType = ref("");
const activating = ref(false);
const activateError = ref("");

function openActivate(event) {
  activateTarget.value = event;
  activatePackageType.value = "";
  activateError.value = "";
  activateDialogOpen.value = true;
}

function closeActivateDialog() {
  activateDialogOpen.value = false;
  activateTarget.value = null;
  activateError.value = "";
}

async function activateEvent() {
  activateError.value = "";
  if (!activatePackageType.value) {
    activateError.value = "Please select a package type";
    return;
  }

  activating.value = true;
  try {
    const result = await eventsService.activateEvent(activateTarget.value.id, activatePackageType.value);
    const updated = result?.data ?? result;
    const idx = events.value.findIndex(e => e.id === activateTarget.value.id);
    if (idx !== -1) events.value[idx] = { ...events.value[idx], ...updated };
    closeActivateDialog();
  } catch (e) {
    activateError.value = e.message || "Failed to activate event";
  } finally {
    activating.value = false;
  }
}

/* ---- detail ---- */
const detailOpen = ref(false);
const detail = ref(null);
const detailLoading = ref(false);

async function openDetail(row) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = null;
  try {
    const res = await eventsService.getAdminDetail(row.id);
    detail.value = res?.data ?? res;
  } catch (e) {
    console.error("Failed to load event detail:", e);
  } finally {
    detailLoading.value = false;
  }
}

function closeDetail() {
  detailOpen.value = false;
  detail.value = null;
}

const storageLimit = computed(() => {
  if (!detail.value?.packages?.length) return null;
  const active = detail.value.packages.find(p => p.status === "ACTIVE");
  return active?.storageLimitFormatted || null;
});

const storagePct = computed(() => {
  if (!detail.value?.packages?.length) return null;
  const active = detail.value.packages.find(p => p.status === "ACTIVE");
  if (!active || !active.storageLimitBytes) return null;
  return (detail.value.storageUsedBytes / active.storageLimitBytes) * 100;
});

function qrUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
}

function formatDateTime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ---- delete ---- */
const deleteError = ref("");

async function remove(ev) {
  if (!confirm(`Delete event "${ev.name}"?`)) return;
  deleteError.value = "";
  try {
    await eventsService.remove(ev.id);
    events.value = events.value.filter(e => e.id !== ev.id);
  } catch (e) {
    deleteError.value = getErrorMessage(e);
  }
}

function statusClass(status) {
  if (status === "ACTIVATED") return "status--green";
  if (status === "DRAFT") return "status--yellow";
  if (status === "PENDING") return "status--blue";
  return "status--red";
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
</script>

<style scoped>
/* ---- Bulk bar ---- */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 16px;
}
.bulk-count { font-size: 13px; font-weight: 600; color: #475569; }
.bulk-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 13px; font-weight: 500; background: #fff; color: #475569;
  cursor: pointer; transition: all 0.15s;
}
.bulk-btn:hover { background: #f1f5f9; }
.bulk-btn--danger { color: #dc2626; border-color: #fecaca; }
.bulk-btn--danger:hover { background: #fef2f2; }

.bulk-error {
  font-size: 13px;
  color: #dc2626;
  font-weight: 500;
  margin-left: auto;
}

.inline-error {
  margin: 10px 0 0;
  padding: 10px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}

.bulk-fade-enter-active, .bulk-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.bulk-fade-enter-from, .bulk-fade-leave-to { opacity: 0; transform: translateY(-8px); }

/* ---- Selection ---- */
.th-check, .td-check { width: 40px; text-align: center; }
.th-check input, .td-check input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--brand-main); }
.row-selected { background: #f0f4ff !important; }

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

/* Toolbar */
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.toolbar-left { display: flex; gap: 12px; flex: 1; flex-wrap: wrap; }

.search-box { position: relative; flex: 1; max-width: 360px; min-width: 200px; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #94a3b8; pointer-events: none; }
.search-input {
  width: 100%; padding: 9px 14px 9px 38px;
  border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.search-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

.filter-select {
  padding: 9px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; background: #fff; cursor: pointer; outline: none;
  min-width: 160px;
}
.filter-select:focus { border-color: var(--brand-main); }

/* Loading */
.loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: #64748b; font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: var(--brand-main); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Table card */
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

/* Cell styles */
.cell-main { display: flex; align-items: center; gap: 12px; }
.icon-box { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.icon-box svg { width: 18px; height: 18px; }
.icon-box--indigo { background: #eef2ff; color: #4f46e5; }

.cell-title { font-weight: 600; color: var(--brand-main); }
.cell-title--link { cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.cell-title--link:hover { opacity: 0.8; }
.text-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.text-muted { color: #64748b; }

/* Pills & status */
.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--blue { background: #eff6ff; color: #2563eb; }

.status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status--green { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status--green .status-dot { background: #10b981; }
.status--red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status--red .status-dot { background: #ef4444; }
.status--yellow { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
.status--yellow .status-dot { background: #f59e0b; }
.status--blue { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
.status--blue .status-dot { background: #3b82f6; }

/* Actions */
.td-actions { text-align: right; }
.actions { display: flex; justify-content: flex-end; gap: 6px; opacity: 0; transition: opacity 0.15s; }
.row-hover:hover .actions { opacity: 1; }

.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; background: transparent; color: #94a3b8;
}
.action-btn svg { width: 16px; height: 16px; }
.action-btn--activate:hover { background: #ecfdf5; color: #059669; }
.action-btn--edit:hover { background: #eff6ff; color: #2563eb; }
.action-btn--danger:hover { background: #fef2f2; color: #dc2626; }

/* Pagination */
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
  width: 100%; max-width: 540px; max-height: 90vh;
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
.form-group--full { grid-column: 1 / -1; }
.form-group label { font-size: 13px; font-weight: 600; color: #475569; }
.req { color: #dc2626; }

.form-input {
  padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--brand-main); }

.form-textarea {
  padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
  font-size: 14px; background: #fff; outline: none; resize: vertical;
  transition: border-color 0.2s; font-family: inherit;
}
.form-textarea:focus { border-color: var(--brand-main); }

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

.btn-activate {
  padding: 9px 24px; border: none; border-radius: 8px;
  background: #059669; color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
}
.btn-activate:hover:not(:disabled) { background: #047857; }
.btn-activate:disabled { opacity: 0.6; cursor: not-allowed; }

.activate-info {
  font-size: 14px; color: #475569; margin: 0 0 16px;
  line-height: 1.5;
}

/* ---- Detail dialog ---- */
.dialog--wide { max-width: 720px; }

.detail-section { margin-bottom: 20px; }
.detail-section:last-child { margin-bottom: 0; }
.detail-heading { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 10px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; }

.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
.detail-item { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.detail-label { color: #64748b; font-weight: 500; min-width: 110px; }
.detail-empty { font-size: 13px; color: #94a3b8; }

.qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.qr-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center; }
.qr-label { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.qr-img { width: 120px; height: 120px; border-radius: 8px; }
.qr-link { display: block; margin-top: 8px; font-size: 11px; color: #2563eb; word-break: break-all; text-decoration: none; }
.qr-link:hover { text-decoration: underline; }

.pkg-list { display: flex; flex-direction: column; gap: 8px; }
.pkg-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
.pkg-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.pkg-details { display: flex; gap: 20px; font-size: 12px; color: #64748b; }

.storage-bar-wrap { padding: 4px 0; }
.storage-info { font-size: 13px; color: #475569; margin-bottom: 6px; }
.storage-info strong { color: #0f172a; }
.storage-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.storage-fill { height: 100%; background: #059669; border-radius: 4px; transition: width 0.3s; }
.storage-fill--warn { background: #d97706; }

@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
  .page-header { flex-direction: column; }
}
</style>

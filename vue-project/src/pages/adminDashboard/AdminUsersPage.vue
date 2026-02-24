<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Users</h2>
        <p class="page-subtitle">Manage and monitor all user accounts</p>
      </div>
      <div class="header-actions">
        <button class="btn-create btn-create--outline" @click="openDiscount">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          Discount Subscribe
        </button>
        <button class="btn-create" @click="openCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          Create User
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="searchQuery" placeholder="Search users..." class="search-input" />
        </div>
        <select v-model="roleFilter" class="filter-select">
          <option value="">All Roles</option>
          <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
        </select>
        <select v-model="packageFilter" class="filter-select">
          <option value="">All Packages</option>
          <option v-for="pt in packageTypeOptions" :key="pt" :value="pt">{{ pt }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>Loading users...</span>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Package</th>
              <th>Status</th>
              <th class="th-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="5" class="empty">No users found</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover">
              <td>
                <div class="cell-main">
                  <div class="avatar" :class="avatarColor(row)">
                    {{ initials(row) }}
                  </div>
                  <div>
                    <div class="cell-title">{{ row.firstName }} {{ row.lastName }}</div>
                    <div class="text-sub">{{ row.email || '—' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="pill" :class="getRolePillClass(row)">{{ displayRole(row) }}</span>
              </td>
              <td>
                <span class="pill pill--gray">{{ row.packageType || '—' }}</span>
              </td>
              <td>
                <span class="status" :class="row.active !== false ? 'status--green' : 'status--red'">
                  <span class="status-dot"></span>
                  {{ row.active !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="td-actions">
                <div class="actions">
                  <button class="action-btn action-btn--edit" @click="openEdit(row)" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button v-if="!isAdmin(row)" class="action-btn action-btn--danger" @click="remove(row)" title="Delete">
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
          <h3>{{ editingId ? 'Edit User' : 'Create User' }}</h3>
          <button class="dialog-close" @click="closeDialog">&times;</button>
        </div>

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group">
              <label>First Name <span class="req">*</span></label>
              <input v-model="form.firstName" type="text" placeholder="John" class="form-input" />
            </div>
            <div class="form-group">
              <label>Last Name <span class="req">*</span></label>
              <input v-model="form.lastName" type="text" placeholder="Doe" class="form-input" />
            </div>
            <div class="form-group">
              <label>Username <span class="req">*</span></label>
              <input v-model="form.username" type="text" placeholder="johndoe" class="form-input" />
            </div>
            <div class="form-group">
              <label>Email <span class="req">*</span></label>
              <input v-model="form.email" type="email" placeholder="john@example.com" class="form-input" />
            </div>
            <div v-if="!editingId" class="form-group form-group--full">
              <label>Password <span class="req">*</span></label>
              <input v-model="form.password" type="password" placeholder="Enter password" class="form-input" />
            </div>
            <div class="form-group">
              <label>Roles <span class="req">*</span></label>
              <div class="checkbox-group">
                <label v-for="role in roleOptions" :key="role" class="check-label">
                  <input type="checkbox" :value="role" v-model="form.roles" />
                  <span>{{ role }}</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>Package Type</label>
              <select v-model="form.packageType" class="form-input">
                <option value="">None</option>
                <option v-for="pt in packageTypeOptions" :key="pt" :value="pt">{{ pt }}</option>
              </select>
            </div>
            <div class="form-group form-group--full">
              <label>Event ID</label>
              <input v-model="form.eventId" type="text" placeholder="UUID (optional)" class="form-input" />
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

    <!-- Discount Subscribe Dialog -->
    <div v-if="discountDialogOpen" class="dialog-overlay" @click.self="closeDiscountDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>Discount Subscribe</h3>
          <button class="dialog-close" @click="closeDiscountDialog">&times;</button>
        </div>

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group form-group--full">
              <label>Name <span class="req">*</span></label>
              <input v-model="discountForm.name" type="text" placeholder="Full name" class="form-input" />
            </div>
            <div class="form-group form-group--full">
              <label>Email <span class="req">*</span></label>
              <input v-model="discountForm.email" type="email" placeholder="user@example.com" class="form-input" />
            </div>
            <div class="form-group form-group--full">
              <label>Phone</label>
              <input v-model="discountForm.phone" type="tel" placeholder="+1 234 567 890 (optional)" class="form-input" />
            </div>
          </div>

          <p v-if="discountError" class="form-error">{{ discountError }}</p>
          <p v-if="discountSuccess" class="form-success">Subscribed successfully!</p>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDiscountDialog">Cancel</button>
          <button class="btn-save" :disabled="discountSaving" @click="saveDiscount">
            {{ discountSaving ? 'Subscribing...' : 'Subscribe' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getAdminUsers, getAdminUser, createAdminUser, updateAdminUser, deleteUser } from "@/services/userService";
import { subscribeToDiscounts } from "@/services/backendApi";
import { PackageTypeEnum } from "@/enums/PackageType";

const roleOptions = ["ADMIN", "USER"];
const packageTypeOptions = Object.values(PackageTypeEnum);

const users = ref([]);
const loading = ref(true);

async function fetchUsers() {
  loading.value = true;
  try {
    const params = {};
    if (roleFilter.value) params.role = roleFilter.value;
    if (packageFilter.value) params.packageType = packageFilter.value;
    const data = await getAdminUsers(params);
    users.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load users:", e);
    users.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchUsers);

/* ---- filters ---- */
const searchQuery = ref("");
const roleFilter = ref("");
const packageFilter = ref("");

watch([searchQuery, roleFilter, packageFilter], () => { page.value = 1; });
watch([roleFilter, packageFilter], () => { fetchUsers(); });

const filtered = computed(() => {
  let result = users.value;
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(u => {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
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
const avatarColors = ["avatar--indigo", "avatar--teal", "avatar--rose", "avatar--amber"];

function initials(user) {
  const f = (user.firstName || "")[0] || "";
  const l = (user.lastName || "")[0] || "";
  return (f + l).toUpperCase() || "?";
}

function avatarColor(user) {
  const hash = (user.id || 0) % avatarColors.length;
  return avatarColors[hash];
}

function displayRole(user) {
  if (Array.isArray(user.roles) && user.roles.length) return user.roles.join(", ");
  return user.role || "—";
}

function getRolePillClass(user) {
  const roles = Array.isArray(user.roles) ? user.roles : [user.role];
  if (roles.includes("ADMIN")) return "pill--purple";
  return "pill--blue";
}

function isAdmin(user) {
  const roles = Array.isArray(user.roles) ? user.roles : [user.role];
  return roles.includes("ADMIN");
}

/* ---- dialog ---- */
const dialogOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref("");

const defaultForm = () => ({
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  roles: ["USER"],
  packageType: "",
  eventId: "",
});

const form = ref(defaultForm());

function openCreate() {
  editingId.value = null;
  form.value = defaultForm();
  formError.value = "";
  dialogOpen.value = true;
}

async function openEdit(user) {
  editingId.value = user.id;
  formError.value = "";
  form.value = defaultForm();
  dialogOpen.value = true;

  try {
    const full = await getAdminUser(user.id);
    form.value = {
      firstName: full.firstName || "",
      lastName: full.lastName || "",
      username: full.username || "",
      email: full.email || "",
      password: "",
      roles: Array.isArray(full.roles) ? [...full.roles] : (full.role ? [full.role] : ["USER"]),
      packageType: full.packageType || "",
      eventId: full.eventId || "",
    };
  } catch (e) {
    formError.value = "Failed to load user details";
  }
}

function closeDialog() {
  dialogOpen.value = false;
  editingId.value = null;
  formError.value = "";
}

async function save() {
  formError.value = "";

  if (!form.value.firstName.trim()) { formError.value = "First name is required"; return; }
  if (!form.value.lastName.trim()) { formError.value = "Last name is required"; return; }
  if (!form.value.username.trim()) { formError.value = "Username is required"; return; }
  if (!form.value.email.trim()) { formError.value = "Email is required"; return; }
  if (!editingId.value && !form.value.password) { formError.value = "Password is required"; return; }
  if (!form.value.roles.length) { formError.value = "At least one role is required"; return; }

  const payload = {
    firstName: form.value.firstName.trim(),
    lastName: form.value.lastName.trim(),
    username: form.value.username.trim(),
    email: form.value.email.trim(),
    roles: form.value.roles,
    packageType: form.value.packageType || null,
    eventId: form.value.eventId || null,
  };

  if (!editingId.value) {
    payload.password = form.value.password;
  }

  saving.value = true;
  try {
    if (editingId.value) {
      await updateAdminUser(editingId.value, payload);
    } else {
      await createAdminUser(payload);
    }
    closeDialog();
    await fetchUsers();
  } catch (e) {
    formError.value = e.message || "Failed to save user";
  } finally {
    saving.value = false;
  }
}

/* ---- delete ---- */
async function remove(user) {
  if (isAdmin(user)) return;
  if (!confirm(`Delete user "${user.firstName} ${user.lastName}"?`)) return;
  try {
    await deleteUser(user.id);
    users.value = users.value.filter(u => u.id !== user.id);
  } catch (e) {
    console.error("Failed to delete user:", e);
  }
}

/* ---- discount subscribe dialog ---- */
const discountDialogOpen = ref(false);
const discountSaving = ref(false);
const discountError = ref("");
const discountSuccess = ref(false);

const defaultDiscountForm = () => ({ name: "", email: "", phone: "" });
const discountForm = ref(defaultDiscountForm());

function openDiscount() {
  discountForm.value = defaultDiscountForm();
  discountError.value = "";
  discountSuccess.value = false;
  discountDialogOpen.value = true;
}

function closeDiscountDialog() {
  discountDialogOpen.value = false;
  discountError.value = "";
  discountSuccess.value = false;
}

async function saveDiscount() {
  discountError.value = "";
  discountSuccess.value = false;

  if (!discountForm.value.name.trim()) { discountError.value = "Name is required"; return; }
  if (!discountForm.value.email.trim()) { discountError.value = "Email is required"; return; }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(discountForm.value.email.trim())) { discountError.value = "Please enter a valid email"; return; }

  const payload = {
    name: discountForm.value.name.trim(),
    email: discountForm.value.email.trim(),
    phone: discountForm.value.phone.trim() || undefined,
  };

  discountSaving.value = true;
  try {
    await subscribeToDiscounts(payload);
    discountSuccess.value = true;
    discountForm.value = defaultDiscountForm();
  } catch (e) {
    discountError.value = e?.response?.data?.message || e.message || "Failed to subscribe";
  } finally {
    discountSaving.value = false;
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

.btn-create--outline {
  background: #fff; color: var(--brand-main);
  border: 1px solid var(--brand-main);
}
.btn-create--outline:hover { background: #f5f3ff; }

.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

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
  font-size: 14px; background: #fff; cursor: pointer; outline: none; min-width: 140px;
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

.avatar {
  width: 38px; height: 38px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: #fff; flex-shrink: 0;
  letter-spacing: 0.02em;
}
.avatar--indigo { background: #4f46e5; }
.avatar--teal { background: #0d9488; }
.avatar--rose { background: #e11d48; }
.avatar--amber { background: #d97706; }

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--blue { background: #eff6ff; color: #2563eb; }
.pill--purple { background: #f3e8ff; color: #7c3aed; }
.pill--gray { background: #f1f5f9; color: #475569; }

.status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status--green { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status--green .status-dot { background: #10b981; }
.status--red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status--red .status-dot { background: #ef4444; }

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
  width: 100%; max-width: 580px; max-height: 90vh;
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

.checkbox-group { display: flex; gap: 16px; margin-top: 4px; }
.check-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 500; color: #475569; cursor: pointer;
}
.check-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: var(--brand-main); }

.form-error {
  margin-top: 12px; padding: 8px 12px; background: #fef2f2;
  border: 1px solid #fecaca; border-radius: 8px;
  color: #dc2626; font-size: 13px; font-weight: 500;
}

.form-success {
  margin-top: 12px; padding: 8px 12px; background: #ecfdf5;
  border: 1px solid #a7f3d0; border-radius: 8px;
  color: #059669; font-size: 13px; font-weight: 500;
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

<template>
  <div class="admin-page">
    <PageHeader :title="title" :subtitle="subtitle">
      <template #actions>
        <slot name="header-actions" />
        <button class="btn-create" @click="openCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          {{ t('userDirectory.create') }}
        </button>
      </template>
    </PageHeader>

    <!-- Toolbar -->
    <Toolbar v-model:search="searchQuery" :search-placeholder="t('userDirectory.search')">
      <template #filters>
        <select v-model="roleFilter" class="filter-select">
        <option value="">{{ t('userDirectory.allRoles') }}</option>
        <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
        </select>
        <select v-if="showPackages" v-model="packageFilter" class="filter-select">
        <option value="">{{ t('userDirectory.allPackages') }}</option>
        <option v-for="pt in packageTypeOptions" :key="pt" :value="pt">{{ pt }}</option>
        </select>
      </template>
    </Toolbar>

    <!--
      Loading and a failed load are both the table's own states now. A failed
      load is stated, never rendered as an empty table: "no users found" under
      a backend that refused the request reads as "you have no team", which is
      a different and far more alarming thing than "we could not ask".
    -->

    <!-- Bulk Actions -->
    <Transition name="bulk-fade">
      <div v-if="selected.size > 0" class="bulk-bar">
        <span class="bulk-count">{{ t('userDirectory.selected', { count: selected.size }) }}</span>
        <button class="bulk-btn bulk-btn--danger" @click="bulkDelete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          {{ t('userDirectory.delete') }}
        </button>
        <button class="bulk-btn" @click="clearSelection">{{ t('userDirectory.clear') }}</button>
      </div>
    </Transition>

    <DataTable
      :columns="columns"
      :rows="paginated"
      row-key="id"
      :loading="loading"
      :loading-label="t('userDirectory.loading')"
      :error="loadError"
      :error-title="t('userDirectory.loadFailedTitle')"
      :empty-title="t('userDirectory.empty')"
      :row-class="(row) => (selected.has(row.id) ? 'row-selected' : null)"
    >
      <template #head-check>
        <input type="checkbox" :checked="allPageSelected" :indeterminate="somePageSelected" @change="toggleAllPage" />
      </template>

      <template #cell-check="{ row }">
        <input type="checkbox" :checked="selected.has(row.id)" @change="toggleRow(row.id)" />
      </template>

      <template #cell-user="{ row }">
        <div class="cell-main">
          <div class="avatar" :class="avatarColor(row)">
            {{ initials(row) }}
          </div>
          <div>
            <div class="cell-title">{{ row.firstName }} {{ row.lastName }}</div>
            <div class="text-sub">{{ row.email || '—' }}</div>
          </div>
        </div>
      </template>

      <template #cell-role="{ row }">
        <span class="pill" :class="getRolePillClass(row)">{{ displayRole(row) }}</span>
      </template>

      <template #cell-package="{ row }">
        <template v-if="row.packages && row.packages.length">
          <span v-for="pt in row.packages" :key="pt" class="pill pill--gray pill--gap">{{ pt }}</span>
        </template>
        <span v-else class="pill pill--gray">{{ row.packageType || '—' }}</span>
      </template>

      <template #cell-status="{ row }">
        <StatusPill :tone="row.active !== false ? 'ok' : 'error'">
          {{ row.active !== false ? t('userDirectory.active') : t('userDirectory.inactive') }}
        </StatusPill>
      </template>

      <template #cell-actions="{ row }">
        <div class="actions">
          <button class="action-btn action-btn--edit" @click="openEdit(row)" :title="t('userDirectory.edit')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button v-if="!isProtected(row)" class="action-btn action-btn--danger" @click="remove(row)" :title="t('userDirectory.delete')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </template>

      <template v-if="filtered.length > 0" #footer>
        <span>{{ t('userDirectory.showing', { from: startIndex, to: endIndex, total: filtered.length }) }}</span>
        <span class="pagination-btns">
          <button class="pg-btn" :disabled="page === 1" @click="prev">{{ t('userDirectory.previous') }}</button>
          <button
            v-for="n in totalPages"
            :key="n"
            class="pg-btn"
            :class="{ 'pg-btn--active': n === page }"
            @click="goto(n)"
          >{{ n }}</button>
          <button class="pg-btn" :disabled="page === totalPages" @click="next">{{ t('userDirectory.next') }}</button>
        </span>
      </template>
    </DataTable>

    <!-- Create/Edit Dialog -->
    <div v-if="dialogOpen" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <div class="dialog-header">
          <h3>{{ editingId ? t('userDirectory.editUser') : t('userDirectory.createUser') }}</h3>
          <button class="dialog-close" @click="closeDialog">&times;</button>
        </div>

        <div class="dialog-body">
          <div class="form-grid">
            <div class="form-group">
              <label>{{ t('userDirectory.firstName') }} <span class="req">*</span></label>
              <input v-model="form.firstName" type="text" :placeholder="t('userDirectory.placeholders.firstName')" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('userDirectory.lastName') }} <span class="req">*</span></label>
              <input v-model="form.lastName" type="text" :placeholder="t('userDirectory.placeholders.lastName')" class="form-input" />
            </div>
            <div class="form-group form-group--full">
              <label>{{ t('userDirectory.email') }} <span class="req">*</span></label>
              <input v-model="form.email" type="email" :placeholder="t('userDirectory.placeholders.email')" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('userDirectory.roles') }} <span class="req">*</span></label>
              <div class="checkbox-group">
                <label v-for="role in roleOptions" :key="role" class="check-label">
                  <input type="checkbox" :value="role" v-model="form.roles" />
                  <span>{{ role }}</span>
                </label>
              </div>
            </div>
            <div v-if="showPackages" class="form-group">
              <label>{{ t('userDirectory.packageTypes') }}</label>
              <div class="checkbox-group checkbox-group--wrap">
                <label v-for="pt in packageTypeOptions" :key="pt" class="check-label">
                  <input type="checkbox" :value="pt" v-model="form.packageTypes" />
                  <span>{{ pt }}</span>
                </label>
              </div>
            </div>
            <div class="form-group form-group--full">
              <label>{{ t('userDirectory.events') }}</label>
              <input
                v-model="eventSearch"
                type="text"
                :placeholder="t('userDirectory.searchEvents')"
                class="form-input event-search-input"
              />
              <div class="checkbox-group checkbox-group--wrap checkbox-group--scroll">
                <label v-for="ev in filteredEvents" :key="ev.id" class="check-label">
                  <input type="checkbox" :value="ev.id" v-model="form.eventIds" />
                  <span>{{ ev.name || t('userDirectory.unnamed') }} — {{ ev.categoryType || '' }}</span>
                </label>
                <span v-if="eventSearch.length >= 3 && filteredEvents.length === 0" class="no-results">
                  {{ t('userDirectory.noEvents') }}
                </span>
              </div>
            </div>
          </div>

          <p v-if="formError" class="form-error">{{ formError }}</p>
        </div>

        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeDialog">{{ t('userDirectory.cancel') }}</button>
          <button class="btn-save" :disabled="saving" @click="save">
            {{ saving ? t('userDirectory.saving') : (editingId ? t('userDirectory.update') : t('userDirectory.createAction')) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * The user table, for whoever is allowed to manage users (IVY-1203).
 *
 * <p>Lifted out of {@code AdminUsersPage} when the agency console got the same
 * screen. It is the same endpoints in both places — {@code /v1/api/admin/users}
 * accepts ORG_ADMIN since IVY-1203 and narrows the answer to the caller's own
 * organization — so what differs between the two callers is presentation, and
 * that is what the props carry: which roles may be handed out, and whether
 * platform packages are part of the picture at all.
 *
 * <p>The scope is deliberately <b>not</b> a prop. A page cannot ask for another
 * organization's users by passing a different value, because there is no value
 * to pass: the server reads it from the token.
 */
import Toolbar from '@/components/ui/Toolbar.vue'
import { ref, computed, onMounted, watch } from 'vue'
import DataTable from '@/components/ui/DataTable.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import StatusPill from '@/components/ui/StatusPill.vue'
import { useI18n } from 'vue-i18n'
import { getAdminUsers, getAdminUser, createAdminUser, updateAdminUser, deleteUser } from '@/services/userService'
import { eventsService } from '@/services/events.service'
import { getErrorMessage } from '@/services/apiError'
import { PackageTypeEnum } from '@/enums/PackageType'

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  /** Which roles this caller may filter by and hand out. */
  roleOptions: { type: Array, default: () => ['ADMIN', 'AGENCY_MEMBER', 'USER'] },
  /** Commercial packages are a platform concern; an agency has no use for them. */
  showPackages: { type: Boolean, default: false },
  /** Roles whose holders this caller must not delete. */
  protectedRoles: { type: Array, default: () => ['ADMIN'] },
  /** What a newly opened create dialog starts with. */
  defaultRoles: { type: Array, default: () => ['USER'] }
})

/**
 * The package column only exists on the platform directory; the agency team
 * screen has no packages to show, so the column is dropped rather than
 * rendered empty.
 */
const columns = computed(() => [
  { key: 'check', label: '', width: '44px' },
  { key: 'user', label: t('userDirectory.user') },
  { key: 'role', label: t('userDirectory.role') },
  ...(props.showPackages ? [{ key: 'package', label: t('userDirectory.package') }] : []),
  { key: 'status', label: t('userDirectory.status') },
  { key: 'actions', label: t('userDirectory.actions'), align: 'right' },
])

const { t } = useI18n()

const packageTypeOptions = Object.values(PackageTypeEnum)

const users = ref([])
const loading = ref(true)
const loadError = ref('')
const allEvents = ref([])
const eventSearch = ref('')

const filteredEvents = computed(() => {
  if (eventSearch.value.length < 3) return allEvents.value
  const q = eventSearch.value.toLowerCase()
  return allEvents.value.filter(ev =>
    (ev.name || '').toLowerCase().includes(q) ||
    (ev.categoryType || '').toLowerCase().includes(q)
  )
})

async function fetchEvents() {
  try {
    const data = await eventsService.getAll()
    allEvents.value = Array.isArray(data) ? data : []
  } catch {
    allEvents.value = []
  }
}

async function fetchUsers() {
  loading.value = true
  loadError.value = ''
  try {
    const params = {}
    if (roleFilter.value) params.role = roleFilter.value
    if (props.showPackages && packageFilter.value) params.packageType = packageFilter.value
    const data = await getAdminUsers(params)
    users.value = Array.isArray(data) ? data : []
  } catch (e) {
    loadError.value = `${t('userDirectory.loadFailed')} ${getErrorMessage(e)}`
    users.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchUsers)

/* ---- filters ---- */
const searchQuery = ref('')
const roleFilter = ref('')
const packageFilter = ref('')

watch([searchQuery, roleFilter, packageFilter], () => { page.value = 1 })
watch([roleFilter, packageFilter], () => { fetchUsers() })

const filtered = computed(() => {
  let result = users.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(u => {
      const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase()
      const email = (u.email || '').toLowerCase()
      return name.includes(q) || email.includes(q)
    })
  }
  return result
})

/* ---- pagination ---- */
const page = ref(1)
const perPage = 10

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)))
const paginated = computed(() =>
  filtered.value.slice((page.value - 1) * perPage, page.value * perPage)
)
const startIndex = computed(() =>
  filtered.value.length === 0 ? 0 : (page.value - 1) * perPage + 1
)
const endIndex = computed(() =>
  Math.min(page.value * perPage, filtered.value.length)
)

function next() { if (page.value < totalPages.value) page.value++ }
function prev() { if (page.value > 1) page.value-- }
function goto(n) { page.value = n }

/* ---- selection ---- */
const selected = ref(new Set())

function toggleRow(id) {
  const s = new Set(selected.value)
  if (s.has(id)) s.delete(id); else s.add(id)
  selected.value = s
}

const allPageSelected = computed(() =>
  paginated.value.length > 0 && paginated.value.every(r => selected.value.has(r.id))
)

const somePageSelected = computed(() =>
  !allPageSelected.value && paginated.value.some(r => selected.value.has(r.id))
)

function toggleAllPage() {
  const s = new Set(selected.value)
  if (allPageSelected.value) {
    paginated.value.forEach(r => s.delete(r.id))
  } else {
    paginated.value.forEach(r => { if (!isProtected(r)) s.add(r.id) })
  }
  selected.value = s
}

function clearSelection() {
  selected.value = new Set()
}

async function bulkDelete() {
  const ids = [...selected.value]
  if (!ids.length) return
  for (const id of ids) {
    try {
      await deleteUser(id)
      users.value = users.value.filter(u => u.id !== id)
    } catch (e) {
      console.error(`Failed to delete user ${id}:`, e)
    }
  }
  selected.value = new Set()
}

/* ---- helpers ---- */
const avatarColors = ['avatar--indigo', 'avatar--teal', 'avatar--rose', 'avatar--amber']

function initials(user) {
  const f = (user.firstName || '')[0] || ''
  const l = (user.lastName || '')[0] || ''
  return (f + l).toUpperCase() || '?'
}

function avatarColor(user) {
  const hash = (user.id || 0) % avatarColors.length
  return avatarColors[hash]
}

function rolesOf(user) {
  return Array.isArray(user.roles) ? user.roles : (user.role ? [user.role] : [])
}

function displayRole(user) {
  const roles = rolesOf(user)
  return roles.length ? roles.join(', ') : '—'
}

function getRolePillClass(user) {
  const roles = rolesOf(user)
  if (roles.includes('ADMIN')) return 'pill--purple'
  if (roles.includes('AGENCY')) return 'pill--purple'
  if (roles.includes('AGENCY_MEMBER')) return 'pill--teal'
  return 'pill--blue'
}

/** Somebody this caller may see but must not remove — an owner, an administrator. */
function isProtected(user) {
  return rolesOf(user).some(role => props.protectedRoles.includes(role))
}

/* ---- dialog ---- */
const dialogOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref('')

const defaultForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  roles: [...props.defaultRoles],
  packageTypes: [],
  eventIds: []
})

const form = ref(defaultForm())

function openCreate() {
  editingId.value = null
  form.value = defaultForm()
  formError.value = ''
  eventSearch.value = ''
  dialogOpen.value = true
  fetchEvents()
}

async function openEdit(user) {
  editingId.value = user.id
  formError.value = ''
  eventSearch.value = ''
  form.value = defaultForm()
  dialogOpen.value = true
  fetchEvents()

  try {
    const full = await getAdminUser(user.id)
    form.value = {
      firstName: full.firstName || '',
      lastName: full.lastName || '',
      email: full.email || '',
      roles: Array.isArray(full.roles) ? [...full.roles] : (full.role ? [full.role] : [...props.defaultRoles]),
      packageTypes: Array.isArray(full.packages) ? [...full.packages] : (full.packageType ? [full.packageType] : []),
      eventIds: Array.isArray(full.eventIds) ? [...full.eventIds] : (full.eventId ? [full.eventId] : [])
    }
  } catch {
    formError.value = t('userDirectory.loadUserFailed')
  }
}

function closeDialog() {
  dialogOpen.value = false
  editingId.value = null
  formError.value = ''
}

async function save() {
  formError.value = ''

  if (!form.value.firstName.trim()) { formError.value = t('userDirectory.firstNameRequired'); return }
  if (!form.value.lastName.trim()) { formError.value = t('userDirectory.lastNameRequired'); return }
  if (!form.value.email.trim()) { formError.value = t('userDirectory.emailRequired'); return }
  if (!form.value.roles.length) { formError.value = t('userDirectory.roleRequired'); return }

  const packageTypes = props.showPackages ? form.value.packageTypes : []

  const payload = {
    firstName: form.value.firstName.trim(),
    lastName: form.value.lastName.trim(),
    email: form.value.email.trim(),
    roles: form.value.roles,
    packages: editingId.value ? packageTypes : (packageTypes.length ? packageTypes : null),
    eventIds: editingId.value ? form.value.eventIds : (form.value.eventIds.length ? form.value.eventIds : null)
  }

  saving.value = true
  try {
    if (editingId.value) {
      await updateAdminUser(editingId.value, payload)
    } else {
      await createAdminUser(payload)
    }
    closeDialog()
    await fetchUsers()
  } catch (e) {
    formError.value = getErrorMessage(e) || t('userDirectory.saveFailed')
  } finally {
    saving.value = false
  }
}

/* ---- delete ---- */
async function remove(user) {
  if (isProtected(user)) return
  if (!confirm(t('userDirectory.confirmDelete', { name: `${user.firstName} ${user.lastName}` }))) return
  try {
    await deleteUser(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
  } catch (e) {
    console.error('Failed to delete user:', e)
  }
}

/** A page that frames the directory may offer "create" from its own header. */
defineExpose({ openCreate })
</script>

<style scoped>
/* ---- Bulk bar ---- */
.bulk-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--sunken);
  border: 1px solid var(--line);
  border-radius: 10px;
  margin-bottom: 16px;
}
.bulk-count { font-size: 13px; font-weight: 600; color: var(--ink-2); }
.bulk-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 14px; border: 1px solid var(--line); border-radius: 8px;
  font-size: 13px; font-weight: 500; background: #fff; color: var(--ink-2);
  cursor: pointer; transition: all 0.15s;
}
.bulk-btn:hover { background: var(--sunken); }
.bulk-btn--danger { color: #dc2626; border-color: #fecaca; }
.bulk-btn--danger:hover { background: #fef2f2; }

.bulk-fade-enter-active, .bulk-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.bulk-fade-enter-from, .bulk-fade-leave-to { opacity: 0; transform: translateY(-8px); }

/* ---- Selection ---- */
.th-check, .td-check { width: 40px; text-align: center; }
.th-check input, .td-check input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--brand-main); }
.row-selected { background: #f0f4ff !important; }

.admin-page { max-width: 1200px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 24px; font-weight: 700; color: var(--neutral-900); margin: 0; }
/* Was var(--ink-3) — 4.37:1, just under the floor. */
.page-subtitle { font-size: 14px; color: var(--ink-2); margin: 4px 0 0; }

.btn-create {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border: none; border-radius: 10px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
}
.btn-create:hover { background: var(--brand-dark); }

.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.search-input {
  width: 100%; padding: 9px 14px 9px 38px;
  border: 1px solid var(--line); border-radius: 10px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

.filter-select {
  padding: 9px 14px; border: 1px solid var(--line); border-radius: 10px;
  font-size: 14px; background: #fff; cursor: pointer; outline: none; min-width: 140px;
}
.filter-select:focus { border-color: var(--brand-main); }

.loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: var(--ink-2); font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2.5px solid var(--line); border-top-color: var(--brand-main); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.load-error {
  padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 10px; color: #dc2626; font-size: 14px; font-weight: 500;
}

.table-card { background: #fff; border-radius: 14px; border: 1px solid var(--line); box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
.table-wrap { overflow-x: auto; }

.table { width: 100%; border-collapse: collapse; text-align: left; }
.table thead tr { background: var(--sunken); border-bottom: 1px solid var(--line); }
.table th { padding: 14px 20px; font-size: 11px; font-weight: 600; color: var(--ink-2); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.th-right { text-align: right; }
.table td { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid var(--sunken); vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }

.row-hover { transition: background 0.15s; }
.row-hover:hover { background: var(--sunken); }
.empty { text-align: center; color: #556070; padding: 40px 20px !important; }

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
/* Was var(--ink-4) — 2.56:1 against the row, below the 4.5:1 floor. */
.text-sub { font-size: 12px; color: #556070; margin-top: 2px; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--blue { background: #eff6ff; color: #2563eb; }
.pill--purple { background: #f3e8ff; color: #7c3aed; }
.pill--teal { background: #f0fdfa; color: #0d9488; }
.pill--gray { background: var(--sunken); color: var(--ink-2); }
.pill--gap { margin-right: 4px; margin-bottom: 2px; }

.status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; }
.status--green { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.status--green .status-dot { background: #10b981; }
.status--red { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.status--red .status-dot { background: #ef4444; }

.td-actions { text-align: right; }
/*
  The controls are visible, not revealed on hover (IVY-1206). A column headed
  ДЕЈСТВА that is empty until the pointer happens to cross the row is empty for
  anybody on a touch screen and for anybody navigating by keyboard — and it
  reads as a table with a blank column to everyone else.
*/
.actions { display: flex; justify-content: flex-end; gap: 6px; }

.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--line);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; background: #fff; color: var(--ink-2);
}

.action-btn:focus-visible { outline: 2px solid var(--brand-main); outline-offset: 2px; }
.action-btn svg { width: 16px; height: 16px; }
.action-btn--edit:hover { background: #eff6ff; color: #2563eb; }
.action-btn--danger:hover { background: #fef2f2; color: #dc2626; }

.pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid var(--line); flex-wrap: wrap; gap: 12px; }
.pagination-info { font-size: 13px; color: var(--ink-2); }
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
  width: 100%; max-width: 580px; max-height: 90vh;
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

.form-input {
  padding: 9px 12px; border: 1px solid var(--line); border-radius: 8px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s;
}
.form-input:focus { border-color: var(--brand-main); }

.checkbox-group { display: flex; gap: 16px; margin-top: 4px; }
.checkbox-group--wrap { flex-wrap: wrap; gap: 10px 16px; }
.checkbox-group--scroll { max-height: 180px; overflow-y: auto; padding: 4px 0; }
.event-search-input { margin-bottom: 8px; }
.no-results { font-size: 13px; color: #556070; padding: 8px 0; }
.check-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 500; color: var(--ink-2); cursor: pointer;
}
.check-label input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: var(--brand-main); }

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
  .page-header { flex-direction: column; }
}
</style>

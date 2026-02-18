<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Events</h2>
        <p class="page-subtitle">Manage and monitor all events on the platform</p>
      </div>
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

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Event Name</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              <th class="th-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="5" class="empty">No events found</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover">
              <td>
                <div class="cell-main">
                  <div class="icon-box icon-box--indigo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </div>
                  <div>
                    <div class="cell-title">{{ row.name || '—' }}</div>
                    <div class="text-sub">ID: {{ row.id }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="pill pill--blue">{{ row.eventCategory || '—' }}</span>
              </td>
              <td class="text-muted">{{ formatDate(row.eventDate) }}</td>
              <td>
                <span class="status" :class="row.active !== false ? 'status--green' : 'status--red'">
                  <span class="status-dot"></span>
                  {{ row.active !== false ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="td-actions">
                <div class="actions">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { eventsService } from "@/services/events.service";
import { EventCategoryEnum } from "@/enums/EventCategory";

const categoryOptions = Object.values(EventCategoryEnum);
const events = ref([]);
const loading = ref(true);

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
    result = result.filter(e => e.eventCategory === selectedCategory.value);
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

/* ---- actions ---- */
async function remove(event) {
  if (!confirm(`Delete event "${event.name}"?`)) return;
  try {
    await eventsService.remove(event.id);
    events.value = events.value.filter(e => e.id !== event.id);
  } catch (e) {
    console.error("Failed to delete event:", e);
  }
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
</script>

<style scoped>
.admin-page { max-width: 1200px; }

.page-header { margin-bottom: 24px; }
.page-title { font-size: 24px; font-weight: 700; color: var(--neutral-900); margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }

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
.search-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(var(--brand-main-rgb, 79, 70, 229), 0.1); }

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
</style>

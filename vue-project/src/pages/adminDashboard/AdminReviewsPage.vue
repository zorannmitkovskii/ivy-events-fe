<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('admin.reviews.title') }}</h2>
        <p class="page-subtitle">{{ $t('admin.reviews.subtitle') }}</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="search" :placeholder="$t('admin.reviews.searchPh')" class="search-input" />
        </div>
        <select v-model="ratingFilter" class="filter-select">
          <option value="">{{ $t('admin.reviews.allRatings') }}</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ n === 1 ? $t('admin.reviews.star') : $t('admin.reviews.stars') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>{{ $t('admin.reviews.loading') }}</span>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('admin.reviews.thGuest') }}</th>
              <th>{{ $t('admin.reviews.thEvent') }}</th>
              <th>{{ $t('admin.reviews.thRating') }}</th>
              <th>{{ $t('admin.reviews.thComment') }}</th>
              <th>{{ $t('admin.reviews.thDate') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="5" class="empty">{{ $t('admin.reviews.empty') }}</td>
            </tr>
            <tr v-for="row in paginated" :key="row.id" class="row-hover">
              <td>
                <div class="cell-title">{{ row.guestName || row.guestId || '—' }}</div>
              </td>
              <td>
                <div class="cell-title">{{ row.eventName || row.eventId || '—' }}</div>
              </td>
              <td>
                <StarRating :model-value="row.rating" :readonly="true" :size="14" />
              </td>
              <td>
                <div class="text-sub text-sub--wide">{{ row.comment || '—' }}</div>
              </td>
              <td>
                <span class="text-sub">{{ formatDate(row.createdAt) }}</span>
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
import StarRating from "@/components/ui/StarRating.vue";
import { feedbackService } from "@/services/feedback.service";

const feedbacks = ref([]);
const loading = ref(true);

async function fetchData() {
  loading.value = true;
  try {
    const data = await feedbackService.listAll();
    feedbacks.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load reviews:", e);
    feedbacks.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);

/* ---- filters ---- */
const search = ref("");
const ratingFilter = ref("");

watch([search, ratingFilter], () => { page.value = 1; });

const filtered = computed(() => {
  let result = feedbacks.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(r =>
      (r.guestName || r.guestId || "").toLowerCase().includes(q) ||
      (r.eventName || r.eventId || "").toLowerCase().includes(q) ||
      (r.comment || "").toLowerCase().includes(q)
    );
  }
  if (ratingFilter.value) {
    result = result.filter(r => r.rating === Number(ratingFilter.value));
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

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
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

.loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: #64748b; font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: var(--brand-main); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.table-card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
.table-wrap { overflow-x: auto; }

.table { width: 100%; border-collapse: collapse; text-align: left; }
.table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.table th { padding: 14px 20px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.table td { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }

.row-hover { transition: background 0.15s; }
.row-hover:hover { background: #f8fafc; }
.empty { text-align: center; color: #94a3b8; padding: 40px 20px !important; }

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: #94a3b8; margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-sub--wide { max-width: 300px; }

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

@media (max-width: 600px) {
  .page-header { flex-direction: column; }
}
</style>

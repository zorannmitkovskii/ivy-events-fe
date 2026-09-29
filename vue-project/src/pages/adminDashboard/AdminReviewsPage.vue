<template>
  <div class="admin-page">
    <!-- Header -->
    <PageHeader :title="$t('admin.reviews.title')" :subtitle="$t('admin.reviews.subtitle')" />

    <!-- Toolbar -->
    <Toolbar v-model:search="search" :search-placeholder="$t('admin.reviews.searchPh')">
      <template #filters>
        <select v-model="ratingFilter" class="filter-select">
        <option value="">{{ $t('admin.reviews.allRatings') }}</option>
        <option v-for="n in 5" :key="n" :value="n">{{ n }} {{ n === 1 ? $t('admin.reviews.star') : $t('admin.reviews.stars') }}</option>
        </select>
      </template>
    </Toolbar>

    <!-- Table Card -->
    <DataTable
      :columns="columns"
      :rows="paginated"
      row-key="id"
      :loading="loading"
      :loading-label="$t('admin.reviews.loading') "
      :empty-title="$t('admin.reviews.empty')"
    >
      <template #cell-guest="{ row }">
        <div class="cell-title">{{ row.guestName || row.guestId || '—' }}</div>
      </template>

      <template #cell-event="{ row }">
        <div class="cell-title">{{ row.eventName || row.eventId || '—' }}</div>
      </template>

      <template #cell-rating="{ row }">
        <StarRating :model-value="row.rating" :readonly="true" :size="14" />
      </template>

      <template #cell-comment="{ row }">
        <div class="text-sub text-sub--wide">{{ row.comment || '—' }}</div>
      </template>

      <template #cell-date="{ row }">
        <span class="text-sub">{{ formatDate(row.createdAt) }}</span>
      </template>
      <template v-if="filtered.length" #footer>
        <ListPager v-model:page="page" :total-pages="totalPages" :from="startIndex" :to="endIndex" :total="filtered.length" />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import DataTable from '@/components/ui/DataTable.vue'
import ListPager from '@/components/ui/ListPager.vue'
import { useI18n } from 'vue-i18n'
import Toolbar from '@/components/ui/Toolbar.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ref, computed, onMounted, watch } from "vue";
import StarRating from "@/components/ui/StarRating.vue";
import { feedbackService } from "@/services/feedback.service";

const { t: tt } = useI18n()

const columns = computed(() => [
  { key: 'guest', label: tt('admin.reviews.thGuest') },
  { key: 'event', label: tt('admin.reviews.thEvent') },
  { key: 'rating', label: tt('admin.reviews.thRating') },
  { key: 'comment', label: tt('admin.reviews.thComment') },
  { key: 'date', label: tt('admin.reviews.thDate') },
])

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


function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}
</script>

<style scoped>

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

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: var(--ink-4); margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-sub--wide { max-width: 300px; }

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

@media (max-width: 600px) {
  }
</style>

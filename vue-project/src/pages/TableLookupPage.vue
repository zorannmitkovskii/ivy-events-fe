<template>
  <div class="table-lookup">
    <div class="lookup-card">
      <div class="lookup-header">
        <svg class="lookup-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
        </svg>
        <h1 class="lookup-title">{{ t('tableLookup.title') }}</h1>
        <p class="lookup-subtitle">{{ t('tableLookup.subtitle') }}</p>
      </div>

      <div class="search-wrap">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref="searchInput"
          v-model="query"
          type="text"
          class="search-input"
          :placeholder="t('tableLookup.placeholder')"
          autocomplete="off"
        />
        <button v-if="query" class="clear-btn" type="button" @click="query = ''">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <p v-if="query.trim() && query.trim().length < MIN_QUERY" class="lookup-hint">{{ t('tableLookup.hint', { n: MIN_QUERY }) }}</p>

      <!-- Loading -->
      <div v-if="loading" class="state-msg">
        <div class="spinner"></div>
        <span>{{ t('tableLookup.loading') }}</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="state-msg state-msg--error">
        {{ error }}
      </div>

      <!-- Results -->
      <div v-else-if="query.trim().length >= MIN_QUERY" class="results">
        <div v-if="results.length === 0" class="no-results">
          {{ t('tableLookup.noResults') }}
        </div>

        <div
          v-for="guest in results"
          :key="guest.name"
          class="result-card"
        >
          <div class="result-name">{{ guest.name }}</div>
          <div class="result-table">
            <span v-if="guest.tableNumber" class="table-badge">{{ t('tableLookup.tableNumber', { number: guest.tableNumber }) }}</span>
            <span v-else class="table-badge table-badge--none">{{ t('tableLookup.noTable') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getTableInfo } from '@/services/backendApi';

/*
  The page asks the server for the name being typed and shows only what comes
  back. It used to download every guest with their table on load and filter
  here — the whole guest list, to anybody holding the link.
*/
const MIN_QUERY = 3;
const DEBOUNCE_MS = 350;
const TOO_MANY_REQUESTS = 429;

const { t } = useI18n();
const route = useRoute();

const query = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const searchInput = ref(null);

let timer = null;
let latest = 0;

async function search(name) {
  const eventId = route.query.eventId;
  if (!eventId) return;
  const ticket = ++latest;
  loading.value = true;
  error.value = '';
  try {
    const res = await getTableInfo(eventId, name);
    if (ticket !== latest) return;
    results.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    if (ticket !== latest) return;
    results.value = [];
    const status = e?.status ?? e?.response?.status;
    error.value = status === TOO_MANY_REQUESTS ? t('tableLookup.tooMany') : t('tableLookup.error');
  } finally {
    if (ticket === latest) loading.value = false;
  }
}

watch(query, (value) => {
  clearTimeout(timer);
  const name = value.trim();
  if (name.length < MIN_QUERY) {
    latest++;
    results.value = [];
    loading.value = false;
    error.value = '';
    return;
  }
  timer = setTimeout(() => search(name), DEBOUNCE_MS);
});

onMounted(() => searchInput.value?.focus());
</script>

<style scoped>
.table-lookup {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  background: linear-gradient(135deg, #f8f6f1 0%, #ede9e0 100%);
  font-family: var(--font-ui);
}

.lookup-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  padding: 40px 32px;
}

.lookup-header {
  text-align: center;
  margin-bottom: 32px;
}

.lookup-icon {
  color: var(--brand-gold);
  margin-bottom: 16px;
}

.lookup-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px;
}

.lookup-subtitle {
  font-size: 15px;
  color: var(--ink-3);
  margin: 0;
}

/* Search */
.search-wrap {
  position: relative;
  margin-bottom: 24px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-4);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 14px 44px 14px 44px;
  border: 2px solid var(--line);
  border-radius: 12px;
  font-size: 16px;
  color: #1a1a1a;
  background: #fafafa;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--brand-gold);
  box-shadow: 0 0 0 3px rgba(200, 162, 77, 0.15);
  background: #fff;
}

.search-input::placeholder {
  color: var(--ink-4);
}

.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: var(--ink-4);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}

.clear-btn:hover {
  color: var(--ink-2);
  background: var(--sunken);
}

/* States */
.state-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 0;
  font-size: 14px;
  color: var(--ink-3);
}

.lookup-hint {
  margin: 10px 0 0;
  color: #7a7468;
  font-size: 13px;
  text-align: center;
}

.table-badge--none {
  opacity: 0.7;
}

.state-msg--error {
  color: #dc2626;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid var(--line);
  border-top-color: var(--brand-gold);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Results */
.results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.no-results {
  text-align: center;
  padding: 24px 0;
  font-size: 14px;
  color: var(--ink-4);
}

.result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #fafaf9;
  border: 1px solid #f0ece4;
  border-radius: 12px;
  transition: background 0.15s, box-shadow 0.15s;
}

.result-card:hover {
  background: #f5f3ee;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.result-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.table-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, var(--brand-gold), #b8922d);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

@media (max-width: 480px) {
  .lookup-card {
    padding: 28px 20px;
  }

  .lookup-title {
    font-size: 24px;
  }

  .result-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>

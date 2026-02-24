<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('admin.emailSend.title') }}</h2>
        <p class="page-subtitle">{{ $t('admin.emailSend.subtitle') }}</p>
      </div>
      <div class="header-actions">
        <span v-if="selectedEmails.length" class="selected-badge">
          {{ $t('admin.emailSend.selectedCount', { count: selectedEmails.length }) }}
        </span>
        <button class="btn-send" :disabled="sending" @click="handleSend">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          {{ sending ? $t('admin.emailSend.sending') : $t('admin.emailSend.sendBtn') }}
        </button>
      </div>
    </div>

    <!-- Send Config Bar -->
    <div class="config-bar">
      <div class="config-field">
        <label class="config-label">{{ $t('admin.emailSend.templateLabel') }}</label>
        <select v-model="selectedTemplateId" class="filter-select">
          <option value="">{{ $t('admin.emailSend.templatePlaceholder') }}</option>
          <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <div class="config-field config-field--grow">
        <label class="config-label">{{ $t('admin.emailSend.subject') }}</label>
        <input type="text" v-model="subject" :placeholder="$t('admin.emailSend.subjectPh')" class="config-input" />
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" v-model="search" :placeholder="$t('admin.emailSend.searchPh')" class="search-input" />
        </div>
        <select v-model="sourceFilter" class="filter-select" @change="fetchRecipients">
          <option value="">{{ $t('admin.emailSend.allSources') }}</option>
          <option value="LEGACY">{{ $t('admin.emailSend.sourceLegacy') }}</option>
          <option value="CONTACT">{{ $t('admin.emailSend.sourceContact') }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>{{ $t('admin.emailSend.loading') }}</span>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th class="th-check">
                <input type="checkbox" :checked="allFilteredSelected" @change="toggleAll" />
              </th>
              <th>{{ $t('admin.emailSend.thEmail') }}</th>
              <th>{{ $t('admin.emailSend.thDiscountCode') }}</th>
              <th>{{ $t('admin.emailSend.thSource') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginated.length === 0">
              <td colspan="4" class="empty">{{ $t('admin.emailSend.empty') }}</td>
            </tr>
            <tr v-for="row in paginated" :key="row.email" class="row-hover">
              <td class="td-check">
                <input type="checkbox" :value="row.email" v-model="selectedEmails" />
              </td>
              <td>
                <div class="cell-title">{{ row.email }}</div>
              </td>
              <td>
                <span class="text-sub">{{ row.discountCode || '—' }}</span>
              </td>
              <td>
                <span class="pill" :class="sourcePillClass(row.source)">{{ row.source || '—' }}</span>
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

    <!-- Results Modal -->
    <BaseModal :open="resultModalOpen" :title="$t('admin.emailSend.resultTitle')" @close="resultModalOpen = false">
      <div class="result-grid">
        <div class="result-stat">
          <span class="result-label">{{ $t('admin.emailSend.totalRequested') }}</span>
          <span class="result-value">{{ sendResult.totalRequested }}</span>
        </div>
        <div class="result-stat result-stat--green">
          <span class="result-label">{{ $t('admin.emailSend.successCount') }}</span>
          <span class="result-value">{{ sendResult.successCount }}</span>
        </div>
        <div class="result-stat result-stat--red">
          <span class="result-label">{{ $t('admin.emailSend.failedCount') }}</span>
          <span class="result-value">{{ sendResult.failedCount }}</span>
        </div>
      </div>
      <div v-if="sendResult.failedEmails?.length" class="result-failed">
        <p class="result-failed-title">{{ $t('admin.emailSend.failedEmails') }}:</p>
        <ul class="result-failed-list">
          <li v-for="email in sendResult.failedEmails" :key="email">{{ email }}</li>
        </ul>
      </div>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { emailTemplateService } from "@/services/emailTemplate.service";

const recipients = ref([]);
const templates = ref([]);
const loading = ref(true);
const sending = ref(false);

const selectedEmails = ref([]);
const selectedTemplateId = ref("");
const subject = ref("");
const sourceFilter = ref("");

/* follow-up demo fields */
const sendingFollowUp = ref(false);
const ctaLink = ref("");
const senderName = ref("");
const senderContact = ref("");

async function fetchRecipients() {
  loading.value = true;
  try {
    const data = await emailTemplateService.getRecipients(sourceFilter.value || undefined);
    recipients.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load recipients:", e);
    recipients.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchTemplates() {
  try {
    const data = await emailTemplateService.listAll();
    templates.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load templates:", e);
    templates.value = [];
  }
}

onMounted(() => {
  fetchRecipients();
  fetchTemplates();
});

/* ---- filters ---- */
const search = ref("");

watch(search, () => { page.value = 1; });

const filtered = computed(() => {
  let result = recipients.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    result = result.filter(r => (r.email || "").toLowerCase().includes(q));
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
const allFilteredSelected = computed(() => {
  if (filtered.value.length === 0) return false;
  return filtered.value.every(r => selectedEmails.value.includes(r.email));
});

function toggleAll() {
  const filteredSet = new Set(filtered.value.map(r => r.email));
  if (allFilteredSelected.value) {
    // deselect all filtered
    selectedEmails.value = selectedEmails.value.filter(e => !filteredSet.has(e));
  } else {
    // select all filtered (union with existing)
    const existing = new Set(selectedEmails.value);
    for (const email of filteredSet) existing.add(email);
    selectedEmails.value = [...existing];
  }
}

/* ---- helpers ---- */
function sourcePillClass(source) {
  if (source === "LEGACY") return "pill--amber";
  if (source === "CONTACT") return "pill--blue";
  return "pill--gray";
}

/* ---- send flow ---- */
const resultModalOpen = ref(false);
const sendResult = ref({ totalRequested: 0, successCount: 0, failedCount: 0, failedEmails: [] });

async function handleSend() {
  if (!selectedEmails.value.length || !selectedTemplateId.value) return;

  sending.value = true;
  try {
    const payload = {
      templateId: selectedTemplateId.value,
      emails: selectedEmails.value,
      subject: subject.value.trim() || null,
    };
    const res = await emailTemplateService.send(payload);
    sendResult.value = {
      totalRequested: res?.totalRequested ?? selectedEmails.value.length,
      successCount: res?.successCount ?? 0,
      failedCount: res?.failedCount ?? 0,
      failedEmails: res?.failedEmails ?? [],
    };
    resultModalOpen.value = true;
  } catch (e) {
    console.error("Failed to send emails:", e);
  } finally {
    sending.value = false;
  }
}

</script>

<style scoped>
.admin-page { max-width: 1200px; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 24px; font-weight: 700; color: var(--neutral-900); margin: 0; }
.page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0; }

.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.selected-badge {
  padding: 6px 14px; border-radius: 999px;
  background: #eff6ff; color: #2563eb;
  font-size: 13px; font-weight: 600;
}

.btn-send {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border: none; border-radius: 10px;
  background: var(--brand-main); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
}
.btn-send:hover:not(:disabled) { filter: brightness(0.95); }
.btn-send:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-send--secondary { background: #7c3aed; }
.btn-send--secondary:hover:not(:disabled) { background: #6d28d9; }

/* Config bar */
.config-bar {
  display: flex; gap: 16px; padding: 16px 20px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  margin-bottom: 20px; flex-wrap: wrap; align-items: flex-end;
}
.config-field { display: flex; flex-direction: column; gap: 4px; min-width: 200px; }
.config-field--grow { flex: 1; }
.config-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.config-input {
  padding: 9px 14px; border: 1px solid #e2e8f0; border-radius: 10px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.config-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

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

.th-check, .td-check { width: 48px; text-align: center; }
.th-check input, .td-check input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--brand-main); }

.row-hover { transition: background 0.15s; }
.row-hover:hover { background: #f8fafc; }
.empty { text-align: center; color: #94a3b8; padding: 40px 20px !important; }

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 13px; color: #94a3b8; }

.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--blue { background: #eff6ff; color: #2563eb; }
.pill--amber { background: #fffbeb; color: #d97706; }
.pill--gray { background: #f1f5f9; color: #475569; }

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

/* Results modal */
.result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.result-stat {
  padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.result-stat--green { background: #f0fdf4; border-color: #bbf7d0; }
.result-stat--red { background: #fef2f2; border-color: #fecaca; }
.result-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.result-value { font-size: 24px; font-weight: 700; color: #0f172a; }
.result-stat--green .result-value { color: #16a34a; }
.result-stat--red .result-value { color: #dc2626; }

.result-failed { margin-top: 8px; }
.result-failed-title { font-size: 13px; font-weight: 600; color: #dc2626; margin-bottom: 6px; }
.result-failed-list { list-style: disc; padding-left: 20px; font-size: 13px; color: #475569; }
.result-failed-list li { margin-bottom: 2px; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; }
  .config-bar { flex-direction: column; }
  .result-grid { grid-template-columns: 1fr; }
}
</style>

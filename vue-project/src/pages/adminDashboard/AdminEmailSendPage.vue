<template>
  <div class="admin-page">
    <!-- Header -->
    <PageHeader :title="$t('admin.emailSend.title')" :subtitle="$t('admin.emailSend.subtitle')">
      <template #actions>
        <div class="header-actions">
        <span v-if="selectedEmails.length" class="selected-badge">
        {{ $t('admin.emailSend.selectedCount', { count: selectedEmails.length }) }}
        </span>
        <button class="btn-send" :disabled="sending" @click="handleSend">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        {{ sending ? $t('admin.emailSend.sending') : $t('admin.emailSend.sendBtn') }}
        </button>
        </div>
      </template>
    </PageHeader>

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
    <Toolbar v-model:search="search" :search-placeholder="$t('admin.emailSend.searchPh')">
      <template #filters>
        <select v-model="sourceFilter" class="filter-select" @change="fetchRecipients">
        <option value="">{{ $t('admin.emailSend.allSources') }}</option>
        <option value="LEGACY">{{ $t('admin.emailSend.sourceLegacy') }}</option>
        <option value="CONTACT">{{ $t('admin.emailSend.sourceContact') }}</option>
        </select>
      </template>
    </Toolbar>

    <!-- Table Card -->
    <DataTable
      :columns="columns"
      :rows="paginated"
      row-key="id"
      :loading="loading"
      :loading-label="$t('admin.emailSend.loading') "
      :empty-title="$t('admin.emailSend.empty')"
    >
      <template #head-checkbox>
        <input type="checkbox" :checked="allFilteredSelected" @change="toggleAll" />
      </template>

      <template #cell-checkbox="{ row }">
        <input type="checkbox" :value="row.email" v-model="selectedEmails" />
      </template>

      <template #cell-email="{ row }">
        <div class="cell-title">{{ row.email }}</div>
      </template>

      <template #cell-discountCode="{ row }">
        <span class="text-sub">{{ row.discountCode || '—' }}</span>
      </template>

      <template #cell-source="{ row }">
        <span class="pill" :class="sourcePillClass(row.source)">{{ row.source || '—' }}</span>
      </template>
    </DataTable>

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
import DataTable from '@/components/ui/DataTable.vue'
import { useI18n } from 'vue-i18n'
import Toolbar from '@/components/ui/Toolbar.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { ref, computed, onMounted, watch } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { emailTemplateService } from "@/services/emailTemplate.service";

const { t: tt } = useI18n()

const columns = computed(() => [
  { key: 'checkbox', label: '' },
  { key: 'email', label: tt('admin.emailSend.thEmail') },
  { key: 'discountCode', label: tt('admin.emailSend.thDiscountCode') },
  { key: 'source', label: tt('admin.emailSend.thSource') },
])

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
  background: #fff; border: 1px solid var(--line); border-radius: 14px;
  margin-bottom: 20px; flex-wrap: wrap; align-items: flex-end;
}
.config-field { display: flex; flex-direction: column; gap: 4px; min-width: 200px; }
.config-field--grow { flex: 1; }
.config-label { font-size: 12px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; }
.config-input {
  padding: 9px 14px; border: 1px solid var(--line); border-radius: 10px;
  font-size: 14px; background: #fff; outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.config-input:focus { border-color: var(--brand-main); box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }

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

.th-check, .td-check { width: 48px; text-align: center; }
.th-check input, .td-check input { width: 16px; height: 16px; cursor: pointer; accent-color: var(--brand-main); }

.row-hover:hover { background: var(--sunken); }

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 13px; color: var(--ink-4); }

.pill { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.pill--blue { background: #eff6ff; color: #2563eb; }
.pill--amber { background: #fffbeb; color: #d97706; }
.pill--gray { background: var(--sunken); color: var(--ink-2); }

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

/* Results modal */
.result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
.result-stat {
  padding: 16px; border-radius: 12px; background: var(--sunken); border: 1px solid var(--line);
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.result-stat--green { background: #f0fdf4; border-color: #bbf7d0; }
.result-stat--red { background: #fef2f2; border-color: #fecaca; }
.result-label { font-size: 12px; font-weight: 600; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.05em; }
.result-value { font-size: 24px; font-weight: 700; color: var(--ink); }
.result-stat--green .result-value { color: #16a34a; }
.result-stat--red .result-value { color: #dc2626; }

.result-failed { margin-top: 8px; }
.result-failed-title { font-size: 13px; font-weight: 600; color: #dc2626; margin-bottom: 6px; }
.result-failed-list { list-style: disc; padding-left: 20px; font-size: 13px; color: var(--ink-2); }
.result-failed-list li { margin-bottom: 2px; }

@media (max-width: 600px) {
    .config-bar { flex-direction: column; }
  .result-grid { grid-template-columns: 1fr; }
}
</style>

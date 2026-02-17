<template>
  <div class="admin-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ $t('support.title') }}</h2>
        <p class="page-subtitle">{{ $t('support.subtitle') }}</p>
      </div>
      <button class="btn-create" @click="openCreate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        {{ $t('support.newMessage') }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span>{{ $t('support.loading') }}</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="messages.length === 0" class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
      <h3>{{ $t('support.emptyTitle') }}</h3>
      <p>{{ $t('support.emptyText') }}</p>
    </div>

    <!-- Table Card -->
    <div v-else class="table-card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('support.thName') }}</th>
              <th>{{ $t('support.thEmail') }}</th>
              <th>{{ $t('support.thPhone') }}</th>
              <th>{{ $t('support.thSubject') }}</th>
              <th>{{ $t('support.thMessage') }}</th>
              <th>{{ $t('support.thDate') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in messages"
              :key="row.id"
              class="row-hover row-click"
              @click="openEdit(row)"
            >
              <td>
                <div class="cell-title">{{ row.name || '—' }}</div>
              </td>
              <td>
                <div class="text-sub">{{ row.email || '—' }}</div>
              </td>
              <td>
                <div class="text-sub">{{ row.phone || '—' }}</div>
              </td>
              <td>
                <div class="cell-title">{{ row.subject || '—' }}</div>
              </td>
              <td>
                <div class="text-sub text-sub--wide">{{ row.message || '—' }}</div>
              </td>
              <td>
                <span class="text-sub">{{ formatDate(row.createdAt) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <BaseModal :open="dialogOpen" :title="editingId ? $t('support.editMessage') : $t('support.newMessage')" @close="closeDialog">
      <div class="form-fields">
        <div class="form-row">
          <div class="field">
            <label>{{ $t('support.name') }} <span class="req">*</span></label>
            <input v-model="form.name" type="text" class="input" :placeholder="$t('support.namePh')" />
          </div>
          <div class="field">
            <label>{{ $t('support.email') }} <span class="req">*</span></label>
            <input v-model="form.email" type="email" class="input" :placeholder="$t('support.emailPh')" />
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label>{{ $t('support.phone') }}</label>
            <input v-model="form.phone" type="tel" class="input" :placeholder="$t('support.phonePh')" />
          </div>
          <div class="field">
            <label>{{ $t('support.subject') }} <span class="req">*</span></label>
            <input v-model="form.subject" type="text" class="input" :placeholder="$t('support.subjectPh')" />
          </div>
        </div>
        <div class="field">
          <label>{{ $t('support.message') }} <span class="req">*</span></label>
          <textarea v-model="form.message" class="input textarea" :placeholder="$t('support.messagePh')" rows="5"></textarea>
        </div>
        <p v-if="formError" class="form-error">{{ formError }}</p>
      </div>
      <template #footer>
        <button class="btn-cancel" @click="closeDialog">{{ $t('common.cancel') }}</button>
        <button class="btn-save" :disabled="saving" @click="save">
          {{ saving ? $t('support.sending') : (editingId ? $t('common.save') : $t('support.send')) }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import { contactService } from "@/services/contact.service";
import { getEventId } from "@/services/auth.service";
import { onboardingStore } from "@/store/onboarding.store";

const messages = ref([]);
const loading = ref(true);

function currentEventId() {
  return getEventId() || onboardingStore.eventId || "";
}

async function fetchMessages() {
  loading.value = true;
  try {
    const eventId = currentEventId();
    const data = eventId
      ? await contactService.listByEvent(eventId)
      : await contactService.listAll();
    messages.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("Failed to load messages:", e);
    messages.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchMessages);

/* ---- dialog ---- */
const dialogOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref("");

const defaultForm = () => ({
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
});

const form = ref(defaultForm());

function openCreate() {
  editingId.value = null;
  form.value = defaultForm();
  formError.value = "";
  dialogOpen.value = true;
}

function openEdit(row) {
  editingId.value = row.id;
  form.value = {
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    subject: row.subject || "",
    message: row.message || "",
  };
  formError.value = "";
  dialogOpen.value = true;
}

function closeDialog() {
  dialogOpen.value = false;
  editingId.value = null;
  formError.value = "";
}

async function save() {
  formError.value = "";
  if (!form.value.name.trim()) { formError.value = "Name is required"; return; }
  if (!form.value.email.trim()) { formError.value = "Email is required"; return; }
  if (!form.value.subject.trim()) { formError.value = "Subject is required"; return; }
  if (!form.value.message.trim()) { formError.value = "Message is required"; return; }

  const payload = {
    eventId: currentEventId() || undefined,
    name: form.value.name.trim(),
    email: form.value.email.trim(),
    phone: form.value.phone.trim() || undefined,
    subject: form.value.subject.trim(),
    message: form.value.message.trim(),
  };

  saving.value = true;
  try {
    if (editingId.value) {
      const updated = await contactService.update(editingId.value, payload);
      const idx = messages.value.findIndex(m => m.id === editingId.value);
      if (idx !== -1) messages.value[idx] = { ...messages.value[idx], ...updated };
    } else {
      const created = await contactService.create(payload);
      messages.value.unshift(created);
    }
    closeDialog();
  } catch (e) {
    formError.value = e.message || "Failed to save message";
  } finally {
    saving.value = false;
  }
}

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString();
}
</script>

<style scoped>
.admin-page { max-width: 1100px; }

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

.loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px 0; color: #64748b; font-size: 14px; }
.spinner { width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: var(--brand-main); border-radius: 50%; animation: spin 0.6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 60px 24px;
  color: #94a3b8;
}
.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #475569;
  margin: 16px 0 8px;
}
.empty-state p {
  font-size: 14px;
  margin: 0;
}

/* Table */
.table-card { background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden; }
.table-wrap { overflow-x: auto; }

.table { width: 100%; border-collapse: collapse; text-align: left; }
.table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.table th { padding: 14px 20px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
.table td { padding: 14px 20px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.table tbody tr:last-child td { border-bottom: none; }

.row-hover { transition: background 0.15s; }
.row-hover:hover { background: #f8fafc; }
.row-click { cursor: pointer; }

.cell-title { font-weight: 600; color: var(--brand-main); }
.text-sub { font-size: 12px; color: #94a3b8; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-sub--wide { max-width: 300px; }

/* Dialog form */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.req { color: #dc2626; }

.input {
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.input:focus {
  border-color: var(--brand-main);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 100px;
}

.form-error {
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
  margin: 0;
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
  .page-header { flex-direction: column; }
  .form-row { grid-template-columns: 1fr; }
}
</style>

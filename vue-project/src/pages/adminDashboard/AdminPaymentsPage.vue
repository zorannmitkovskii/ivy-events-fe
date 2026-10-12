<template>
  <div>
    <PageHead :title="t('adminPayments.title')" :subtitle="t('adminPayments.subtitle')" />

    <div class="toolbar">
      <div class="filters-row" role="group" :aria-label="t('adminPayments.filterLabel')">
        <button
          v-for="option in statusFilters"
          :key="option.value"
          type="button"
          :data-testid="option.value === AWAITING ? 'filter-awaiting' : undefined"
          :aria-pressed="status === option.value"
          @click="select(option.value)"
        >{{ option.label }}</button>
      </div>
      <span class="muted small">{{
        status === AWAITING ? t('adminPayments.awaiting.count', { n: total }) : t('adminPayments.count', { n: total })
      }}</span>
    </div>

    <!-- CPay round 2 (5): what the last decision did, or why it did not. -->
    <p
      ref="noticeRef"
      class="notice"
      :class="{ 'notice--empty': !notice }"
      role="status"
      aria-live="polite"
      tabindex="-1"
      data-testid="awaiting-notice"
    >{{ notice }}</p>

    <p v-if="status === AWAITING" class="muted intro">{{ t('adminPayments.awaiting.intro') }}</p>

    <!-- Weekly reconciliation with the CPay merchant portal: a period, and the filtered list out. -->
    <template v-else>
      <p class="muted intro">{{ t('adminPayments.reconcileIntro') }}</p>
      <div class="recon">
        <fieldset class="period" data-testid="period">
          <legend>{{ t('adminPayments.period') }}</legend>
          <div class="period__fields">
            <div class="field">
              <label for="payments-from">{{ t('adminPayments.from') }}</label>
              <input
                id="payments-from"
                v-model="from"
                type="date"
                :aria-invalid="periodInvalid ? 'true' : 'false'"
                :aria-describedby="periodInvalid ? 'payments-period-hint payments-period-error' : 'payments-period-hint'"
                data-testid="period-from"
                @change="applyPeriod"
              >
            </div>
            <div class="field">
              <label for="payments-to">{{ t('adminPayments.to') }}</label>
              <input
                id="payments-to"
                v-model="to"
                type="date"
                :aria-invalid="periodInvalid ? 'true' : 'false'"
                :aria-describedby="periodInvalid ? 'payments-period-hint payments-period-error' : 'payments-period-hint'"
                data-testid="period-to"
                @change="applyPeriod"
              >
            </div>
            <button
              v-if="from || to"
              type="button"
              class="act"
              data-testid="period-clear"
              @click="clearPeriod"
            >{{ t('adminPayments.clearPeriod') }}</button>
          </div>
          <small id="payments-period-hint" class="muted">{{ t('adminPayments.periodHint') }}</small>
          <p v-if="periodInvalid" id="payments-period-error" class="field-error" role="alert" data-testid="period-error">
            {{ t('adminPayments.periodInvalid') }}
          </p>
        </fieldset>

        <div class="recon__actions" role="group" :aria-label="t('adminPayments.reconcileActions')">
          <button
            type="button"
            class="act"
            :disabled="exporting || loading || !total || periodInvalid"
            :aria-busy="exporting ? 'true' : 'false'"
            data-testid="copy-list"
            @click="exportList('copy')"
          >{{ exporting === 'copy' ? t('adminPayments.exporting') : t('adminPayments.copyList') }}</button>
          <button
            type="button"
            class="act"
            :disabled="exporting || loading || !total || periodInvalid"
            :aria-busy="exporting ? 'true' : 'false'"
            data-testid="export-csv"
            @click="exportList('csv')"
          >{{ exporting === 'csv' ? t('adminPayments.exporting') : t('adminPayments.exportCsv') }}</button>
        </div>
      </div>
    </template>

    <p v-if="loading" class="empty">{{ t('common.loading') }}</p>

    <p v-else-if="error" class="empty" role="alert">{{ error }}</p>

    <!-- CPay round 2 (5): payments CPay never confirmed, with why, and the admin's decision. -->
    <template v-else-if="status === AWAITING">
      <div v-if="awaiting.length" class="card tbl-card">
        <table class="tbl" data-testid="awaiting-table">
          <caption class="sr-only">{{ t('adminPayments.awaitingFilter') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ t('adminPayments.awaiting.reference') }}</th>
              <th scope="col">{{ t('adminPayments.awaiting.amount') }}</th>
              <th scope="col">{{ t('adminPayments.awaiting.packages') }}</th>
              <th scope="col">{{ t('adminPayments.awaiting.event') }}</th>
              <th scope="col">{{ t('adminPayments.awaiting.customer') }}</th>
              <th scope="col">{{ t('adminPayments.awaiting.created') }}</th>
              <th scope="col">{{ t('adminPayments.awaiting.age') }}</th>
              <th scope="col">{{ t('adminPayments.awaiting.reason') }}</th>
              <th scope="col">{{ t('adminPayments.awaiting.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in awaiting" :key="row.id" :data-testid="`awaiting-row-${row.reference}`">
              <td><code>{{ row.reference || '—' }}</code></td>
              <td class="nowrap">{{ money(row.amount, row.currency) }}</td>
              <td>{{ (row.packageTypes || []).join(', ') || '—' }}</td>
              <td>
                <router-link
                  v-if="row.eventId"
                  :to="{ name: 'admin.events', query: { q: row.eventName || '' } }"
                  :aria-label="t('adminPayments.awaiting.openEvent', { name: row.eventName || row.eventId })"
                >{{ row.eventName || row.eventId }}</router-link>
                <span v-else class="muted">{{ t('adminPayments.awaiting.noEvent') }}</span>
              </td>
              <td>
                <span>{{ row.customerEmail || '—' }}</span>
                <span v-if="row.userId" class="muted small block"><code>{{ row.userId }}</code></span>
              </td>
              <td class="nowrap">{{ row.createdAt ? when(row.createdAt) : '—' }}</td>
              <td class="nowrap">{{ age(row.ageMinutes) }}</td>
              <td>
                <span class="chip" :class="row.status === 'EXPIRED' ? 'no' : 'wait'">
                  {{ t(`adminPayments.statuses.${row.status || 'PENDING'}`) }}
                </span>
                <span class="block small">{{ reasonText(row) }}</span>
              </td>
              <td class="actions">
                <button
                  type="button"
                  class="act act--paid"
                  :data-testid="`mark-paid-${row.reference}`"
                  :aria-label="t('adminPayments.awaiting.markPaidFor', { ref: row.reference })"
                  @click="openDecision(row, 'paid')"
                >{{ t('adminPayments.awaiting.markPaid') }}</button>
                <button
                  type="button"
                  class="act"
                  :data-testid="`mark-failed-${row.reference}`"
                  :aria-label="t('adminPayments.awaiting.markFailedFor', { ref: row.reference })"
                  @click="openDecision(row, 'failed')"
                >{{ t('adminPayments.awaiting.markFailed') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty">{{ t('adminPayments.awaiting.empty') }}</p>

      <div v-if="pages > 1" class="pager">
        <button type="button" :disabled="page === 0" @click="go(page - 1)">{{ t('adminPayments.previous') }}</button>
        <span>{{ t('adminPayments.pageOf', { page: page + 1, pages }) }}</span>
        <button type="button" :disabled="page + 1 >= pages" @click="go(page + 1)">{{ t('adminPayments.next') }}</button>
      </div>
    </template>

    <template v-else-if="payments.length">
      <div class="card tbl-card">
        <table class="tbl" data-testid="payments-table">
          <caption class="sr-only">{{ t('adminPayments.title') }}</caption>
          <thead>
            <tr>
              <th scope="col">{{ t('adminPayments.orderRef') }}</th>
              <th scope="col">{{ t('adminPayments.cpayRef') }}</th>
              <th scope="col">{{ t('adminPayments.customer') }}</th>
              <th scope="col">{{ t('adminPayments.package') }}</th>
              <th scope="col">{{ t('adminPayments.amount') }}</th>
              <th scope="col">{{ t('adminPayments.paidAt') }}</th>
              <th scope="col">{{ t('adminPayments.when') }}</th>
              <th scope="col">{{ t('adminPayments.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.id" :data-testid="`payment-row-${payment.id}`">
              <td><code>{{ payment.providerOrderRef || '—' }}</code></td>
              <td><code data-testid="cpay-ref">{{ payment.providerTransactionRef || '—' }}</code></td>
              <td>{{ payment.customerEmail || '—' }}</td>
              <td>{{ payment.packageType || '—' }}</td>
              <td class="nowrap">{{ money(payment.amount, payment.currency) }}</td>
              <td class="nowrap">{{ payment.paidAt ? when(payment.paidAt) : '—' }}</td>
              <td class="nowrap">{{ payment.createdAt ? when(payment.createdAt) : '—' }}</td>
              <td>
                <span class="chip" :class="toneFor(payment.status)">
                  {{ t(`adminPayments.statuses.${payment.status || 'PENDING'}`) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pages > 1" class="pager">
        <button type="button" :disabled="page === 0" @click="go(page - 1)">{{ t('adminPayments.previous') }}</button>
        <span>{{ t('adminPayments.pageOf', { page: page + 1, pages }) }}</span>
        <button type="button" :disabled="page + 1 >= pages" @click="go(page + 1)">{{ t('adminPayments.next') }}</button>
      </div>
    </template>

    <p v-else class="empty">{{ t('adminPayments.empty') }}</p>

    <BaseModal
      :open="!!decision"
      :title="decision?.kind === 'paid' ? t('adminPayments.awaiting.dialog.paidTitle') : t('adminPayments.awaiting.dialog.failedTitle')"
      @close="closeDecision"
    >
      <form v-if="decision" id="payment-decision-form" class="decision" novalidate @submit.prevent="submitDecision">
        <p class="decision__summary">
          {{ t('adminPayments.awaiting.dialog.summary', { ref: decision.row.reference, amount: money(decision.row.amount, decision.row.currency) }) }}
        </p>
        <p class="decision__warning">
          {{ decision.kind === 'paid' ? t('adminPayments.awaiting.dialog.paidWarning') : t('adminPayments.awaiting.dialog.failedWarning') }}
        </p>

        <div v-if="decision.kind === 'paid'" class="field">
          <label for="decision-provider-ref">{{ t('adminPayments.awaiting.dialog.providerReference') }}</label>
          <input
            id="decision-provider-ref"
            v-model="form.providerReference"
            type="text"
            maxlength="100"
            autocomplete="off"
            required
            aria-required="true"
            :aria-invalid="fieldErrors.providerReference ? 'true' : 'false'"
            :aria-describedby="fieldErrors.providerReference ? 'decision-provider-ref-hint decision-provider-ref-error' : 'decision-provider-ref-hint'"
            data-testid="decision-provider-ref"
          >
          <small id="decision-provider-ref-hint" class="muted">{{ t('adminPayments.awaiting.dialog.providerReferenceHint') }}</small>
          <small v-if="fieldErrors.providerReference" id="decision-provider-ref-error" class="field-error">
            {{ t('adminPayments.awaiting.dialog.required') }}
          </small>
        </div>

        <div class="field">
          <label for="decision-note">{{ t('adminPayments.awaiting.dialog.note') }}</label>
          <textarea
            id="decision-note"
            v-model="form.note"
            rows="3"
            maxlength="1000"
            required
            aria-required="true"
            :aria-invalid="fieldErrors.note ? 'true' : 'false'"
            :aria-describedby="fieldErrors.note ? 'decision-note-hint decision-note-error' : 'decision-note-hint'"
            data-testid="decision-note"
          ></textarea>
          <small id="decision-note-hint" class="muted">{{ t('adminPayments.awaiting.dialog.noteHint') }}</small>
          <small v-if="fieldErrors.note" id="decision-note-error" class="field-error">
            {{ t('adminPayments.awaiting.dialog.required') }}
          </small>
        </div>

        <p v-if="decisionError" class="field-error" role="alert" data-testid="decision-error">{{ decisionError }}</p>
      </form>

      <template #footer>
        <button type="button" class="act" :disabled="saving" @click="closeDecision">
          {{ t('adminPayments.awaiting.dialog.cancel') }}
        </button>
        <button
          type="submit"
          form="payment-decision-form"
          class="act act--paid"
          :disabled="saving"
          :aria-busy="saving ? 'true' : 'false'"
          data-testid="decision-confirm"
        >{{ saving
          ? t('adminPayments.awaiting.dialog.saving')
          : (decision?.kind === 'paid' ? t('adminPayments.awaiting.dialog.confirmPaid') : t('adminPayments.awaiting.dialog.confirmFailed')) }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { paymentsService } from '@/services/payments.service'
import { getErrorMessage } from '@/services/apiError'
import { copyText } from '@/utils/copyText'
import {
  downloadCsv,
  reconciliationFileName,
  toReconciliationCsv,
  toReconciliationTsv,
} from '@/utils/paymentReconciliation'

/*
  Every payment attempt, with what became of it.

  New with the 2026 design, and new on the backend with it: cPay has always
  written a row per attempt, but the only thing that ever read one was the
  status poll after a redirect — a single order, by reference, as plain text.
  Answering "did that order go through" meant opening the database.

  CPay round 2 (5): CPay never notifies the server, so a payment whose return
  was lost stays PENDING. "Awaiting confirmation" lists those (and EXPIRED and
  "needs confirmation" ones) with why, and lets an admin who checked the CPay
  merchant portal mark one paid (with the portal reference) or failed. The
  server settles it exactly as a callback would; a second click or a second
  admin gets 409 and nothing happens twice.

  CPay reconciliation: real CPay data showed OK and FAIL returns sign the same
  fields, so the server refuses a cPayPaymentRef another payment already has
  (CPAY_REF_REUSED — a reason on the awaiting list, and 409 for "mark paid"),
  and an admin compares the SUCCESS payments of a week with the CPay merchant
  portal: the list shows the CPay transaction reference and when it was paid,
  filters by a period, and copies / downloads the filtered rows (reference,
  cPayPaymentRef, amount, currency, paidAt — no personal data).
*/

const ALL = ''
const AWAITING = 'AWAITING'
const PAGE_SIZE = 25
const STATUSES = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELED', 'EXPIRED']
const ALREADY_SETTLED = 'CONFLICT_PAYMENT_ALREADY_SETTLED'
const REF_REUSED = 'CONFLICT_CPAY_REF_REUSED'
// The server's page cap; the export reads the filtered list page by page.
const EXPORT_PAGE_SIZE = 100
const EXPORT_MAX_PAGES = 100

const { t, locale } = useI18n()

const payments = ref([])
const awaiting = ref([])
const status = ref(ALL)
const page = ref(0)
const total = ref(0)
const loading = ref(true)
const error = ref('')
const notice = ref('')
const noticeRef = ref(null)

// Reconciliation period (ISO dates, both days included) and the export in progress ('copy' | 'csv' | '').
const from = ref('')
const to = ref('')
const exporting = ref('')
const periodInvalid = computed(() => !!(from.value && to.value && from.value > to.value))

const decision = ref(null)
const form = reactive({ providerReference: '', note: '' })
const fieldErrors = reactive({ providerReference: false, note: false })
const decisionError = ref('')
const saving = ref(false)

const pages = computed(() => Math.ceil(total.value / PAGE_SIZE) || 1)

// A field that was flagged empty stops saying so once it has a value.
watch(() => form.providerReference, (value) => { if (value.trim()) fieldErrors.providerReference = false })
watch(() => form.note, (value) => { if (value.trim()) fieldErrors.note = false })

const statusFilters = computed(() => [
  { value: ALL, label: t('adminPayments.allStatuses') },
  { value: AWAITING, label: t('adminPayments.awaitingFilter') },
  ...STATUSES.map((value) => ({ value, label: t(`adminPayments.statuses.${value}`) })),
])

onMounted(load)

function select(value) {
  status.value = value
  page.value = 0
  notice.value = ''
  load()
}

function go(next) {
  page.value = next
  load()
}

async function load() {
  loading.value = true
  try {
    const response = status.value === AWAITING
      ? await paymentsService.awaitingConfirmation({ page: page.value, size: PAGE_SIZE })
      : await paymentsService.list({ ...listFilter(), page: page.value, size: PAGE_SIZE })
    const body = response?.data ?? response ?? {}
    const rows = body.content ?? (Array.isArray(body) ? body : [])
    if (status.value === AWAITING) awaiting.value = rows
    else payments.value = rows
    total.value = body.totalElements ?? rows.length
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
  }
}

/** What the plain list is filtered by: the status pill and the period (when valid). */
function listFilter() {
  const filter = { status: status.value || undefined }
  if (!periodInvalid.value) {
    if (from.value) filter.from = from.value
    if (to.value) filter.to = to.value
  }
  return filter
}

function applyPeriod() {
  if (periodInvalid.value) return
  page.value = 0
  notice.value = ''
  load()
}

function clearPeriod() {
  from.value = ''
  to.value = ''
  applyPeriod()
  nextTick(() => document.getElementById('payments-from')?.focus())
}

/** Every payment the current filter matches (not only this page), for the reconciliation. */
async function fetchAllFiltered() {
  const all = []
  for (let next = 0; next < EXPORT_MAX_PAGES; next += 1) {
    const response = await paymentsService.list({ ...listFilter(), page: next, size: EXPORT_PAGE_SIZE })
    const body = response?.data ?? response ?? {}
    const rows = body.content ?? (Array.isArray(body) ? body : [])
    all.push(...rows)
    const totalPages = body.totalPages ?? Math.ceil((body.totalElements ?? rows.length) / EXPORT_PAGE_SIZE)
    if (!rows.length || next + 1 >= totalPages) break
  }
  return all
}

/** Copies the filtered list (tab-separated) or downloads it as CSV; the outcome goes to the status line. */
async function exportList(kind) {
  if (exporting.value || periodInvalid.value) return
  exporting.value = kind
  try {
    const rows = await fetchAllFiltered()
    if (kind === 'copy') {
      const copied = await copyText(toReconciliationTsv(rows))
      notice.value = copied ? t('adminPayments.copied', { n: rows.length }) : t('adminPayments.copyFailed')
    } else {
      downloadCsv(toReconciliationCsv(rows), reconciliationFileName({ status: status.value, from: from.value, to: to.value }))
      notice.value = t('adminPayments.exported', { n: rows.length })
    }
  } catch {
    notice.value = t('adminPayments.exportFailed')
  } finally {
    exporting.value = ''
  }
}

function money(amount, currency) {
  if (amount == null) return '—'
  try {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency: currency || 'MKD',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ${currency || ''}`.trim()
  }
}

const when = (iso) => new Date(iso).toLocaleString(locale.value)

/** How long it has waited: minutes, then hours, then days. */
function age(minutes) {
  const m = Math.max(0, Number(minutes) || 0)
  if (m < 60) return t('adminPayments.awaiting.ageMinutes', { n: m })
  if (m < 60 * 48) return t('adminPayments.awaiting.ageHours', { n: Math.floor(m / 60) })
  return t('adminPayments.awaiting.ageDays', { n: Math.floor(m / (60 * 24)) })
}

function reasonText(row) {
  const key = `adminPayments.awaiting.reasons.${row.reason || 'NO_BANK_RESPONSE'}`
  return t(key, { detail: row.reasonDetail || '—' })
}

/** Green for the one that worked, gold for waiting, red for the rest. */
function toneFor(value) {
  if (value === 'SUCCESS') return 'ok'
  if (value === 'PENDING') return 'wait'
  return 'no'
}

function openDecision(row, kind) {
  form.providerReference = ''
  form.note = ''
  fieldErrors.providerReference = false
  fieldErrors.note = false
  decisionError.value = ''
  decision.value = { row, kind }
}

function closeDecision() {
  if (saving.value) return
  decision.value = null
}

async function submitDecision() {
  if (!decision.value || saving.value) return
  const { row, kind } = decision.value
  fieldErrors.providerReference = kind === 'paid' && !form.providerReference.trim()
  fieldErrors.note = !form.note.trim()
  if (fieldErrors.providerReference || fieldErrors.note) {
    await nextTick()
    document.getElementById(fieldErrors.providerReference ? 'decision-provider-ref' : 'decision-note')?.focus()
    return
  }
  saving.value = true
  decisionError.value = ''
  try {
    if (kind === 'paid') {
      await paymentsService.markPaid(row.id, { providerReference: form.providerReference.trim(), note: form.note.trim() })
    } else {
      await paymentsService.markFailed(row.id, { note: form.note.trim() })
    }
    notice.value = t(`adminPayments.awaiting.done.${kind}`, { ref: row.reference })
    await finishDecision()
  } catch (failure) {
    if (failure?.errorCode === REF_REUSED) {
      // Not paid: the reference is another payment's. The dialog stays, the
      // row (now flagged) is refreshed behind it, focus goes to the reference.
      decisionError.value = t('adminPayments.awaiting.refReused', { id: failure.validationErrors?.paymentId || '—' })
      saving.value = false
      load()
      await nextTick()
      document.getElementById('decision-provider-ref')?.focus()
    } else if (failure?.status === 409 || failure?.errorCode === ALREADY_SETTLED) {
      notice.value = t('adminPayments.awaiting.conflict')
      await finishDecision()
    } else {
      decisionError.value = getErrorMessage(failure)
      saving.value = false
    }
  }
}

/** Closes the dialog, refreshes the list and puts focus on what happened (the row may be gone). */
async function finishDecision() {
  saving.value = false
  decision.value = null
  await load()
  await nextTick()
  noticeRef.value?.focus()
}
</script>

<style scoped>
/* `.toolbar`, `.tbl`, `.card`, `.chip` and `.pager` are the design's, in
   `ivy/dash.css`. Local: the filter pills, the reference column, and the card
   around the table. Not `.tbl-round`: that is the seating plan's round table
   (`aspect-ratio: 1; border-radius: 50%`), and it drew the list in a circle. */
.card.tbl-card {
  padding: 0;
  overflow-x: auto;
}

.filters-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filters-row button {
  padding: 7px 14px;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--card);
  font-size: 14px;
  color: var(--ink-2);
}

.filters-row button[aria-pressed='true'] {
  border-color: var(--ivy);
  background: var(--ivy);
  color: var(--on-ivy);
}

.filters-row button:focus-visible,
.act:focus-visible,
.notice:focus-visible {
  outline: 2px solid var(--ivy);
  outline-offset: 2px;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  color: var(--ink-2);
}

.notice {
  margin: 8px 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--card);
  border: 1px solid var(--line);
}

.notice--empty {
  padding: 0;
  margin: 0;
  border: 0;
}

.intro {
  margin: 4px 0 12px;
}

.recon {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.period {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
  max-width: 100%;
}

.period legend {
  font-weight: 600;
  margin-bottom: 6px;
}

.period__fields {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 12px;
  margin-bottom: 4px;
}

.period__fields .field input {
  min-height: 44px;
  max-width: 100%;
}

.period input:focus-visible,
.field input:focus-visible,
.field textarea:focus-visible {
  outline: 2px solid var(--ivy);
  outline-offset: 2px;
}

.recon__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.block {
  display: block;
}

.nowrap {
  white-space: nowrap;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 220px;
}

.act {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  color: var(--ink);
  font-size: 14px;
}

.act--paid {
  border-color: var(--ivy);
  background: var(--ivy);
  color: var(--on-ivy);
}

.act:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.decision {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.decision__summary {
  font-weight: 600;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field input,
.field textarea {
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  font: inherit;
}

.field-error {
  color: #b42318;
}
</style>

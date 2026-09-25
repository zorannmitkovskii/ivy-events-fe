<template>
  <div>
    <PageHead :title="t('adminPayments.title')" :subtitle="t('adminPayments.subtitle')" />

    <div class="toolbar">
      <div class="filters-row" role="group" :aria-label="t('adminPayments.filterLabel')">
        <button
          v-for="option in statusFilters"
          :key="option.value"
          type="button"
          :aria-pressed="status === option.value"
          @click="select(option.value)"
        >{{ option.label }}</button>
      </div>
      <span class="muted small">{{ t('adminPayments.count', { n: total }) }}</span>
    </div>

    <p v-if="loading" class="empty">{{ t('common.loading') }}</p>

    <p v-else-if="error" class="empty" role="alert">{{ error }}</p>

    <template v-else-if="payments.length">
      <div class="card tbl-card">
        <table class="tbl">
          <thead>
            <tr>
              <th>{{ t('adminPayments.reference') }}</th>
              <th>{{ t('adminPayments.customer') }}</th>
              <th>{{ t('adminPayments.package') }}</th>
              <th>{{ t('adminPayments.amount') }}</th>
              <th>{{ t('adminPayments.when') }}</th>
              <th>{{ t('adminPayments.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in payments" :key="payment.id">
              <td><code>{{ payment.providerOrderRef || '—' }}</code></td>
              <td>{{ payment.customerEmail || '—' }}</td>
              <td>{{ payment.packageType || '—' }}</td>
              <td>{{ money(payment.amount, payment.currency) }}</td>
              <td>{{ payment.createdAt ? when(payment.createdAt) : '—' }}</td>
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/dashboard/shell/PageHead.vue'
import { paymentsService } from '@/services/payments.service'
import { getErrorMessage } from '@/services/apiError'

/*
  Every payment attempt, with what became of it.

  New with the 2026 design, and new on the backend with it: cPay has always
  written a row per attempt, but the only thing that ever read one was the
  status poll after a redirect — a single order, by reference, as plain text.
  Answering "did that order go through" meant opening the database.
*/

const ALL = ''
const PAGE_SIZE = 25
const STATUSES = ['SUCCESS', 'PENDING', 'FAILED', 'CANCELED', 'EXPIRED']

const { t, locale } = useI18n()

const payments = ref([])
const status = ref(ALL)
const page = ref(0)
const total = ref(0)
const loading = ref(true)
const error = ref('')

const pages = computed(() => Math.ceil(total.value / PAGE_SIZE) || 1)

const statusFilters = computed(() => [
  { value: ALL, label: t('adminPayments.allStatuses') },
  ...STATUSES.map((value) => ({ value, label: t(`adminPayments.statuses.${value}`) })),
])

onMounted(load)

function select(value) {
  status.value = value
  page.value = 0
  load()
}

function go(next) {
  page.value = next
  load()
}

async function load() {
  loading.value = true
  try {
    const response = await paymentsService.list({
      status: status.value || undefined,
      page: page.value,
      size: PAGE_SIZE,
    })
    const body = response?.data ?? response ?? {}
    payments.value = body.content ?? (Array.isArray(body) ? body : [])
    total.value = body.totalElements ?? payments.value.length
    error.value = ''
  } catch (failure) {
    error.value = getErrorMessage(failure)
  } finally {
    loading.value = false
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

/** Green for the one that worked, gold for waiting, red for the rest. */
function toneFor(value) {
  if (value === 'SUCCESS') return 'ok'
  if (value === 'PENDING') return 'wait'
  return 'no'
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

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  color: var(--ink-2);
}
</style>

<template>
  <div class="comparison">
    <header class="head">
      <h1>{{ t('quotes.title') }}</h1>
      <p class="sub">{{ t('quotes.subtitle') }}</p>
    </header>

    <p v-if="loading" class="state">{{ t('directory.loading') }}</p>
    <p v-else-if="!rows.length" class="state">{{ t('quotes.empty') }}</p>

    <template v-else>
      <table class="grid">
        <thead>
          <tr>
            <th>{{ t('quotes.vendor') }}</th>
            <th>{{ t('quotes.comparable') }}</th>
            <th>{{ t('quotes.extras') }}</th>
            <th>{{ t('quotes.total') }}</th>
            <th>{{ t('quotes.deposit') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.quoteId" :class="{ cheapest: row.quoteId === cheapestId }">
            <td>
              <span class="vendor">{{ row.vendorName }}</span>
              <span v-if="row.version > 1" class="version">{{ t('quotes.version', { n: row.version }) }}</span>
            </td>

            <!-- The number that actually compares. Shown first and emphasised
                 because the headline total includes extras one vendor chose to
                 offer and another did not. -->
            <td class="money strong">{{ money(row.comparableTotal, row.currency) }}</td>
            <td class="money muted">{{ row.optionalTotal > 0 ? money(row.optionalTotal, row.currency) : '—' }}</td>
            <td class="money">{{ money(row.total, row.currency) }}</td>
            <td class="money muted">{{ row.depositAmount ? money(row.depositAmount, row.currency) : '—' }}</td>

            <td class="actions">
              <button class="btn" @click="accept(row)">{{ t('quotes.accept') }}</button>
              <button class="link-btn" @click="decline(row)">{{ t('quotes.decline') }}</button>
            </td>
          </tr>
        </tbody>
      </table>

      <p class="explain">{{ t('quotes.comparableExplain') }}</p>

      <section class="details">
        <article v-for="row in rows" :key="row.quoteId" class="detail">
          <h2>{{ row.vendorName }}</h2>
          <p v-if="row.expiresAt" class="expiry">{{ t('quotes.expires', { when: formatDate(row.expiresAt) }) }}</p>

          <h3>{{ t('quotes.included') }}</h3>
          <ul><li v-for="line in row.included" :key="line">{{ line }}</li></ul>

          <template v-if="row.optional.length">
            <h3>{{ t('quotes.optional') }}</h3>
            <ul><li v-for="line in row.optional" :key="line">{{ line }}</li></ul>
          </template>
        </article>
      </section>
    </template>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { quotesService } from '@/services/quotes.service'

const { t, locale } = useI18n()

const rows = ref([])
const loading = ref(true)
const error = ref('')

onMounted(load)

async function load() {
  loading.value = true
  try {
    const response = await quotesService.compare()
    rows.value = response?.data ?? response ?? []
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  } finally {
    loading.value = false
  }
}

/** Marked on the comparable total, not the headline one — otherwise a vendor
 *  who bundles an album looks more expensive than one who charges for it. */
const cheapestId = computed(() => {
  if (!rows.value.length) return null
  return rows.value.reduce((best, row) =>
    Number(row.comparableTotal) < Number(best.comparableTotal) ? row : best).quoteId
})

async function accept(row) {
  error.value = ''
  try {
    await quotesService.accept(row.quoteId)
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

async function decline(row) {
  error.value = ''
  try {
    await quotesService.decline(row.quoteId, null)
    await load()
  } catch (e) {
    error.value = e?.detail || e?.message || ''
  }
}

function money(amount, currency) {
  if (amount == null) return '—'
  return `${Number(amount).toLocaleString(locale.value)} ${currency || 'МКД'}`
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(locale.value, { day: 'numeric', month: 'long' })
  } catch {
    return iso
  }
}
</script>

<style scoped>
.comparison { display: flex; flex-direction: column; gap: 16px; padding: 4px; }
.head h1 { margin: 0; font-size: 22px; }
.sub { margin: 4px 0 0; font-size: 13px; color: #6b6b6b; }

.grid { width: 100%; border-collapse: collapse; background: #fff;
  border: 1px solid #ece8e0; border-radius: 10px; overflow: hidden; }
.grid th, .grid td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #f0eee8; }
.grid th { font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #8a8a8a; }
.grid tr.cheapest { background: #f3f7f1; }

.vendor { font-weight: 600; }
.version { margin-left: 8px; font-size: 11px; color: #8a8a8a; }

.money { font-variant-numeric: tabular-nums; white-space: nowrap; }
.money.strong { font-weight: 600; font-size: 15px; }
.money.muted { color: #8a8a8a; }

.actions { display: flex; gap: 12px; align-items: center; }

.explain { margin: 0; font-size: 11.5px; color: #8a8a8a; }

.details { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.detail { padding: 14px; border-radius: 10px; background: #fff; border: 1px solid #ece8e0; }
.detail h2 { margin: 0; font-size: 15px; }
.detail h3 { margin: 12px 0 4px; font-size: 11.5px; text-transform: uppercase;
  letter-spacing: 0.05em; color: #8a8a8a; }
.detail ul { margin: 0; padding-left: 18px; font-size: 13.5px; }
.expiry { margin: 4px 0 0; font-size: 12px; color: #8f6d1f; }

.btn { padding: 7px 14px; border: 0; border-radius: 8px; background: var(--brand);
  color: #fff; font-size: 13px; cursor: pointer; }
.link-btn { border: 0; background: none; color: #a3271f; cursor: pointer; font-size: 13px; }

.state { color: #6b6b6b; }
.error { font-size: 13px; color: #a3271f; }
</style>

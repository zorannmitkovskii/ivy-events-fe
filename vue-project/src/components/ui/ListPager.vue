<template>
  <div class="list-pager">
    <span class="pager-range">{{ t('common.showingRange', { from, to, total }) }}</span>
    <nav v-if="totalPages > 1" class="pager-btns" :aria-label="t('listPager.label')">
      <button type="button" class="pg-btn" :disabled="page <= 1" @click="go(page - 1)">
        {{ t('userDirectory.previous') }}
      </button>
      <template v-for="item in items" :key="item.key">
        <span v-if="item.gap" class="pg-gap" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="pg-btn"
          :class="{ 'pg-btn--active': item.page === page }"
          :aria-current="item.page === page ? 'page' : null"
          @click="go(item.page)"
        >{{ item.page }}</button>
      </template>
      <button type="button" class="pg-btn" :disabled="page >= totalPages" @click="go(page + 1)">
        {{ t('userDirectory.next') }}
      </button>
    </nav>
  </div>
</template>

<script setup>
/**
 * Page controls for the admin lists that page on the client.
 *
 * <p>Every admin list already sliced its rows ten at a time and had next, prev
 * and goto written out — but only the FAQ drew the buttons, so the others
 * showed their first ten rows and nothing past them. One component now, so a
 * list cannot have the paging without the controls again.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/** Page buttons either side of the current one before the list is cut with "…". */
const NEIGHBOURS = 2

const props = defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  from: { type: Number, required: true },
  to: { type: Number, required: true },
  total: { type: Number, required: true },
})

const emit = defineEmits(['update:page'])

const { t } = useI18n()

/** First, last, and a window around the current page; gaps where pages are skipped. */
const items = computed(() => {
  const pages = new Set([1, props.totalPages])
  for (let n = props.page - NEIGHBOURS; n <= props.page + NEIGHBOURS; n++) {
    if (n >= 1 && n <= props.totalPages) pages.add(n)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const out = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push({ key: `gap-${n}`, gap: true })
    out.push({ key: `p-${n}`, page: n })
  })
  return out
})

function go(target) {
  const clamped = Math.min(Math.max(target, 1), props.totalPages)
  if (clamped !== props.page) emit('update:page', clamped)
}
</script>

<style scoped>
.list-pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}
.pager-range { font-size: 13px; color: var(--ink-3); }
.pager-btns { display: flex; flex-wrap: wrap; gap: 4px; }
.pg-btn {
  padding: 6px 12px; border: 1px solid var(--line); border-radius: 8px;
  font-size: 13px; font-weight: 500; background: var(--card, #fff); color: var(--ink-2);
  cursor: pointer; transition: background 0.15s;
}
.pg-btn:hover:not(:disabled) { background: var(--sunken); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-btn--active { background: var(--brand-main); color: #fff; border-color: var(--brand-main); }
.pg-gap { padding: 6px 4px; color: var(--ink-3); }
</style>

<template>
  <div class="table-card">
    <div v-if="title || $slots.header" class="table-card__head">
      <h2 v-if="title">{{ title }}</h2>
      <span v-if="note" class="table-card__note">{{ note }}</span>
      <div class="table-card__head-right"><slot name="header" /></div>
    </div>

    <!-- loading -->
    <div v-if="loading" class="table-card__state" role="status">
      <span class="spinner" aria-hidden="true"></span>
      {{ loadingLabel }}
    </div>

    <!-- failed: named, never a blank table -->
    <EmptyState
      v-else-if="error"
      tone="error"
      :title="errorTitle"
      :body="typeof error === 'string' ? error : ''"
    >
      <template v-if="$slots.retry" #action><slot name="retry" /></template>
    </EmptyState>

    <!-- empty -->
    <slot v-else-if="!rows.length" name="empty">
      <EmptyState tone="no-results" :title="emptyTitle" :body="emptyBody" />
    </slot>

    <div v-else class="table-card__scroll">
      <table>
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[col.align === 'right' ? 'is-right' : '', col.sortable ? 'is-sortable' : '']"
              :style="col.width ? { width: col.width } : null"
              :aria-sort="col.sortable ? ariaSort(sortIdOf(col)) : null"
            >
              <button v-if="col.sortable" type="button" class="sort" @click="toggleSort(sortIdOf(col))">
                {{ col.label }}
                <span class="sort-glyph" aria-hidden="true">{{ sortGlyph(sortIdOf(col)) }}</span>
              </button>
              <!-- A header is not always a word: select-all lives here too. -->
              <slot v-else :name="`head-${col.key}`" :column="col">{{ col.label }}</slot>
              <span v-if="col.note" class="col-note">{{ col.note }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, i) in rows"
            :key="rowKey ? row[rowKey] : i"
            :class="[rowClass ? rowClass(row) : null, { 'is-clickable': clickableRows }]"
            @click="clickableRows && emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="col.align === 'right' ? 'is-right' : ''"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="i">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="footnote || $slots.footer" class="table-card__foot">
      <slot name="footer">{{ footnote }}</slot>
    </div>
  </div>
</template>

<script setup>
import EmptyState from './EmptyState.vue'

/**
 * DataTable — one table, replacing the three implementations the audit found,
 * each with its own header, hover and pagination.
 *
 * It carries the states a table has to have and that were routinely missing:
 * loading, failed (named, never a blank table) and empty. Cells are filled
 * through `#cell-<key>` slots, so a status pill or an action group is markup
 * the caller owns, not a prop the table has to understand.
 *
 * Action buttons stay visible. They used to appear on hover, which meant they
 * were permanently invisible on a touch screen (IVY-1206).
 *
 * `footnote` is where a truncated result set says so — a capped list that
 * looks complete is worse than no list.
 */
const props = defineProps({
  /** [{ key, label, align?: 'right', width? }] */
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  /** Property to key rows by; falls back to the index. */
  rowKey: { type: String, default: '' },

  title: { type: String, default: '' },
  note: { type: String, default: '' },
  footnote: { type: String, default: '' },

  loading: { type: Boolean, default: false },
  loadingLabel: { type: String, default: 'Се вчитува…' },

  /**
   * `true`, or a sentence naming what failed.
   *
   * String comes first on purpose. With Boolean first, Vue casts an empty
   * string to `true` — so a page holding its error in `ref('')` would render
   * "could not be loaded" over a perfectly good table.
   */
  error: { type: [String, Boolean], default: false },
  errorTitle: { type: String, default: 'Не успеа вчитувањето' },

  emptyTitle: { type: String, default: 'Нема ништо за приказ' },
  emptyBody: { type: String, default: '' },

  /**
   * Sorting is reported, never performed here. Ordering the twenty rows on
   * screen would order the page rather than the data set, and the row that
   * matters is exactly the one sitting on page three.
   */
  sortKey: { type: String, default: '' },
  sortDirection: { type: String, default: 'DESC' },

  /**
   * `(row) => classes` — for state the table cannot know about, chiefly a
   * selected row. Kept as a function rather than a `selected` prop so the
   * table never has to hold the selection itself.
   */
  rowClass: { type: Function, default: null },

  /**
   * A whole row as a target. Off by default: a clickable row with buttons in
   * it swallows the buttons unless every one of them stops propagation, so it
   * has to be asked for.
   */
  clickableRows: { type: Boolean, default: false },
})

const emit = defineEmits(['update:sortKey', 'update:sortDirection', 'sort', 'row-click'])

function toggleSort(key) {
  const direction = props.sortKey === key && props.sortDirection === 'DESC' ? 'ASC' : 'DESC'
  emit('update:sortKey', key)
  emit('update:sortDirection', direction)
  emit('sort', { key, direction })
}

/**
 * A column key names the cell; the sort id names it to the server, and the two
 * are not always the same word (activeEvents vs ACTIVE_EVENTS). `sortAs` is
 * what leaves in the request when they differ.
 */
const sortIdOf = (col) => col.sortAs || col.key

const sortGlyph = (key) => (props.sortKey !== key ? '↕' : props.sortDirection === 'ASC' ? '↑' : '↓')
const ariaSort = (key) =>
  props.sortKey !== key ? 'none' : props.sortDirection === 'ASC' ? 'ascending' : 'descending'
</script>

<style scoped>
.table-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-ui);
}

.table-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--line);
}
.table-card__head h2 {
  font-family: var(--font-family);
  font-size: 17px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}
.table-card__note { font-size: 12.5px; color: var(--ink-3); }
.table-card__head-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }

.table-card__scroll { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 13.5px; }

th {
  text-align: left;
  font-size: 11px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-weight: 700;
  padding: 10px 16px;
  white-space: nowrap;
  background: var(--sunken);
  border-bottom: 1px solid var(--line);
}

td {
  padding: 11px 16px;
  border-bottom: 1px solid var(--line);
  vertical-align: middle;
  color: var(--ink);
}
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: var(--dash-sage-ghost); }

tbody tr.is-clickable { cursor: pointer; }
.is-right { text-align: right; font-variant-numeric: tabular-nums; }

.table-card__foot {
  padding: 11px 16px;
  border-top: 1px solid var(--line);
  background: var(--sunken);
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  font-size: 12.5px;
  color: var(--ink-2);
}

.table-card__state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 24px;
  color: var(--ink-2);
  font-size: 13.5px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--line-2);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; border-top-color: var(--line-2); }
}

th.is-sortable { padding: 0; }
.sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  cursor: pointer;
  text-align: left;
}
.sort:hover { color: var(--ink); }
.sort:focus-visible { outline: 2px solid var(--brand); outline-offset: -2px; }
.sort-glyph { color: var(--ink-4); font-size: 10px; }
th[aria-sort]:not([aria-sort='none']) .sort-glyph { color: var(--brand); }
.col-note {
  display: block;
  padding: 0 16px 8px;
  font-size: 10.5px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: var(--ink-4);
}
</style>

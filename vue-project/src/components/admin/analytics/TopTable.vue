<template>
  <section class="top-table">
    <h2>{{ title }}</h2>

    <p v-if="!rows || !rows.length" class="empty">{{ empty || t('siteAnalytics.noData') }}</p>

    <table v-else>
      <tbody>
        <tr v-for="row in rows" :key="row.name">
          <!--
            The bar is drawn relative to the busiest row rather than to a fixed
            scale, so a quiet week is still readable instead of a column of
            slivers.
          -->
          <td class="name" :style="{ '--share': share(row.total) }">
            <span>{{ row.name }}</span>
          </td>
          <td class="total">{{ row.total.toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  title: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  empty: { type: String, default: '' },
})

const { t } = useI18n()

const busiest = computed(() =>
  props.rows?.length ? Math.max(...props.rows.map((row) => row.total)) : 0,
)

function share(total) {
  if (!busiest.value) return '0%'
  return `${Math.round((total / busiest.value) * 100)}%`
}
</script>

<style scoped>
.top-table h2 {
  font-size: 0.95rem;
  margin: 0 0 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

td {
  padding: 0.3rem 0.4rem;
  border-bottom: 1px solid var(--line, #eee);
}

.name {
  position: relative;
  max-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
  background-image: linear-gradient(
    to right,
    var(--mist, #e4ede2) var(--share, 0%),
    transparent 0
  );
  background-repeat: no-repeat;
}

.name span {
  position: relative;
}

.total {
  text-align: right;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.empty {
  color: var(--ink-3, #777);
  font-size: 0.85rem;
  margin: 0;
}
</style>

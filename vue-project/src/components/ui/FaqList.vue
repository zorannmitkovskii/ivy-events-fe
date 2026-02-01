<template>
  <div class="tableWrap">
    <table class="table">
      <thead>
      <tr>
        <th v-for="c in columns" :key="c.key">{{ c.label }}</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="r in rows" :key="r[rowKey]">
        <td v-for="c in columns" :key="c.key">{{ r[c.key] }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, any>>;
  rowKey: string;
}>();
</script>

<style scoped>
.tableWrap { overflow: auto; }
.table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid var(--neutral-300); }
th { color: var(--neutral-700); font-weight: 700; font-size: 12px; }
td { color: var(--neutral-900); }
</style>

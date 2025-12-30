<template>
  <table class="table table-hover align-middle mb-0">
    <thead class="table-light">
    <tr>
      <th v-for="h in headers" :key="h">{{ h }}</th>
    </tr>
    </thead>
    <tbody>
    <tr v-for="row in rows" :key="row.id">
      <slot name="row" :row="row">
        <!-- Default fallback if no slot is provided -->
        <td>{{ row.id }}</td>
        <td>{{ row.name }}</td>
        <td>{{ row.city }}</td>
        <td>{{ row.price }}</td>
      </slot>
    </tr>
    </tbody>
  </table>
</template>

<script setup>
defineProps({
  headers: { type: Array, required: true },
  rows: { type: Array, required: true }
})
</script>

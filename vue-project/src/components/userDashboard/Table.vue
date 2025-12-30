<template>
  <div class="table-responsive brand-table-container">
    <table class="table table-striped align-middle brand-table">
      <thead class="bg-brand-dark text-brand-light">
      <tr>
        <th v-for="column in columns" :key="column.key">
          {{ column.label }}
        </th>
        <th v-if="actions && actions.length > 0" class="text-center">Actions</th>
      </tr>
      </thead>

      <tbody>
      <tr v-for="item in rows" :key="item.id">
        <td v-for="column in columns" :key="column.key">
          {{ item[column.key] }}
        </td>

        <td v-if="actions && actions.length > 0" class="text-center">
          <button
            v-for="action in actions"
            :key="action.label"
            class="btn btn-sm mx-1"
            :class="action.class"
            @click="action.onClick(item)"
          >
            {{ action.label }}
          </button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  actions: { type: Array, required: false },
});
</script>

<style scoped>
.brand-table-container {
  border: 1px solid var(--logo-brown);
  border-radius: 8px;
  padding: 10px;
  background: var(--logo-beige);
}

.brand-table thead {
  background: var(--logo-brown);
  color: var(--logo-beige);
}
</style>

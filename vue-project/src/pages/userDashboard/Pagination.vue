<template>
  <nav v-if="totalPages > 1">
    <ul class="pagination justify-content-center mt-3">

      <!-- Prev -->
      <li class="page-item" :class="{ disabled: page === 1 }">
        <button class="page-link" @click="changePage(page - 1)">
          Previous
        </button>
      </li>

      <!-- Page Numbers -->
      <li
        v-for="n in totalPages"
        :key="n"
        class="page-item"
        :class="{ active: n === page }"
      >
        <button class="page-link" @click="changePage(n)">
          {{ n }}
        </button>
      </li>

      <!-- Next -->
      <li class="page-item" :class="{ disabled: page === totalPages }">
        <button class="page-link" @click="changePage(page + 1)">
          Next
        </button>
      </li>

    </ul>
  </nav>
</template>

<script setup>
const props = defineProps({
  page: Number,
  totalPages: Number
});
const emit = defineEmits(["change"]);

function changePage(newPage) {
  if (newPage >= 1 && newPage <= props.totalPages) {
    emit("change", newPage);
  }
}
</script>

<style scoped>
.page-item.active .page-link {
  background-color: var(--logo-brown);
  border-color: var(--logo-brown);
  color: var(--logo-beige);
}

.page-link {
  color: var(--logo-brown);
}

.page-link:hover {
  background-color: var(--logo-beige);
}
</style>

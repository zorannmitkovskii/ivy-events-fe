<template>
  <div class="d-flex justify-content-between align-items-center mt-3">
    <p class="text-muted mb-0">
      Showing {{ startIndex + 1 }} - {{ endIndex }} of {{ total }}
    </p>

    <nav>
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item" :class="{disabled: page === 1}" @click="$emit('prev')">
          <a class="page-link" href="#">Prev</a>
        </li>

        <li
          class="page-item"
          v-for="n in totalPages"
          :class="{active: n === page}"
          @click="$emit('goto', n)"
        >
          <a class="page-link" href="#">{{ n }}</a>
        </li>

        <li class="page-item"
            :class="{disabled: page === totalPages}"
            @click="$emit('next')">
          <a class="page-link" href="#">Next</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
defineProps({
  page: Number,
  totalPages: Number,
  startIndex: Number,
  endIndex: Number,
  total: Number
})
</script>

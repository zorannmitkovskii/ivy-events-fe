<template>
  <Header />

  <div class="container mt-5">
    <h1>Event Categories</h1>
    <p>Select a category to continue.</p>
  </div>
</template>

<script>
import Header from "@/components/header/Header.vue";

export default {
  name: 'EventCategoryPage',
  components: {Header}
}
</script>

<style scoped>
/* optional styling */
</style>

<template>
  <div class="auth-layout">
    <main class="auth-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// Simple layout for auth pages
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg-main);
  padding: 32px 16px;
}
.auth-content {
  width: 100%;
  max-width: 520px;
}
</style>

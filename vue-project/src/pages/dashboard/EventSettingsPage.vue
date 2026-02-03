<template>
  <div class="page">
    <h1>Event Settings</h1>

    <div class="card">
      Event details form
    </div>

    <div class="card danger">
      <h3>Danger zone</h3>
      <button class="danger-btn">Archive Event</button>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.card {
  background: var(--bg-white);
  padding: 20px;
  border-radius: var(--radius-lg);
  margin-bottom: 16px;
}
.danger {
  border-left: 4px solid var(--error);
}
.danger-btn {
  background: var(--error);
  color: white;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: none;
}
</style>

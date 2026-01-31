<template>
  <section class="card">
    <header v-if="title" class="card-header">
      <h2 class="card-title">{{ title }}</h2>
      <slot name="header-right" />
    </header>

    <div class="card-body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: "" }
});
</script>

<style scoped>
.card {
  background: var(--bg-white);
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

.card-header {
  padding: 16px 18px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--neutral-900);
}

.card-body {
  padding: 14px 18px 18px;
}
</style>

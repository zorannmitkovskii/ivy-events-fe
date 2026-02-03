<template>
  <section class="card">
    <slot />
  </section>
</template>

<style scoped>
.card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: 14px;
}
</style>

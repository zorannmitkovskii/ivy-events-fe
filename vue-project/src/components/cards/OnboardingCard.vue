<template>
  <section class="card">
    <div class="inner">
      <slot />
    </div>
  </section>
</template>

<script setup></script>

<style scoped>
.card {
  width: 100%;
  background: var(--bg-white);
  border-radius: 18px;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.inner {
  padding: 22px 22px 18px;
}
</style>

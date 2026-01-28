<template>
  <section class="auth-layout">
    <div class="auth-layout__left">
      <slot name="left" />
    </div>

    <aside class="auth-layout__right">
      <slot name="right" />
    </aside>
  </section>
</template>

<script setup></script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--bg-main);
}

.auth-layout__left {
  background: #fbfaf7; /* warm ivory like screenshot */
  padding: 28px 22px;
  display: grid;
  justify-items: center;
  align-content: start;
}

.auth-layout__right {
  background: #0b1d16; /* deep green */
  color: var(--bg-white);
  padding: 28px 22px;
  position: relative;
  overflow: hidden;
  display: grid;
  align-content: end;
}

@media (max-width: 980px) {
  .auth-layout {
    grid-template-columns: 1fr;
  }
  .auth-layout__right {
    display: none; /* hide right panel on mobile */
  }
}
</style>

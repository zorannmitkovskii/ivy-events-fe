<template>
  <div class="ornament-divider"></div>
</template>

<style scoped>
.ornament-divider {
  position: relative;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--theme-accent, rgba(216, 180, 180, 0.3)) 20%,
    var(--theme-secondary, rgba(176, 196, 196, 0.3)) 50%,
    var(--theme-accent, rgba(216, 180, 180, 0.3)) 80%,
    transparent
  );
  margin: 2rem auto;
  max-width: 200px;
}
</style>

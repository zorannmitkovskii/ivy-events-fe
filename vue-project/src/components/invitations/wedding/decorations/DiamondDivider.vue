<template>
  <div class="diamond-divider">
    <div class="diamond-icon"></div>
  </div>
</template>

<style scoped>
.diamond-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  opacity: 0.6;
}
.diamond-divider::before,
.diamond-divider::after {
  content: "";
  height: 1px;
  width: 100px;
  background-color: var(--theme-accent, #D4AF37);
  margin: 0 1rem;
}
.diamond-icon {
  width: 12px;
  height: 12px;
  background-color: var(--theme-accent, #D4AF37);
  transform: rotate(45deg);
}
</style>

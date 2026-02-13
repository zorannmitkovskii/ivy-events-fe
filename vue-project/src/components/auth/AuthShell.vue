<template>
  <div class="auth-shell">
    <!-- Decorative background blobs -->
    <div class="blob blob--top" aria-hidden="true"></div>
    <div class="blob blob--bottom" aria-hidden="true"></div>

    <div class="auth-shell__inner">
      <slot />
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.auth-shell {
  min-height: 100vh;
  background: var(--bg-main);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 18px;
  position: relative;
  overflow: hidden;
}

.auth-shell__inner {
  width: 100%;
  max-width: 440px;
  position: relative;
  z-index: 1;
}

.blob {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
}
.blob--top {
  top: -10%;
  left: -5%;
  width: 380px;
  height: 380px;
  background: rgba(191, 210, 164, 0.10);
}
.blob--bottom {
  bottom: -10%;
  right: -5%;
  width: 500px;
  height: 500px;
  background: rgba(200, 162, 77, 0.06);
}
</style>

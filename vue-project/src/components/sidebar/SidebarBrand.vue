<template>
  <div class="brand">
    <div class="row">
      <div class="mark">I</div>
      <div class="logo">IvyEvents</div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped>
.brand { padding: 8px 10px 14px; }
.row { display:flex; align-items:center; gap:10px; }

.mark{
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: rgba(200,162,77,0.95); /* brand-gold */
  color: #1b1b1b;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: 900;
}
.logo {
  font-family: var(--font-family), serif;
  font-size: 22px;
  letter-spacing: .4px;
}
</style>

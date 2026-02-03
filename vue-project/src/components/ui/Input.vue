<template>
  <input class="inp" v-bind="$attrs" />
</template>

<style scoped>
.inp {
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-300);
  outline: none;
}
.inp:focus { border-color: var(--brand-dark); }
</style>

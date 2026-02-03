<template>
  <button class="btn" :class="variantClass">
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{ variant?: "primary" | "secondary" | "ghost" | "danger" }>();

const variantClass = (() => {
  const v = props.variant ?? "primary";
  return `v-${v}`;
})();
</script>

<style scoped>
.btn {
  border: none;
  border-radius: var(--radius-md);
  padding: 10px 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}
.v-primary { background: var(--brand-main); color: var(--bg-main); }
.v-secondary { background: var(--brand-light); color: var(--brand-main); }
.v-ghost { background: transparent; color: var(--brand-main); box-shadow: none; border: 1px solid var(--soft-light); }
.v-danger { background: var(--error); color: var(--bg-main); }
</style>

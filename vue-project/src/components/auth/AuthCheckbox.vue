<template>
  <label class="chk">
    <input class="chk__input" type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />
    <span class="chk__text">
      <slot />
    </span>
  </label>
</template>

<script setup>
defineEmits(["update:modelValue"]);
defineProps({ modelValue: { type: Boolean, default: false } });
</script>

<style scoped>
.chk {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(51, 67, 56, 0.75);
}

.chk__input {
  width: 16px;
  height: 16px;
  accent-color: var(--brand-main);
}

.chk__text a {
  color: var(--neutral-900);
  font-weight: 700;
  text-decoration: none;
}

.chk__text a:hover {
  text-decoration: underline;
}
</style>

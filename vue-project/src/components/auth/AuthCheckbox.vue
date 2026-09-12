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
/* Consent text people are asked to agree to, so it is read at the same size as
   the labels above it rather than at the 12px the August scale gave it.
   Top-aligned: it wraps to two lines and a centred box floats mid-sentence. */
.chk {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-family: var(--font-ui);
  font-size: 14.5px;
  line-height: 1.45;
  color: var(--ink-2);
}

.chk__input {
  width: 18px;
  height: 18px;
  margin-top: 1px;
  flex: none;
  accent-color: var(--moss);
}

.chk__text a {
  color: var(--ink);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.chk__text a:hover {
  text-decoration: underline;
}
</style>

<template>
  <div class="seg">
    <button
      type="button"
      class="seg-btn"
      :class="{ active: modelValue === 'annual' }"
      @click="$emit('update:modelValue', 'annual')"
    >
      {{ $t("checkout.summary.annual") }}
    </button>
    <button
      type="button"
      class="seg-btn"
      :class="{ active: modelValue === 'yearly' }"
      @click="$emit('update:modelValue', 'yearly')"
    >
      {{ $t("checkout.summary.yearly") }}
    </button>
  </div>
</template>

<script setup>
defineProps({ modelValue: { type: String, required: true } });
defineEmits(["update:modelValue"]);
</script>

<style scoped>
.seg {
  display: inline-flex;
  background: var(--bg-white);
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  padding: 3px;
  gap: 3px;
}

.seg-btn {
  border: 0;
  background: transparent;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 800;
  color: rgba(51, 67, 56, 0.70);
  cursor: pointer;
}

.seg-btn.active {
  background: rgba(191, 210, 164, 0.35);
  color: var(--brand-main);
}
</style>

<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>

    <div class="field__control">
      <span class="field__icon" v-if="$slots.icon">
        <slot name="icon" />
      </span>

      <input
        class="field__input"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        autocomplete="off"
      />
    </div>
  </label>
</template>

<script setup>
defineEmits(["update:modelValue"]);

defineProps({
  label: { type: String, required: true },
  placeholder: { type: String, default: "" },
  type: { type: String, default: "text" },
  modelValue: { type: String, default: "" }
});
</script>

<style scoped>
.field {
  display: grid;
  gap: 8px;
}

.field__label {
  font-size: 12px;
  font-weight: 700;
  color: rgba(51, 67, 56, 0.75);
}

.field__control {
  height: 44px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.10);
  background: var(--white);
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  overflow: hidden;
}

.field__icon {
  display: grid;
  place-items: center;
  color: rgba(51, 67, 56, 0.55);
}

.field__input {
  border: 0;
  outline: 0;
  height: 100%;
  padding: 0 12px 0 0;
  font-size: 14px;
  color: var(--neutral-900);
}

.field__control:focus-within {
  border-color: rgba(200, 162, 77, 0.70);
  box-shadow: 0 0 0 4px rgba(200, 162, 77, 0.12);
}
</style>

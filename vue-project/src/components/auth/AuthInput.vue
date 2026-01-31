<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>

    <div class="field__control">
      <!-- icon INSIDE the input, left -->
      <span v-if="$slots.icon" class="field__icon" aria-hidden="true">
        <slot name="icon" />
      </span>

      <input
        class="field__input"
        :type="type"
        :placeholder="placeholder"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :autocomplete="autocomplete"
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
  modelValue: { type: [String, Number], default: "" },
  autocomplete: { type: String, default: "off" }
});
</script>

<style scoped>
.field {
  display: grid;
  gap: 8px;
}

.field__label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(51, 67, 56, 0.75);
}

/* Wrapper that gets focus ring */
.field__control {
  position: relative;
  display: flex;
  align-items: center;

  width: 100%;
  border: 1px solid var(--neutral-300);
  border-radius: 12px;

  background: color-mix(in srgb, var(--bg-main) 30%, transparent);
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Hover like the example */
.field__control:hover {
  background: var(--bg-white);
}

/* Icon sits inside input area */
.field__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: var(--bg-dark-gray);
}

/* Input */
.field__input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;

  padding: 12px 12px 12px 44px; /* LEFT SPACE FOR ICON */
  font-size: 14px;
  color: var(--neutral-900);
}

.field__input::placeholder {
  color: var(--bg-dark-gray);
}

/* Focus ring like example */
.field__control:focus-within {
  border-color: var(--brand-main);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-main) 20%, transparent);
}
input:focus {
  outline: none;
  box-shadow: none;
}
</style>

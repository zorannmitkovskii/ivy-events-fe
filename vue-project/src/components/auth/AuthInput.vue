<template>
  <label class="field">
    <span class="field__label">{{ label }}</span>

    <div class="field__control">
      <!-- icon INSIDE the input, left -->
      <span v-if="$slots.icon" class="field__icon" aria-hidden="true">
        <slot name="icon" />
      </span>

      <DateInput
        v-if="type === 'date'"
        input-class="field__input"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <input
        v-else
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
import DateInput from "@/components/generic/DateInput.vue";

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
/*
  The redesign's field: a small bold label above a plain bordered box on white.
  Gone are the 12px radius, the tinted resting background and the gold focus
  glow — the whole page now has one focus treatment, set in `ivy/bridge.css`.
  The optional leading icon stays; it is the only thing here the mock's fields
  do not have, and dropping it would leave the email and password rows
  indistinguishable at a glance.
*/
.field {
  display: grid;
  gap: 0;
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 700;
}

.field__label {
  margin: 9px 0 0;
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  margin-top: 7px;
  border: 1px solid #d6dcd7;
  border-radius: var(--radius-control);
  background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: var(--ink-4);
}

.field__input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 14px 14px 14px 44px;
  font: 13px var(--font-ui);
  font-weight: 400;
  color: var(--ink);
}

.field__input::placeholder {
  color: var(--ink-4);
}

.field__control:focus-within {
  border-color: var(--brand-mid);
  box-shadow: 0 0 0 3px rgba(23, 55, 43, 0.1);
}

input:focus {
  outline: none;
}
</style>

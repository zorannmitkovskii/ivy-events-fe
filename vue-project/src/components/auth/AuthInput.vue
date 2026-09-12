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
  A field in the September system: a semibold label over a bordered box on the
  card surface, matching `.form label` on the contact page so the two forms on
  the public site are recognisably the same control.

  The 9px letter-spaced label and the hard-coded #fff were the August scale.
  The leading icon stays — it is the only thing here the design's own fields do
  not have, and without it the email and password rows are indistinguishable at
  a glance.
*/
.field {
  display: grid;
  gap: 6px;
  font-family: var(--font-ui);
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink-2);
}

.field__label {
  margin: 0;
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 50px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--card);
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
  color: var(--ink-3);
}

.field__input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  padding: 13px 14px 13px 44px;
  font-family: var(--font-ui);
  font-size: 16px;
  font-weight: 400;
  color: var(--ink);
}

.field__input::placeholder {
  color: var(--ink-3);
}

/* The same ring the contact form and every native control get, from
   `ivy/bridge.css` — one focus treatment on the whole site. */
.field__control:focus-within {
  border-color: var(--brand-mid);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--moss) 30%, transparent);
}

input:focus {
  outline: none;
}
</style>

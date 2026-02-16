<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <span class="font-body text-sm text-gray-700">
        {{ label }}
        <span v-if="required" class="text-pink-500">*</span>
      </span>

      <IconButton :aria-label="addLabel" @click="add">
        <span class="text-lg leading-none">＋</span>
      </IconButton>
    </div>

    <div class="space-y-3">
      <div v-for="(n, idx) in safeNames" :key="idx" class="flex gap-3 items-center">
        <BaseInput
          :id="idFor(idx)"
          :model-value="n"
          :placeholder="placeholder"
          autocomplete="name"
          @update:modelValue="(v) => updateAt(idx, v)"
          @enter="onEnter(idx)"
        />

        <IconButton
          :aria-label="removeLabel"
          :disabled="safeNames.length <= minItems"
          @click="remove(idx)"
        >
          <span>🗑️</span>
        </IconButton>
      </div>
    </div>

    <p class="mt-2 text-xs text-gray-500" v-if="hint">{{ hint }}</p>
    <p class="mt-2 text-sm text-gray-600">
      Total guests: <span class="font-semibold">{{ guestCount }}</span>
    </p>
  </div>
</template>

<script setup>
import { computed, nextTick } from "vue";
import IconButton from "@/components/ui/IconButton.vue";
import BaseInput from "@/components/invitations/wedding/forms/BaseInput.vue";

const props = defineProps({
  modelValue: { type: Array, default: () => [""] },
  label: { type: String, default: "Guests (Full name)" },
  placeholder: { type: String, default: "Full name" },
  hint: { type: String, default: "" },
  required: { type: Boolean, default: true },
  minItems: { type: Number, default: 1 },
  addLabel: { type: String, default: "Add another full name" },
  removeLabel: { type: String, default: "Remove" },
});

const emit = defineEmits(["update:modelValue"]);

const safeNames = computed(() => {
  const arr = Array.isArray(props.modelValue) ? props.modelValue : [];
  return arr.length ? arr : [""];
});

const guestCount = computed(() =>
  safeNames.value.map(s => (s ?? "").trim()).filter(Boolean).length
);

function idFor(i) {
  return `guest-fullname-${i}`;
}

function setValue(next) {
  emit("update:modelValue", next.length ? next : [""]);
}

function updateAt(index, value) {
  const next = [...safeNames.value];
  next[index] = value;
  setValue(next);
}

async function add() {
  const next = [...safeNames.value, ""];
  setValue(next);
  await nextTick();
  document.getElementById(idFor(next.length - 1))?.focus?.();
}

function remove(index) {
  if (safeNames.value.length <= props.minItems) return;
  setValue(safeNames.value.filter((_, i) => i !== index));
}

function onEnter(index) {
  const isLast = index === safeNames.value.length - 1;
  const hasText = (safeNames.value[index] ?? "").trim().length > 0;
  if (isLast && hasText) add();
}
</script>

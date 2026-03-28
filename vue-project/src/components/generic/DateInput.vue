<template>
  <div class="date-input-wrap">
    <input
      ref="textRef"
      type="text"
      :class="inputClass"
      :value="displayValue"
      :placeholder="placeholder"
      maxlength="10"
      @input="onTextInput"
      @blur="onBlur"
    />
    <input
      ref="pickerRef"
      type="date"
      class="date-input-hidden"
      :value="modelValue"
      @input="onPickerChange"
    />
    <button type="button" class="date-input-btn" @click="openPicker" tabindex="-1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: { type: String, default: '' },
  inputClass: { type: [String, Array, Object], default: 'input' },
  placeholder: { type: String, default: 'dd/mm/yyyy' },
});

const emit = defineEmits(['update:modelValue', 'input']);

const pickerRef = ref(null);

// yyyy-mm-dd → dd/mm/yyyy
const displayValue = computed(() => {
  if (!props.modelValue) return '';
  const parts = props.modelValue.split('-');
  if (parts.length !== 3) return props.modelValue;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
});

// dd/mm/yyyy → yyyy-mm-dd
function parseDisplay(text) {
  const parts = text.split('/');
  if (parts.length !== 3) return '';
  const [dd, mm, yyyy] = parts;
  if (dd.length !== 2 || mm.length !== 2 || yyyy.length !== 4) return '';
  return `${yyyy}-${mm}-${dd}`;
}

function onTextInput(e) {
  let val = e.target.value.replace(/[^\d/]/g, '');
  // Auto-insert slashes
  const digits = val.replace(/\//g, '');
  if (digits.length >= 4 && !val.includes('/')) {
    val = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4, 8);
  } else if (digits.length >= 2 && val.split('/').length < 2) {
    val = digits.slice(0, 2) + '/' + digits.slice(2);
  }
  e.target.value = val;

  if (val.length === 10) {
    const iso = parseDisplay(val);
    if (iso) {
      emit('update:modelValue', iso);
      emit('input', iso);
    }
  }
}

function onBlur(e) {
  const val = e.target.value;
  if (val && val.length === 10) {
    const iso = parseDisplay(val);
    if (iso) {
      emit('update:modelValue', iso);
      emit('input', iso);
    }
  } else if (!val) {
    emit('update:modelValue', '');
    emit('input', '');
  }
}

function onPickerChange(e) {
  const val = e.target.value;
  emit('update:modelValue', val);
  emit('input', val);
}

function openPicker() {
  pickerRef.value?.showPicker?.();
}
</script>

<style scoped>
.date-input-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.date-input-wrap > input:first-child {
  padding-right: 36px;
}

.date-input-hidden {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.date-input-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--neutral-400, #9ca3af);
  display: flex;
  align-items: center;
  transition: color 0.15s;
}

.date-input-btn:hover {
  color: var(--neutral-600, #4b5563);
}
</style>

<template>
  <BaseModal :open="open" :title="t('editSection.rsvp')" @close="emit('close')">
    <div class="rsvp-modal">
      <!-- RSVP Deadline -->
      <div class="field field--row">
        <div class="field-left">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <label class="field-label">{{ t('editSection.rsvpDeadline') }}</label>
        </div>
        <DateInput input-class="field-input field-input--compact" :model-value="localDeadline" @update:model-value="localDeadline = $event; emitChange()" />
      </div>

      <div class="field-divider"></div>

      <!-- Max Guests -->
      <div class="field field--row">
        <div class="field-left">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <label class="field-label">{{ t('editSection.maxGuests') }}</label>
        </div>
        <div class="stepper">
          <button class="stepper-btn" :disabled="localMaxGuests <= 1" @click="localMaxGuests--; emitChange()">-</button>
          <span class="stepper-value">{{ localMaxGuests }}</span>
          <button class="stepper-btn" :disabled="localMaxGuests >= 10" @click="localMaxGuests++; emitChange()">+</button>
        </div>
      </div>

      <div class="field-divider"></div>

      <!-- Contact Method -->
      <div class="field">
        <div class="field-left">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <label class="field-label">{{ t('editSection.contactMethod') }}</label>
        </div>
        <div class="chip-row">
          <button
            v-for="m in CONTACT_METHODS"
            :key="m.key"
            class="chip"
            :class="{ 'chip--active': localContactMethod === m.key }"
            @click="localContactMethod = m.key; emitChange()"
          >{{ m.label }}</button>
        </div>
      </div>

      <div class="field-divider"></div>

      <!-- Border Radius -->
      <div class="field">
        <div class="field-left">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" ry="5"/></svg>
          <label class="field-label">{{ t('editSection.borderRadius') }}</label>
        </div>
        <div class="radius-chips">
          <button
            v-for="r in RADIUS_OPTIONS"
            :key="r"
            class="radius-chip"
            :class="{ 'radius-chip--active': localRadius === r }"
            @click="localRadius = r; emitChange()"
          >
            <span class="radius-preview" :style="{ borderRadius: r }"></span>
          </button>
        </div>
      </div>
    </div>

    <template v-if="!liveEdit" #footer>
      <ButtonMain variant="outline" type="button" @click="emit('close')">Cancel</ButtonMain>
      <ButtonMain variant="main" type="button" @click="onSave">{{ t('editSection.save') }}</ButtonMain>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/components/ui/BaseModal.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import DateInput from '@/components/generic/DateInput.vue';

const { t } = useI18n();

const RADIUS_OPTIONS = ['4px', '8px', '12px', '24px'];
const CONTACT_METHODS = [
  { key: 'email', label: '' },
  { key: 'sms', label: '' },
  { key: 'both', label: '' },
];
CONTACT_METHODS[0].label = t('editSection.emailOption');
CONTACT_METHODS[1].label = t('editSection.smsOption');
CONTACT_METHODS[2].label = t('editSection.bothOption');

const props = defineProps({
  open: { type: Boolean, default: false },
  liveEdit: { type: Boolean, default: false },
  rsvpDeadline: { type: String, default: '' },
  maxGuests: { type: Number, default: 5 },
  borderRadius: { type: String, default: '8px' },
  contactMethod: { type: String, default: 'email' },
});

const emit = defineEmits(['close', 'save', 'change']);

const localDeadline = ref(props.rsvpDeadline);
const localMaxGuests = ref(props.maxGuests);
const localRadius = ref(props.borderRadius);
const localContactMethod = ref(props.contactMethod);

watch(() => props.open, (v) => {
  if (v) {
    localDeadline.value = props.rsvpDeadline;
    localMaxGuests.value = props.maxGuests;
    localRadius.value = props.borderRadius;
    localContactMethod.value = props.contactMethod;
  }
}, { immediate: true });

function getPayload() {
  return {
    deadline: localDeadline.value,
    maxGuests: localMaxGuests.value,
    borderRadius: localRadius.value,
    contactMethod: localContactMethod.value,
  };
}

function emitChange() {
  if (props.liveEdit) {
    emit('change', getPayload());
  }
}

function onSave() {
  emit('save', getPayload());
}
</script>

<style scoped>
.rsvp-modal {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field--row {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.field-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-icon {
  width: 18px;
  height: 18px;
  color: #6b7280;
  flex-shrink: 0;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.field-divider {
  height: 1px;
  background: #f3f4f6;
}

.field-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  font-family: inherit;
}

.field-input--compact {
  padding: 6px 10px;
  font-size: 13px;
}

.field-input:focus {
  outline: none;
  border-color: #6b7280;
}

/* Stepper */
.stepper {
  display: flex;
  align-items: center;
  gap: 0;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 2px;
}

.stepper-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.stepper-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-value {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  min-width: 28px;
  text-align: center;
}

/* Toggle */
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: #d1d5db;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle--sm {
  width: 36px;
  height: 20px;
  border-radius: 10px;
}

.toggle--on {
  background: #059669;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle--sm .toggle-knob {
  width: 16px;
  height: 16px;
}

.toggle--on .toggle-knob {
  transform: translateX(20px);
}

.toggle--sm.toggle--on .toggle-knob {
  transform: translateX(16px);
}

/* Chips */
.chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  padding: 6px 14px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.15s;
  font-family: inherit;
}

.chip:hover {
  border-color: #9ca3af;
}

.chip--active {
  border-color: #1f2937;
  background: #f3f4f6;
  font-weight: 600;
}

/* Questions list */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
}

.question-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

.question-label {
  font-size: 13px;
  color: #6b7280;
}

/* Radius chips */
.radius-chips {
  display: flex;
  gap: 8px;
}

.radius-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.radius-chip:hover {
  border-color: #9ca3af;
}

.radius-chip--active {
  border-color: #1f2937;
  background: #f3f4f6;
}

.radius-preview {
  width: 22px;
  height: 22px;
  border: 2px solid #9ca3af;
  background: #f9fafb;
  transition: border-color 0.15s;
}

.radius-chip--active .radius-preview {
  border-color: #374151;
  background: #e5e7eb;
}
</style>

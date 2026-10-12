<template>
  <BaseModal :open="open" :title="t('editSection.rsvp')" @close="emit('close')">
    <div class="rsvp-modal">
      <!-- INV-602: a reply form switched off (saved that way) — guests cannot
           answer; the way to switch it back on is here, where the preview's
           note leads. -->
      <SectionStateNotice v-if="hidden" kind="rsvp" state="hidden" @show="emit('show')" />
      <!--
        INV-401: what guests see in the RSVP section. The message is the one
        the invitation shows above the form (same source as the preview), so it
        changes as the deadline or the event date changes.
      -->
      <FieldGuide
        :id="guideId"
        section
        :guests="t('editSection.guide.rsvp.guests')"
        :example="guestMessage"
        :example-label="t('editSection.guide.rsvp.messageLabel')"
      >
        <p v-if="!guestMessage" class="rsvp-guide-empty" data-testid="rsvp-guide-empty">{{ t('editSection.guide.rsvp.noMessage') }}</p>
      </FieldGuide>

      <!-- RSVP Deadline -->
      <div class="field field--row" data-rsvp-field="deadline">
        <div class="field-left">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <label class="field-label" :for="ids.deadline">{{ t('editSection.rsvpDeadline') }}</label>
        </div>
        <DateInput
          :input-id="ids.deadline"
          :described-by="deadlineDescribedBy"
          :invalid="!!deadlineProblem"
          input-class="field-input field-input--compact" :model-value="localDeadline" @update:model-value="localDeadline = $event; emitChange()" />
      </div>
      <p v-if="!localDeadline" :id="ids.deadlineHint" class="deadline-hint" data-testid="rsvp-deadline-default">{{ t('editSection.guide.rsvp.deadlineDefault') }}</p>
      <p v-if="deadlineProblem" :id="ids.deadlineError" class="deadline-warning" role="alert" data-testid="rsvp-deadline-warning">
        <span aria-hidden="true">! </span>{{ t('editSection.rsvpDeadlineProblem.' + deadlineProblem, { timezone: eventTimezone }) }}
      </p>

      <div class="field-divider"></div>

      <!-- Max Guests -->
      <div class="field field--row">
        <div class="field-left">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          <span :id="ids.maxGuests" class="field-label">{{ t('editSection.maxGuests') }}</span>
        </div>
        <div class="stepper" role="group" :aria-labelledby="ids.maxGuests">
          <button type="button" class="stepper-btn" :aria-label="t('editSection.a11y.decrease', { label: t('editSection.maxGuests') })" :disabled="localMaxGuests <= 1" @click="localMaxGuests--; emitChange()">-</button>
          <span class="stepper-value" aria-live="polite" data-testid="rsvp-max-guests">{{ localMaxGuests }}</span>
          <button type="button" class="stepper-btn" :aria-label="t('editSection.a11y.increase', { label: t('editSection.maxGuests') })" :disabled="localMaxGuests >= 10" @click="localMaxGuests++; emitChange()">+</button>
        </div>
      </div>

      <div class="field-divider"></div>

      <!-- Contact Method -->
      <div class="field">
        <div class="field-left">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span :id="ids.contact" class="field-label">{{ t('editSection.contactMethod') }}</span>
        </div>
        <!-- INV-503: the chosen option is pressed and ticked, not only darker -->
        <div class="chip-row" role="group" :aria-labelledby="ids.contact">
          <button
            v-for="m in CONTACT_METHODS"
            :key="m.key"
            type="button"
            class="chip"
            :class="{ 'chip--active': localContactMethod === m.key }"
            :aria-pressed="localContactMethod === m.key ? 'true' : 'false'"
            @click="localContactMethod = m.key; emitChange()"
          ><span v-if="localContactMethod === m.key" aria-hidden="true">✓ </span>{{ t('editSection.' + m.key + 'Option') }}</button>
        </div>
      </div>

      <div class="field-divider"></div>

      <!-- Border Radius -->
      <div class="field">
        <div class="field-left">
          <svg class="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" ry="5"/></svg>
          <span :id="ids.radius" class="field-label">{{ t('editSection.borderRadius') }}</span>
        </div>
        <div class="radius-chips" role="group" :aria-labelledby="ids.radius">
          <button
            v-for="r in RADIUS_OPTIONS"
            :key="r"
            type="button"
            class="radius-chip"
            :class="{ 'radius-chip--active': localRadius === r }"
            :aria-pressed="localRadius === r ? 'true' : 'false'"
            :aria-label="t('editSection.a11y.radius', { value: r })"
            @click="localRadius = r; emitChange()"
          >
            <span class="radius-preview" :style="{ borderRadius: r }" aria-hidden="true"></span>
            <span v-if="localRadius === r" class="radius-check" aria-hidden="true">✓</span>
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
import { ref, watch, computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '@/components/ui/BaseModal.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import DateInput from '@/components/generic/DateInput.vue';
import FieldGuide from '@/components/invitations/shared/FieldGuide.vue';
import SectionStateNotice from '@/components/invitations/shared/SectionStateNotice.vue';
import { DEFAULT_TIMEZONE, rsvpDeadlineProblem } from '@/utils/eventBasics';

const { t } = useI18n();

const RADIUS_OPTIONS = ['4px', '8px', '12px', '24px'];
// Labels are read in the template, so they follow a language change.
const CONTACT_METHODS = [{ key: 'email' }, { key: 'sms' }, { key: 'both' }];

const props = defineProps({
  open: { type: Boolean, default: false },
  liveEdit: { type: Boolean, default: false },
  rsvpDeadline: { type: String, default: '' },
  maxGuests: { type: Number, default: 5 },
  borderRadius: { type: String, default: '8px' },
  contactMethod: { type: String, default: 'email' },
  // INV-104: the deadline is the end of that day where the event is, checked
  // in the event's zone — not the browser's.
  eventDateTime: { type: String, default: '' },
  eventTimezone: { type: String, default: DEFAULT_TIMEZONE },
  // INV-401: the line the guests read above the form, as the preview shows it.
  guestMessage: { type: String, default: '' },
  // INV-602: the RSVP section is hidden on the invitation.
  hidden: { type: Boolean, default: false },
});

const guideId = `${useId()}-rsvp-guide`;
const uid = useId();
const ids = {
  deadline: `${uid}-deadline`,
  deadlineHint: `${uid}-deadline-hint`,
  deadlineError: `${uid}-deadline-error`,
  maxGuests: `${uid}-max-guests`,
  contact: `${uid}-contact`,
  radius: `${uid}-radius`,
};

const emit = defineEmits(['close', 'save', 'change', 'show']);

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

// INV-801: the settings changed from outside while the panel is open (undo /
// redo) — the fields show them. Nothing is emitted: they are not a new change.
watch(() => props.rsvpDeadline, (v) => { localDeadline.value = v; });
watch(() => props.maxGuests, (v) => { localMaxGuests.value = v; });
watch(() => props.borderRadius, (v) => { localRadius.value = v; });
watch(() => props.contactMethod, (v) => { localContactMethod.value = v; });

const deadlineProblem = computed(() => {
  const wall = props.eventDateTime || '';
  return rsvpDeadlineProblem(
    localDeadline.value,
    /^\d{4}-\d{2}-\d{2}/.test(wall) ? wall.slice(0, 10) : '',
    /T(\d{2}:\d{2})/.exec(wall)?.[1] || '',
    props.eventTimezone,
  );
});

// INV-503: the deadline field is read with its default note and its problem.
const deadlineDescribedBy = computed(() => [
  !localDeadline.value && ids.deadlineHint,
  deadlineProblem.value && ids.deadlineError,
].filter(Boolean).join(' '));

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
.deadline-hint {
  margin: -6px 0 0;
  font-size: 12px;
  color: var(--neutral-600, var(--ink-3));
}

.rsvp-guide-empty {
  margin: 0;
}

.deadline-warning {
  margin: 6px 0 0;
  font-size: 12px;
  color: #b42318;
}

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
  color: var(--ink-3);
  flex-shrink: 0;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

.field-divider {
  height: 1px;
  background: var(--sunken);
}

.field-input {
  padding: 10px 12px;
  border: 1px solid var(--line-2);
  border-radius: 8px;
  font-size: 14px;
  color: var(--ink);
  font-family: inherit;
}

.field-input--compact {
  padding: 6px 10px;
  font-size: 13px;
}

.field-input:focus {
  outline: none;
  border-color: var(--ink-3);
}

/* Stepper */
.stepper {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--sunken);
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
  color: var(--ink-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.stepper-btn:hover:not(:disabled) {
  background: var(--line);
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  min-width: 28px;
  text-align: center;
}

/* Toggle */
.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: var(--line-2);
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
  border: 2px solid var(--line);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  cursor: pointer;
  transition: border-color 0.15s;
  font-family: inherit;
}

.chip:hover {
  border-color: var(--ink-4);
}

.radius-chip {
  position: relative;
}

.radius-check {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--ink, #1f2937);
  color: #fff;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
}

.chip:focus-visible,
.radius-chip:focus-visible,
.stepper-btn:focus-visible,
.field-input:focus-visible {
  outline: 3px solid var(--moss, #5e7f58);
  outline-offset: 2px;
}

.chip--active {
  border-color: var(--ink);
  background: var(--sunken);
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
  color: var(--ink-3);
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
  border: 2px solid var(--line);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}

.radius-chip:hover {
  border-color: var(--ink-4);
}

.radius-chip--active {
  border-color: var(--ink);
  background: var(--sunken);
}

.radius-preview {
  width: 22px;
  height: 22px;
  border: 2px solid var(--ink-4);
  background: var(--sunken);
  transition: border-color 0.15s;
}

.radius-chip--active .radius-preview {
  border-color: var(--ink-2);
  background: var(--line);
}
</style>

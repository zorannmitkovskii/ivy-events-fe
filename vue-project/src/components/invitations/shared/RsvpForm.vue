<template>
  <div class="rsvp-form" :style="cssVars">
    <h2 class="rsvp-title">{{ title }}</h2>
    <p v-if="subtitle" class="rsvp-subtitle">{{ subtitle }}</p>

    <form class="form" @submit.prevent="onSubmit">
      <!-- Guest names -->
      <div class="guests-block">
        <label class="field-label">{{ nameLabel }}</label>
        <div
          v-for="(guest, idx) in guests"
          :key="idx"
          class="guest-entry"
        >
          <div class="guest-row">
            <input
              v-model="guest.fullName"
              type="text"
              class="field-input"
              :placeholder="namePlaceholder"
              required
            />
            <button
              v-if="guests.length > 1"
              type="button"
              class="remove-guest-btn"
              :aria-label="'Remove guest ' + (idx + 1)"
              @click="removeGuest(idx)"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <label class="child-toggle">
            <input type="checkbox" v-model="guest.isChild" />
            <span>{{ childLabel }}</span>
          </label>
        </div>
        <button
          v-if="guests.length < maxGuests"
          type="button"
          class="add-guest-btn"
          @click="addGuest"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          {{ addGuestLabel }}
        </button>
      </div>

      <!-- Notification Type -->
      <div class="field-group">
        <label class="field-label">{{ resolvedNotificationLabel }}</label>
        <div class="attendance-row">
          <label class="radio-card" :class="{ 'radio-card--selected-accent': notificationType === 'email' }">
            <input v-model="notificationType" type="radio" value="email" class="sr-only" />
            <span>{{ resolvedEmailOptionLabel }}</span>
          </label>
          <label class="radio-card" :class="{ 'radio-card--selected-accent': notificationType === 'sms' }">
            <input v-model="notificationType" type="radio" value="sms" class="sr-only" />
            <span>{{ resolvedSmsOptionLabel }}</span>
          </label>
        </div>
      </div>

      <!-- Contact Info -->
      <div v-if="notificationType === 'email'" class="field-group">
        <label class="field-label">{{ resolvedEmailLabel }}</label>
        <input v-model="contactEmail" type="email" class="field-input" :placeholder="emailPlaceholder" />
      </div>
      <div v-else-if="notificationType === 'sms'" class="field-group">
        <label class="field-label">{{ resolvedPhoneLabel }}</label>
        <input v-model="contactPhone" type="tel" class="field-input" :placeholder="phonePlaceholder" />
      </div>

      <!-- Attendance -->
      <div class="field-group">
        <label class="field-label">{{ attendanceLabel }}</label>
        <div class="attendance-row">
          <label class="radio-card" :class="{ 'radio-card--selected': attendance === 'accept' }">
            <input v-model="attendance" type="radio" value="accept" class="sr-only" />
            <span>{{ acceptLabel }}</span>
          </label>
          <label class="radio-card radio-card--decline" :class="{ 'radio-card--selected-decline': attendance === 'decline' }">
            <input v-model="attendance" type="radio" value="decline" class="sr-only" />
            <span>{{ declineLabel }}</span>
          </label>
        </div>
      </div>

      <!-- Dietary Preference -->
      <div class="field-group">
        <label class="field-label">{{ resolvedDietaryLabel }}</label>
        <select v-model="dietary" class="field-input field-select">
          <option v-for="opt in resolvedDietaryOptions" :key="opt.value" :value="opt.value" :disabled="!opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Message -->
      <div class="field-group">
        <label class="field-label">{{ messageLabel }}</label>
        <textarea
          v-model="message"
          rows="3"
          class="field-input field-textarea"
          :placeholder="messagePlaceholder"
        ></textarea>
      </div>

      <p v-if="submitMessage" class="submit-message" :class="{ 'submit-message--error': !isSuccess }">
        {{ submitMessage }}
      </p>

      <button
        type="submit"
        class="submit-btn"
        :disabled="isSubmitting || !attendance || !guests[0]?.fullName?.trim()"
      >
        <span v-if="isSubmitting" class="spinner"></span>
        {{ isSubmitting ? submittingLabel : submitLabel }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  title: { type: String, default: 'RSVP' },
  subtitle: { type: String, default: '' },
  nameLabel: { type: String, default: 'Full Name' },
  namePlaceholder: { type: String, default: 'Enter full name' },
  addGuestLabel: { type: String, default: 'Add another guest' },
  childLabel: { type: String, default: 'Child' },
  attendanceLabel: { type: String, default: 'Will you be attending?' },
  acceptLabel: { type: String, default: 'Joyfully Accept' },
  declineLabel: { type: String, default: 'Regretfully Decline' },
  messageLabel: { type: String, default: 'Message for the Couple' },
  messagePlaceholder: { type: String, default: 'Song requests, dietary restrictions, or just love!' },
  submitLabel: { type: String, default: 'Send RSVP' },
  submittingLabel: { type: String, default: 'Sending...' },
  maxGuests: { type: Number, default: 5 },
  accentColor: { type: String, default: '#FFD1BA' },
  acceptColor: { type: String, default: '#BAFFC9' },
  declineColor: { type: String, default: '#FFD1BA' },
  buttonBg: { type: String, default: '#333' },
  buttonText: { type: String, default: '#fff' },
  headingFont: { type: String, default: 'inherit' },
  bodyFont: { type: String, default: 'inherit' },
  borderRadius: { type: String, default: '12px' },
  notificationLabel: { type: String, default: '' },
  emailOptionLabel: { type: String, default: '' },
  smsOptionLabel: { type: String, default: '' },
  emailLabel: { type: String, default: '' },
  emailPlaceholder: { type: String, default: 'your@email.com' },
  phoneLabel: { type: String, default: '' },
  phonePlaceholder: { type: String, default: '+389 7X XXX XXX' },
  dietaryLabel: { type: String, default: '' },
  dietaryOptions: { type: Array, default: null },
});

const emit = defineEmits(['submit']);

const guests = ref([{ fullName: '', isChild: false }]);
const notificationType = ref('');
const contactEmail = ref('');
const contactPhone = ref('');
const attendance = ref('');
const dietary = ref('');
const message = ref('');
const isSubmitting = ref(false);
const submitMessage = ref('');
const isSuccess = ref(false);

const cssVars = computed(() => ({
  '--rsvp-accent': props.accentColor,
  '--rsvp-accept': props.acceptColor,
  '--rsvp-decline': props.declineColor,
  '--rsvp-btn-bg': props.buttonBg,
  '--rsvp-btn-text': props.buttonText,
  '--rsvp-heading-font': props.headingFont,
  '--rsvp-body-font': props.bodyFont,
  '--rsvp-radius': props.borderRadius,
}));

/* i18n fallbacks for props that may be empty */
const resolvedNotificationLabel = computed(() => props.notificationLabel || t('invitation.howToContact'));
const resolvedEmailOptionLabel = computed(() => props.emailOptionLabel || t('invitation.email'));
const resolvedSmsOptionLabel = computed(() => props.smsOptionLabel || t('invitation.sms'));
const resolvedEmailLabel = computed(() => props.emailLabel || t('invitation.emailAddress'));
const resolvedPhoneLabel = computed(() => props.phoneLabel || t('invitation.phoneNumber'));
const resolvedDietaryLabel = computed(() => props.dietaryLabel || t('invitation.dietaryPreference'));
const resolvedDietaryOptions = computed(() => props.dietaryOptions || [
  { value: '', label: t('invitation.selectDietary') },
  { value: 'no_restrictions', label: t('invitation.noRestrictions') },
  { value: 'vegetarian', label: t('invitation.vegetarian') },
  { value: 'vegan', label: t('invitation.vegan') },
  { value: 'chicken', label: t('invitation.chicken') },
  { value: 'fish', label: t('invitation.fish') },
  { value: 'gluten_free', label: t('invitation.glutenFree') },
  { value: 'other', label: t('invitation.otherDietary') },
]);

function addGuest() {
  if (guests.value.length < props.maxGuests) {
    guests.value.push({ fullName: '', isChild: false });
  }
}

function removeGuest(idx) {
  guests.value.splice(idx, 1);
}

async function onSubmit() {
  if (!attendance.value || !guests.value[0]?.fullName?.trim()) return;

  isSubmitting.value = true;
  submitMessage.value = '';

  const payload = {
    guests: guests.value.filter(g => g.fullName.trim()).map(g => ({ fullName: g.fullName.trim(), isChild: !!g.isChild })),
    notificationType: notificationType.value,
    email: notificationType.value === 'email' ? contactEmail.value.trim() : '',
    phone: notificationType.value === 'sms' ? contactPhone.value.trim() : '',
    attendance: attendance.value,
    dietary: dietary.value,
    message: message.value.trim(),
  };

  try {
    emit('submit', payload);
    isSuccess.value = true;
    submitMessage.value = t('invitation.rsvpSuccess');
  } catch (e) {
    isSuccess.value = false;
    submitMessage.value = t('invitation.rsvpError');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.rsvp-form {
  width: 100%;
}

.rsvp-title {
  font-family: var(--rsvp-heading-font);
  font-size: 32px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin: 0 0 4px;
}

.rsvp-subtitle {
  text-align: center;
  color: #888;
  font-family: var(--rsvp-body-font);
  font-size: 15px;
  margin: 0 0 28px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-label {
  display: block;
  font-family: var(--rsvp-body-font);
  font-size: 13px;
  font-weight: 700;
  color: #555;
  margin-bottom: 6px;
}

.field-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: var(--rsvp-radius);
  background: #fafafa;
  border: 2px solid #e5e5e5;
  font-family: var(--rsvp-body-font);
  font-size: 15px;
  color: #333;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.field-input:focus {
  outline: none;
  border-color: var(--rsvp-accent);
}

.field-input::placeholder {
  color: #bbb;
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Guest rows */
.guests-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guest-entry {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guest-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guest-row .field-input {
  flex: 1;
}

.child-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-family: var(--rsvp-body-font);
  font-size: 13px;
  color: #666;
  padding-left: 2px;
}

.child-toggle input[type="checkbox"] {
  width: 15px;
  height: 15px;
  accent-color: var(--rsvp-accent);
  cursor: pointer;
}

.remove-guest-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #999;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.remove-guest-btn:hover {
  background: #fee;
  color: #c44;
}

.add-guest-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px dashed #ddd;
  border-radius: var(--rsvp-radius);
  background: transparent;
  font-family: var(--rsvp-body-font);
  font-size: 14px;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.add-guest-btn:hover {
  border-color: var(--rsvp-accent);
  color: #555;
}

/* Attendance radios */
.field-group {
  display: flex;
  flex-direction: column;
}

.attendance-row {
  display: flex;
  gap: 12px;
}

.radio-card {
  flex: 1;
  cursor: pointer;
}

.radio-card span {
  display: block;
  text-align: center;
  padding: 12px 16px;
  border-radius: var(--rsvp-radius);
  border: 2px solid #e5e5e5;
  color: #888;
  font-family: var(--rsvp-body-font);
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.radio-card:hover span {
  border-color: #ccc;
}

.radio-card--selected span {
  border-color: var(--rsvp-accept);
  background: color-mix(in srgb, var(--rsvp-accept) 20%, transparent);
  color: #333;
}

.radio-card--selected-decline span {
  border-color: var(--rsvp-decline);
  background: color-mix(in srgb, var(--rsvp-decline) 20%, transparent);
  color: #333;
}

.radio-card--selected-accent span {
  border-color: var(--rsvp-accent);
  background: color-mix(in srgb, var(--rsvp-accent) 20%, transparent);
  color: #333;
}

/* Select dropdown */
.field-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
  cursor: pointer;
}

/* Submit */
.submit-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: var(--rsvp-radius);
  background: var(--rsvp-btn-bg);
  color: var(--rsvp-btn-text);
  font-family: var(--rsvp-heading-font);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.submit-message {
  text-align: center;
  padding: 10px 12px;
  border-radius: var(--rsvp-radius);
  font-size: 14px;
  background: #e8f5e9;
  color: #2e7d32;
}

.submit-message--error {
  background: #fce4ec;
  color: #c62828;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 480px) {
  .attendance-row {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

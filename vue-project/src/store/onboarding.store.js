import { reactive } from "vue";

const STORAGE_KEY = 'onboarding_state_v1';

const defaultState = () => ({
  email: '',
  isEmailVerified: false,
  selectedCategory: '',
  eventDetails: {
    brideName: '',
    groomName: '',
    date: '',
    location: ''
  },
  eventId: '',
  invitationName: '',
  eventStatus: ''
});

export const onboardingStore = reactive(defaultState());

export function initOnboarding() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      onboardingStore.email = saved.email || '';
      onboardingStore.isEmailVerified = !!saved.isEmailVerified;
      onboardingStore.selectedCategory = saved.selectedCategory || '';
      onboardingStore.invitationName = saved.invitationName || '';
      onboardingStore.eventId = saved.eventId || '';
      onboardingStore.eventDetails = saved.eventDetails || defaultState().eventDetails;
    }
  } catch (e) {
    console.warn('[onboarding] failed to parse saved state', e);
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    email: onboardingStore.email,
    isEmailVerified: onboardingStore.isEmailVerified,
    selectedCategory: onboardingStore.selectedCategory,
    invitationName: onboardingStore.invitationName,
    eventId: onboardingStore.eventId,
    eventDetails: onboardingStore.eventDetails,
  }));
}

// In-memory only – never persisted to localStorage
let _tempPassword = '';
let _tempUsername = '';

export function setTempPassword(pw) {
  _tempPassword = pw || '';
}

export function getTempPassword() {
  return _tempPassword;
}

export function setTempUsername(u) {
  _tempUsername = u || '';
}

export function getTempUsername() {
  return _tempUsername;
}

export function clearTempCredentials() {
  _tempPassword = '';
  _tempUsername = '';
}

export function setEmail(email) {
  onboardingStore.email = email || '';
  persist();
}

export function setEmailVerified(flag) {
  onboardingStore.isEmailVerified = !!flag;
  persist();
}

export function setSelectedCategory(enumValue) {
  onboardingStore.selectedCategory = enumValue || '';
  persist();
}

export function setEventId(id) {
  onboardingStore.eventId = id || '';
  persist();
}

export function setInvitationName(name) {
  onboardingStore.invitationName = name || '';
  persist();
}

export function setEventStatus(status) {
  onboardingStore.eventStatus = status || '';
}

export function setEventDetails(details) {
  onboardingStore.eventDetails = details || defaultState().eventDetails;
  persist();
}

export function clearOnboarding(keepEmail = false) {
  const email = keepEmail ? onboardingStore.email : '';
  Object.assign(onboardingStore, defaultState());
  onboardingStore.email = email;
  persist();
}

// Initialize on module load
initOnboarding();

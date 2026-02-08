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
  selectedDesign: ''
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
  }));
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

export function clearOnboarding(keepEmail = false) {
  const email = keepEmail ? onboardingStore.email : '';
  Object.assign(onboardingStore, defaultState());
  onboardingStore.email = email;
  persist();
}

// Initialize on module load
initOnboarding();

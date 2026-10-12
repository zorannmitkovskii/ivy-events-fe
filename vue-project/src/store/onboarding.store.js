import { reactive } from "vue";

const STORAGE_KEY = 'onboarding_state_v1';

const defaultState = () => ({
  email: '',
  isEmailVerified: false,
  selectedCategory: '',
  // The finer event type (IVY-201). Only asked where the category is
  // ambiguous — a birthday is either an adult's or a child's, and they are
  // two different products.
  selectedTypeCode: '',
  // The event's basics, asked before the design (INV-104): names or a title,
  // date, time, the event's own timezone and a location. The design cards and
  // the invitation preview are personalised from these. Read through
  // `normalizeBasics` (utils/eventBasics) — older saves have location as a
  // string and no time/timezone.
  eventDetails: {
    brideName: '',
    groomName: '',
    title: '',
    date: '',
    time: '',
    timezone: 'Europe/Skopje',
    location: { name: '', address: '' }
  },
  eventId: '',
  invitationName: '',
  // Where the chosen design opens in the editor ("invitations/<slug>"), so
  // the stepper (INV-102) can lead back to it from any step. The design's
  // address, not a progress flag.
  invitationPath: '',
  eventStatus: '',
  selectedPackageType: ''
});

export const onboardingStore = reactive(defaultState());

/**
 * Whose onboarding this is.
 *
 * <p>Kept beside the state because the state alone cannot say. It used to be
 * cleared on logout and nowhere else, so any session that ended without one —
 * an expired token, a closed browser, a second account signed up on the same
 * machine — left the previous person's {@code eventId} in localStorage for
 * whoever signed in next. The new account then sent
 * {@code PUT /events/full/<somebody else's event>} and was refused, correctly,
 * with a 403 that looked like a permissions bug in the backend.
 */
const OWNER_KEY = 'onboarding_owner_v1';

/**
 * Hands the saved onboarding to whoever just signed in, dropping whatever was
 * not theirs.
 *
 * <p>Not simply "clear on login". Onboarding is deliberately collected
 * <em>before</em> the account exists — category, invitation, the verified flag
 * — and wiping it at login would throw away the signup the person is in the
 * middle of. So the two cases are separated:
 *
 * <ul>
 *   <li><b>A different known owner</b> — another person used this browser.
 *       Everything goes.</li>
 *   <li><b>No owner recorded</b> — pre-login onboarding, which belongs to the
 *       account being created. The choices stay. The {@code eventId} does not:
 *       an event can only be created by an authenticated session, so an
 *       unowned one was somebody else's, and it is the single field that sends
 *       a write to another person's event.</li>
 * </ul>
 *
 * @param userId the signed-in subject. Null clears the marker only.
 * @returns true when anything was discarded
 */
export function claimOnboardingFor(userId) {
  let previous = null;
  try {
    previous = localStorage.getItem(OWNER_KEY);
  } catch {
    return false;
  }

  let discarded = false;

  if (!userId) {
    try {
      localStorage.removeItem(OWNER_KEY);
    } catch { /* nothing to remove */ }
    return false;
  }

  if (previous && previous !== userId) {
    clearOnboarding();
    discarded = true;
  } else if (!previous && onboardingStore.eventId) {
    // Kept the rest, dropped the one field that could not be theirs.
    setEventId('');
    onboardingStore.eventStatus = '';
    persist();
    discarded = true;
  }

  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    // A browser refusing storage still got the clearing above, which is the
    // half that matters.
  }
  return discarded;
}

// INV-302: the saved onboarding could not be read on this load (it was set
// aside, so the flow starts clean instead of failing on it later).
let loadIssue = null;
export function getOnboardingLoadIssue() {
  return loadIssue;
}

const str = (value) => (typeof value === 'string' ? value : '');

export function initOnboarding() {
  let raw = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) throw new Error('not an onboarding state');
    onboardingStore.email = str(saved.email);
    onboardingStore.isEmailVerified = !!saved.isEmailVerified;
    onboardingStore.selectedCategory = str(saved.selectedCategory);
    onboardingStore.selectedTypeCode = str(saved.selectedTypeCode);
    onboardingStore.invitationName = str(saved.invitationName);
    onboardingStore.invitationPath = str(saved.invitationPath);
    onboardingStore.eventId = str(saved.eventId);
    // Read through normalizeBasics everywhere, so any object is safe here.
    onboardingStore.eventDetails =
      saved.eventDetails && typeof saved.eventDetails === 'object' ? saved.eventDetails : defaultState().eventDetails;
    onboardingStore.selectedPackageType = str(saved.selectedPackageType);
  } catch (e) {
    console.warn('[onboarding] failed to parse saved state; it was removed', e);
    loadIssue = 'unreadable';
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
}

/**
 * Forgets the invitation being made — type, basics and chosen design — when
 * its draft is discarded or expires (INV-302). When the store points at a
 * saved event (`eventId`), the category and design describe that event (the
 * dashboard reads them), so only the basics typed for the new one go.
 */
export function clearCreationProgress() {
  const fresh = defaultState();
  onboardingStore.eventDetails = fresh.eventDetails;
  if (!onboardingStore.eventId) {
    onboardingStore.selectedCategory = '';
    onboardingStore.selectedTypeCode = '';
    onboardingStore.invitationName = '';
    onboardingStore.invitationPath = '';
  }
  try { persist(); } catch { /* storage refused: memory is cleared */ }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    email: onboardingStore.email,
    isEmailVerified: onboardingStore.isEmailVerified,
    selectedCategory: onboardingStore.selectedCategory,
    selectedTypeCode: onboardingStore.selectedTypeCode,
    invitationName: onboardingStore.invitationName,
    invitationPath: onboardingStore.invitationPath,
    eventId: onboardingStore.eventId,
    eventDetails: onboardingStore.eventDetails,
    selectedPackageType: onboardingStore.selectedPackageType,
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

export function setSelectedTypeCode(code) {
  onboardingStore.selectedTypeCode = code || '';
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

export function setInvitationPath(path) {
  onboardingStore.invitationPath = path || '';
  persist();
}

export function setEventStatus(status) {
  onboardingStore.eventStatus = status || '';
}

export function setSelectedPackageType(type) {
  onboardingStore.selectedPackageType = type || '';
  persist();
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

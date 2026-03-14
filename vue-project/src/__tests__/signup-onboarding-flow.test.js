/**
 * Signup-First Onboarding Flow Tests
 *
 * Comprehensive tests covering:
 * Signup → Verify Email → EventCategoryPage → EventInvitationsPage →
 * Create Event + Attach Invitation → Redirect to Dashboard
 *
 * Includes edge cases: validation, corrupted state, token handling,
 * draft TTL, guard logic, error recovery, and more.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock localStorage / sessionStorage ───
const localStorageMap = new Map();
const sessionStorageMap = new Map();

const mockLocalStorage = {
  getItem: vi.fn((key) => localStorageMap.get(key) ?? null),
  setItem: vi.fn((key, val) => localStorageMap.set(key, val)),
  removeItem: vi.fn((key) => localStorageMap.delete(key)),
  clear: vi.fn(() => localStorageMap.clear()),
};
const mockSessionStorage = {
  getItem: vi.fn((key) => sessionStorageMap.get(key) ?? null),
  setItem: vi.fn((key, val) => sessionStorageMap.set(key, val)),
  removeItem: vi.fn((key) => sessionStorageMap.delete(key)),
  clear: vi.fn(() => sessionStorageMap.clear()),
};

Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: mockSessionStorage, writable: true });

vi.stubGlobal('crypto', { randomUUID: () => `mock-${Date.now()}-${Math.random().toString(36).slice(2)}` });

// ─── Mock services ───
vi.mock('@/services/backendApi', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

vi.mock('@/services/api', () => ({
  api: { post: vi.fn(), get: vi.fn(), put: vi.fn(), del: vi.fn() },
  scheduleProactiveRefresh: vi.fn(),
}));

vi.mock('@/services/env', () => ({
  getRuntimeEnv: () => ({ APP_ENV: 'local', VITE_KEYCLOAK_URL: 'http://localhost:8080' }),
  detectDefaultEnvFromLocation: () => 'local',
  computeKeycloakBaseUrl: () => 'http://localhost:8080',
}));

vi.mock('@/services/eventFull.service', () => ({
  eventFullService: { createFull: vi.fn(), updateFull: vi.fn() },
}));

vi.mock('@/services/events.service', () => ({
  eventsService: {
    create: vi.fn(),
    updateInvitation: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('@/services/eventDetails.service', () => ({ eventDetailsService: { create: vi.fn() } }));
vi.mock('@/services/agenda.service', () => ({ agendaApi: { createItem: vi.fn() } }));
vi.mock('@/services/ourStory.service', () => ({ ourStoryApi: { create: vi.fn() } }));
vi.mock('@/services/invitationTemplate.service', () => ({
  invitationTemplateService: { listByCategory: vi.fn() },
}));

// ─── Imports ───
import {
  onboardingStore, setSelectedCategory, setInvitationName,
  setEmail, setTempPassword, setTempUsername, setEmailVerified,
  setEventId, clearOnboarding, getTempPassword, getTempUsername,
  clearTempCredentials, initOnboarding, setEventDetails,
  setSelectedPackageType, setEventStatus,
} from '@/store/onboarding.store';

import {
  draftStore, clearDraft, hasDraft, getDraftFullPayload,
  setDraftFullPayload, setDraftTheme, getDraftTheme,
  getDraftSectionState, setDraftSectionState,
  addDraftItem, updateDraftItem, deleteDraftItem,
  getDraftItems, loadDraft, generateLocalId,
} from '@/store/invitationDraft.store';

import { syncDraftToBackend } from '@/composables/useDraftSync';
import { eventsService } from '@/services/events.service';
import { eventFullService } from '@/services/eventFull.service';
import { eventDetailsService } from '@/services/eventDetails.service';
import { agendaApi } from '@/services/agenda.service';
import { ourStoryApi } from '@/services/ourStory.service';
import { invitationTemplateService } from '@/services/invitationTemplate.service';
import { categoryIdToEnum, enumToCategoryId } from '@/helper/CategoryMapping.helper';
import { EventCategoryEnum } from '@/enums/EventCategory';
import apiPublic from '@/services/backendApi';

// ─── Helpers ───
function fakeJwt(claims = {}) {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const payload = btoa(JSON.stringify({
    sub: 'user-456',
    preferred_username: 'marko.s',
    email: 'marko@example.com',
    realm_access: { roles: ['USER'] },
    ...claims,
  }));
  return `${header}.${payload}.sig`;
}

function setAuthenticated(claims = {}) {
  localStorageMap.set('access_token', fakeJwt(claims));
  localStorageMap.set('refresh_token', 'fake-refresh');
}

function clearAuth() {
  localStorageMap.delete('access_token');
  localStorageMap.delete('refresh_token');
  localStorageMap.delete('id_token');
}

// ─── Setup ───
beforeEach(() => {
  localStorageMap.clear();
  sessionStorageMap.clear();
  clearDraft();
  clearOnboarding();
  clearAuth();
  vi.clearAllMocks();
});


// ═══════════════════════════════════════════════════════
// 1. PASSWORD VALIDATION (AuthSignupPage logic)
// ═══════════════════════════════════════════════════════
describe('Password Validation', () => {
  function validatePassword(pw) {
    const errors = [];
    if (pw.length < 8) errors.push('length');
    if (!/[A-Z]/.test(pw)) errors.push('uppercase');
    if (!/[a-z]/.test(pw)) errors.push('lowercase');
    if (!/[0-9]/.test(pw)) errors.push('digit');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) errors.push('special');
    return errors;
  }

  it('passes for a valid password', () => {
    expect(validatePassword('Secure1!@')).toEqual([]);
  });

  it('fails all rules for empty string', () => {
    expect(validatePassword('')).toEqual(['length', 'uppercase', 'lowercase', 'digit', 'special']);
  });

  it('fails only length for short valid password', () => {
    expect(validatePassword('Ab1!')).toEqual(['length']);
  });

  it('fails uppercase for all-lowercase password', () => {
    const errors = validatePassword('secure1!@');
    expect(errors).toContain('uppercase');
    expect(errors).not.toContain('lowercase');
  });

  it('fails lowercase for all-uppercase password', () => {
    const errors = validatePassword('SECURE1!@');
    expect(errors).toContain('lowercase');
    expect(errors).not.toContain('uppercase');
  });

  it('fails digit for no-number password', () => {
    const errors = validatePassword('Secure!!@');
    expect(errors).toContain('digit');
  });

  it('fails special for no-special-char password', () => {
    const errors = validatePassword('Secure123');
    expect(errors).toContain('special');
  });

  it('accepts exactly 8 characters', () => {
    expect(validatePassword('Abcde1!x')).toEqual([]);
  });

  it('accepts very long passwords', () => {
    expect(validatePassword('A' + 'b'.repeat(100) + '1!')).toEqual([]);
  });

  it('handles unicode characters but still requires ASCII rules', () => {
    const errors = validatePassword('Пароль1!');
    // Cyrillic uppercase/lowercase don't match [A-Z]/[a-z]
    expect(errors).toContain('uppercase');
    expect(errors).toContain('lowercase');
  });
});


// ═══════════════════════════════════════════════════════
// 2. USERNAME GENERATION FROM EMAIL
// ═══════════════════════════════════════════════════════
describe('usernameFromEmail', () => {
  function usernameFromEmail(emailStr) {
    const base = (emailStr.split("@")[0] || "user").trim();
    const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "");
    return sanitized || `user${Date.now()}`;
  }

  it('extracts username from standard email', () => {
    expect(usernameFromEmail('john.doe@example.com')).toBe('john.doe');
  });

  it('handles email with special characters', () => {
    expect(usernameFromEmail('john+tag@example.com')).toBe('johntag');
  });

  it('handles email with dots and dashes', () => {
    expect(usernameFromEmail('john-doe.123@example.com')).toBe('john-doe.123');
  });

  it('falls back to "user" when no @ in string', () => {
    expect(usernameFromEmail('noatsign')).toBe('noatsign');
  });

  it('handles empty string before @', () => {
    const result = usernameFromEmail('@example.com');
    expect(result).toBe('user'); // empty before @ falls back to "user" which passes sanitize
  });

  it('strips all non-alphanumeric/dot/dash chars', () => {
    expect(usernameFromEmail('user%name!test@example.com')).toBe('usernametest');
  });

  it('handles cyrillic email prefix', () => {
    const result = usernameFromEmail('корисник@example.com');
    // Cyrillic stripped, empty → fallback
    expect(result).toMatch(/^user\d+$/);
  });

  it('preserves underscores in email', () => {
    expect(usernameFromEmail('john_doe@example.com')).toBe('john_doe');
  });
});


// ═══════════════════════════════════════════════════════
// 3. canSubmit COMPUTED LOGIC
// ═══════════════════════════════════════════════════════
describe('canSubmit validation', () => {
  function canSubmit({ firstName, email, password, confirmPassword, passwordErrors, agree, isLoading }) {
    const passwordsMatch = password === confirmPassword;
    return (
      firstName.trim().length > 0 &&
      email.trim().length > 3 &&
      password.length >= 8 &&
      passwordErrors.length === 0 &&
      confirmPassword.length >= 8 &&
      passwordsMatch &&
      agree &&
      !isLoading
    );
  }

  const valid = {
    firstName: 'Marko',
    email: 'marko@example.com',
    password: 'Secure1!@',
    confirmPassword: 'Secure1!@',
    passwordErrors: [],
    agree: true,
    isLoading: false,
  };

  it('returns true for all valid fields', () => {
    expect(canSubmit(valid)).toBe(true);
  });

  it('returns false for empty firstName', () => {
    expect(canSubmit({ ...valid, firstName: '' })).toBe(false);
  });

  it('returns false for whitespace-only firstName', () => {
    expect(canSubmit({ ...valid, firstName: '   ' })).toBe(false);
  });

  it('returns false for email <= 3 chars', () => {
    expect(canSubmit({ ...valid, email: 'a@b' })).toBe(false);
  });

  it('returns true for email with exactly 4 chars', () => {
    expect(canSubmit({ ...valid, email: 'a@bc' })).toBe(true);
  });

  it('returns false for short password', () => {
    expect(canSubmit({ ...valid, password: 'Ab1!', confirmPassword: 'Ab1!' })).toBe(false);
  });

  it('returns false when password has validation errors', () => {
    expect(canSubmit({ ...valid, passwordErrors: ['uppercase'] })).toBe(false);
  });

  it('returns false when passwords do not match', () => {
    expect(canSubmit({ ...valid, confirmPassword: 'Different1!' })).toBe(false);
  });

  it('returns false when terms not agreed', () => {
    expect(canSubmit({ ...valid, agree: false })).toBe(false);
  });

  it('returns false while loading', () => {
    expect(canSubmit({ ...valid, isLoading: true })).toBe(false);
  });
});


// ═══════════════════════════════════════════════════════
// 4. AUTH SERVICE — TOKEN HANDLING
// ═══════════════════════════════════════════════════════
describe('Auth Service — Token Handling', () => {
  it('isAuthenticated returns false without token', async () => {
    clearAuth();
    const { isAuthenticated } = await import('@/services/auth.service');
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true with token', async () => {
    setAuthenticated();
    const { isAuthenticated } = await import('@/services/auth.service');
    expect(isAuthenticated()).toBe(true);
  });

  it('getUsername extracts preferred_username from JWT', async () => {
    setAuthenticated({ preferred_username: 'ana.m' });
    const { getUsername } = await import('@/services/auth.service');
    expect(getUsername()).toBe('ana.m');
  });

  it('getUsername returns null without token', async () => {
    clearAuth();
    const { getUsername } = await import('@/services/auth.service');
    expect(getUsername()).toBeNull();
  });

  it('getUserId extracts sub from JWT', async () => {
    setAuthenticated({ sub: 'user-xyz-123' });
    const { getUserId } = await import('@/services/auth.service');
    expect(getUserId()).toBe('user-xyz-123');
  });

  it('getRoles extracts realm_access roles', async () => {
    setAuthenticated({ realm_access: { roles: ['USER', 'ADMIN'] } });
    const { getRoles } = await import('@/services/auth.service');
    expect(getRoles()).toEqual(['USER', 'ADMIN']);
  });

  it('getRoles returns empty array without token', async () => {
    clearAuth();
    const { getRoles } = await import('@/services/auth.service');
    expect(getRoles()).toEqual([]);
  });

  it('hasRole returns true for existing role', async () => {
    setAuthenticated({ realm_access: { roles: ['ADMIN'] } });
    const { hasRole } = await import('@/services/auth.service');
    expect(hasRole('ADMIN')).toBe(true);
  });

  it('hasRole returns false for missing role', async () => {
    setAuthenticated({ realm_access: { roles: ['USER'] } });
    const { hasRole } = await import('@/services/auth.service');
    expect(hasRole('ADMIN')).toBe(false);
  });

  it('handles malformed JWT gracefully', async () => {
    localStorageMap.set('access_token', 'not.a.valid.jwt');
    const { getUsername } = await import('@/services/auth.service');
    expect(getUsername()).toBeNull();
  });

  it('loginWithCredentials accepts snake_case tokens', async () => {
    apiPublic.post.mockResolvedValue({
      data: { access_token: 'tok-a', refresh_token: 'tok-r', id_token: 'tok-id' },
    });
    const { loginWithCredentials } = await import('@/services/auth.service');
    await loginWithCredentials('user@test.com', 'pass');

    expect(localStorageMap.get('access_token')).toBe('tok-a');
    expect(localStorageMap.get('refresh_token')).toBe('tok-r');
    expect(localStorageMap.get('id_token')).toBe('tok-id');
  });

  it('loginWithCredentials accepts camelCase tokens', async () => {
    apiPublic.post.mockResolvedValue({
      data: { accessToken: 'tok-a2', refreshToken: 'tok-r2', idToken: 'tok-id2' },
    });
    const { loginWithCredentials } = await import('@/services/auth.service');
    await loginWithCredentials('user@test.com', 'pass');

    expect(localStorageMap.get('access_token')).toBe('tok-a2');
    expect(localStorageMap.get('refresh_token')).toBe('tok-r2');
    expect(localStorageMap.get('id_token')).toBe('tok-id2');
  });

  it('loginWithCredentials does not set missing tokens', async () => {
    apiPublic.post.mockResolvedValue({ data: { access_token: 'only-access' } });
    const { loginWithCredentials } = await import('@/services/auth.service');
    await loginWithCredentials('user@test.com', 'pass');

    expect(localStorageMap.get('access_token')).toBe('only-access');
    expect(localStorageMap.has('refresh_token')).toBe(false);
  });

  it('register normalizes response', async () => {
    apiPublic.post.mockResolvedValue({ data: { username: 'new-user' } });
    const { register } = await import('@/services/auth.service');
    const result = await register({ email: 'a@b.com', password: 'x' });
    expect(result.username).toBe('new-user');
  });

  it('getFullName combines given_name and family_name', async () => {
    setAuthenticated({ given_name: 'Ana', family_name: 'Stojanova' });
    const { getFullName } = await import('@/services/auth.service');
    expect(getFullName()).toBe('Ana Stojanova');
  });

  it('getFullName falls back to preferred_username', async () => {
    setAuthenticated({ preferred_username: 'ana.s' });
    const { getFullName } = await import('@/services/auth.service');
    expect(getFullName()).toBe('ana.s');
  });

  it('getFullName returns null without token', async () => {
    clearAuth();
    const { getFullName } = await import('@/services/auth.service');
    expect(getFullName()).toBeNull();
  });
});


// ═══════════════════════════════════════════════════════
// 5. ONBOARDING STORE — STATE MANAGEMENT
// ═══════════════════════════════════════════════════════
describe('Onboarding Store', () => {
  it('initializes with defaults', () => {
    clearOnboarding();
    expect(onboardingStore.email).toBe('');
    expect(onboardingStore.isEmailVerified).toBe(false);
    expect(onboardingStore.selectedCategory).toBe('');
    expect(onboardingStore.invitationName).toBe('');
    expect(onboardingStore.eventId).toBe('');
  });

  it('persists all fields to localStorage', () => {
    setEmail('test@test.com');
    setEmailVerified(true);
    setSelectedCategory('WEDDING');
    setInvitationName('elegant-chateau');
    setEventId('ev-1');
    setSelectedPackageType('PREMIUM');

    const stored = JSON.parse(localStorageMap.get('onboarding_state_v1'));
    expect(stored.email).toBe('test@test.com');
    expect(stored.isEmailVerified).toBe(true);
    expect(stored.selectedCategory).toBe('WEDDING');
    expect(stored.invitationName).toBe('elegant-chateau');
    expect(stored.eventId).toBe('ev-1');
    expect(stored.selectedPackageType).toBe('PREMIUM');
  });

  it('initOnboarding restores state from localStorage', () => {
    localStorageMap.set('onboarding_state_v1', JSON.stringify({
      email: 'restored@test.com',
      isEmailVerified: true,
      selectedCategory: 'GALLERY',
      invitationName: 'coastal-breeze',
      eventId: 'ev-restored',
    }));

    initOnboarding();

    expect(onboardingStore.email).toBe('restored@test.com');
    expect(onboardingStore.isEmailVerified).toBe(true);
    expect(onboardingStore.selectedCategory).toBe('GALLERY');
    expect(onboardingStore.invitationName).toBe('coastal-breeze');
    expect(onboardingStore.eventId).toBe('ev-restored');
  });

  it('initOnboarding handles corrupted JSON gracefully', () => {
    localStorageMap.set('onboarding_state_v1', 'not-valid-json{{{');
    expect(() => initOnboarding()).not.toThrow();
    // Keeps existing state (doesn't crash)
  });

  it('initOnboarding handles missing fields with defaults', () => {
    localStorageMap.set('onboarding_state_v1', JSON.stringify({ email: 'only-email@test.com' }));
    initOnboarding();
    expect(onboardingStore.email).toBe('only-email@test.com');
    expect(onboardingStore.isEmailVerified).toBe(false);
    expect(onboardingStore.selectedCategory).toBe('');
  });

  it('clearOnboarding resets all state', () => {
    setEmail('test@test.com');
    setSelectedCategory('WEDDING');
    setEventId('ev-1');
    setEmailVerified(true);

    clearOnboarding();

    expect(onboardingStore.email).toBe('');
    expect(onboardingStore.selectedCategory).toBe('');
    expect(onboardingStore.eventId).toBe('');
    expect(onboardingStore.isEmailVerified).toBe(false);
  });

  it('clearOnboarding(keepEmail=true) preserves email only', () => {
    setEmail('keep-me@test.com');
    setSelectedCategory('WEDDING');
    setEventId('ev-1');

    clearOnboarding(true);

    expect(onboardingStore.email).toBe('keep-me@test.com');
    expect(onboardingStore.selectedCategory).toBe('');
    expect(onboardingStore.eventId).toBe('');
  });

  it('temp credentials are in-memory only, never persisted', () => {
    setTempPassword('secret');
    setTempUsername('temp-user');

    const stored = JSON.parse(localStorageMap.get('onboarding_state_v1') || '{}');
    expect(stored.tempPassword).toBeUndefined();
    expect(stored.tempUsername).toBeUndefined();
    expect(getTempPassword()).toBe('secret');
    expect(getTempUsername()).toBe('temp-user');
  });

  it('clearTempCredentials removes in-memory credentials', () => {
    setTempPassword('secret');
    setTempUsername('temp-user');
    clearTempCredentials();
    expect(getTempPassword()).toBe('');
    expect(getTempUsername()).toBe('');
  });

  it('setEventDetails stores details object', () => {
    setEventDetails({ brideName: 'Ana', groomName: 'Marko', date: '2026-06-15', location: 'Ohrid' });
    expect(onboardingStore.eventDetails.brideName).toBe('Ana');
    expect(onboardingStore.eventDetails.location).toBe('Ohrid');
  });

  it('setters handle null/undefined as empty string', () => {
    setEmail(null);
    setSelectedCategory(undefined);
    setEventId(null);
    expect(onboardingStore.email).toBe('');
    expect(onboardingStore.selectedCategory).toBe('');
    expect(onboardingStore.eventId).toBe('');
  });
});


// ═══════════════════════════════════════════════════════
// 6. DRAFT STORE — STATE, TTL, CRUD
// ═══════════════════════════════════════════════════════
describe('Draft Store', () => {
  it('starts with no draft', () => {
    expect(hasDraft()).toBe(false);
  });

  it('hasDraft returns true when fullPayload is set', () => {
    setDraftFullPayload({ test: true });
    expect(hasDraft()).toBe(true);
  });

  it('hasDraft returns true when eventDetails has items', () => {
    addDraftItem('eventDetails', { type: 'CHURCH', time: '16:00' });
    expect(hasDraft()).toBe(true);
  });

  it('hasDraft returns true when theme is set', () => {
    setDraftTheme({ accent: '#fff' });
    expect(hasDraft()).toBe(true);
    expect(getDraftTheme()).toEqual({ accent: '#fff' });
  });

  it('hasDraft returns true when sectionState is set', () => {
    setDraftSectionState({ hero: true });
    expect(hasDraft()).toBe(true);
    expect(getDraftSectionState()).toEqual({ hero: true });
  });

  it('clearDraft removes all draft data', () => {
    setDraftFullPayload({ test: true });
    addDraftItem('eventDetails', { type: 'CHURCH' });
    setDraftTheme({ accent: '#fff' });

    clearDraft();

    expect(hasDraft()).toBe(false);
    expect(getDraftFullPayload()).toBeNull();
    expect(getDraftItems('eventDetails')).toEqual([]);
    expect(getDraftTheme()).toBeNull();
  });

  it('clearDraft removes localStorage entry', () => {
    setDraftFullPayload({ test: true });
    expect(localStorageMap.has('invitation_draft_v1')).toBe(true);

    clearDraft();
    expect(localStorageMap.has('invitation_draft_v1')).toBe(false);
  });

  // CRUD operations
  it('addDraftItem generates _localId if not provided', () => {
    const item = addDraftItem('eventDetails', { type: 'CHURCH', time: '16:00' });
    expect(item._localId).toBeTruthy();
    expect(item._localId).toMatch(/^_local_mock-/);
    expect(getDraftItems('eventDetails')).toHaveLength(1);
  });

  it('addDraftItem preserves provided _localId', () => {
    const item = addDraftItem('eventDetails', { type: 'CHURCH', _localId: 'my-custom-id' });
    expect(item._localId).toBe('my-custom-id');
  });

  it('updateDraftItem updates existing item by _localId', () => {
    const item = addDraftItem('agenda', { type: 'CEREMONY', time: '16:00' });
    updateDraftItem('agenda', item._localId, { type: 'CEREMONY', time: '17:00' });

    const items = getDraftItems('agenda');
    expect(items[0].time).toBe('17:00');
  });

  it('updateDraftItem does nothing for non-existent _localId', () => {
    addDraftItem('agenda', { type: 'CEREMONY', time: '16:00' });
    updateDraftItem('agenda', 'non-existent-id', { time: '99:99' });

    const items = getDraftItems('agenda');
    expect(items[0].time).toBe('16:00');
    expect(items).toHaveLength(1);
  });

  it('deleteDraftItem removes item by _localId', () => {
    const item1 = addDraftItem('ourStory', { type: 'HOW_WE_MET' });
    addDraftItem('ourStory', { type: 'FIRST_DATE' });

    deleteDraftItem('ourStory', item1._localId);
    expect(getDraftItems('ourStory')).toHaveLength(1);
    expect(getDraftItems('ourStory')[0].type).toBe('FIRST_DATE');
  });

  it('deleteDraftItem does nothing for non-existent _localId', () => {
    addDraftItem('ourStory', { type: 'HOW_WE_MET' });
    deleteDraftItem('ourStory', 'bogus-id');
    expect(getDraftItems('ourStory')).toHaveLength(1);
  });

  it('getDraftItems returns empty array for unknown section', () => {
    expect(getDraftItems('nonExistent')).toEqual([]);
  });

  it('generateLocalId returns unique ids', () => {
    const id1 = generateLocalId();
    const id2 = generateLocalId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^_local_mock-/);
  });

  // TTL
  it('loadDraft discards drafts older than 30 days', () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    localStorageMap.set('invitation_draft_v1', JSON.stringify({
      eventDetails: [{ type: 'CHURCH' }],
      agenda: [],
      ourStory: [],
      theme: null,
      sectionState: null,
      fullPayload: { stale: true },
      updatedAt: thirtyOneDaysAgo,
    }));

    loadDraft();
    expect(hasDraft()).toBe(false);
    expect(getDraftFullPayload()).toBeNull();
  });

  it('loadDraft keeps drafts under 30 days', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    localStorageMap.set('invitation_draft_v1', JSON.stringify({
      eventDetails: [],
      agenda: [],
      ourStory: [],
      theme: null,
      sectionState: null,
      fullPayload: { fresh: true },
      updatedAt: oneDayAgo,
    }));

    loadDraft();
    expect(getDraftFullPayload()).toEqual({ fresh: true });
  });

  it('loadDraft handles corrupted JSON without throwing', () => {
    localStorageMap.set('invitation_draft_v1', '{broken json!!!');
    expect(() => loadDraft()).not.toThrow();
  });

  it('loadDraft handles corrupted array fields', () => {
    localStorageMap.set('invitation_draft_v1', JSON.stringify({
      eventDetails: 'not-an-array',
      agenda: null,
      ourStory: 42,
      fullPayload: null,
      updatedAt: new Date().toISOString(),
    }));

    loadDraft();
    expect(getDraftItems('eventDetails')).toEqual([]);
    expect(getDraftItems('agenda')).toEqual([]);
    expect(getDraftItems('ourStory')).toEqual([]);
  });

  it('loadDraft silently returns when no data in localStorage', () => {
    localStorageMap.delete('invitation_draft_v1');
    expect(() => loadDraft()).not.toThrow();
  });

  it('saveDraft sets updatedAt timestamp', () => {
    setDraftFullPayload({ test: true });
    const stored = JSON.parse(localStorageMap.get('invitation_draft_v1'));
    expect(stored.updatedAt).toBeTruthy();
    expect(new Date(stored.updatedAt).getTime()).toBeGreaterThan(Date.now() - 5000);
  });
});


// ═══════════════════════════════════════════════════════
// 7. CATEGORY MAPPING
// ═══════════════════════════════════════════════════════
describe('Category Mapping', () => {
  it('maps all UI IDs to enums', () => {
    expect(categoryIdToEnum('weddings')).toBe('WEDDING');
    expect(categoryIdToEnum('gallery')).toBe('GALLERY');
    expect(categoryIdToEnum('birthdays')).toBe('BIRTHDAY');
    expect(categoryIdToEnum('corporate')).toBe('CORPORATE');
    expect(categoryIdToEnum('graduations')).toBe('GRADUATION');
    expect(categoryIdToEnum('dinners')).toBe('DINNER');
    expect(categoryIdToEnum('baby')).toBe('BABY_SHOWER');
    expect(categoryIdToEnum('conferences')).toBe('CONFERENCE');
  });

  it('maps all enums back to UI IDs', () => {
    expect(enumToCategoryId('WEDDING')).toBe('weddings');
    expect(enumToCategoryId('GALLERY')).toBe('gallery');
    expect(enumToCategoryId('BIRTHDAY')).toBe('birthdays');
    expect(enumToCategoryId('CORPORATE')).toBe('corporate');
    expect(enumToCategoryId('GRADUATION')).toBe('graduations');
    expect(enumToCategoryId('DINNER')).toBe('dinners');
    expect(enumToCategoryId('BABY_SHOWER')).toBe('baby');
    expect(enumToCategoryId('CONFERENCE')).toBe('conferences');
  });

  it('returns null for unknown ID', () => {
    expect(categoryIdToEnum('unknown')).toBeNull();
    expect(categoryIdToEnum('')).toBeNull();
    expect(categoryIdToEnum(null)).toBeNull();
  });

  it('returns null for unknown enum', () => {
    expect(enumToCategoryId('UNKNOWN')).toBeNull();
    expect(enumToCategoryId('')).toBeNull();
  });

  it('EventCategoryEnum is frozen', () => {
    expect(Object.isFrozen(EventCategoryEnum)).toBe(true);
    expect(() => { EventCategoryEnum.NEW = 'NEW'; }).toThrow();
  });
});


// ═══════════════════════════════════════════════════════
// 8. DRAFT SYNC — ALL PATHS
// ═══════════════════════════════════════════════════════
describe('Draft Sync (syncDraftToBackend)', () => {
  it('returns null when no draft exists', async () => {
    const result = await syncDraftToBackend();
    expect(result).toBeNull();
    expect(eventFullService.createFull).not.toHaveBeenCalled();
  });

  it('uses full payload path when fullPayload exists', async () => {
    const payload = { invitationName: 'test', categoryType: 'WEDDING' };
    setDraftFullPayload(payload);

    eventFullService.createFull.mockResolvedValue({
      data: { data: { event: { id: 'ev-full' } } },
    });

    const result = await syncDraftToBackend();

    expect(eventFullService.createFull).toHaveBeenCalledWith(payload);
    expect(result.event.id).toBe('ev-full');
    expect(onboardingStore.eventId).toBe('ev-full');
    expect(hasDraft()).toBe(false); // cleared
  });

  it('handles response with id directly (no event wrapper)', async () => {
    setDraftFullPayload({ test: true });

    eventFullService.createFull.mockResolvedValue({
      data: { data: { id: 'ev-direct' } },
    });

    const result = await syncDraftToBackend();
    expect(onboardingStore.eventId).toBe('ev-direct');
  });

  it('handles response at data level (no nested data.data)', async () => {
    setDraftFullPayload({ test: true });

    eventFullService.createFull.mockResolvedValue({
      data: { event: { id: 'ev-flat' } },
    });

    const result = await syncDraftToBackend();
    expect(result.event.id).toBe('ev-flat');
  });

  it('legacy path syncs individual items when eventId exists', async () => {
    addDraftItem('eventDetails', { type: 'CHURCH', time: '16:00' });
    addDraftItem('agenda', { type: 'CEREMONY', time: '17:00' });
    addDraftItem('ourStory', { type: 'HOW_WE_MET', description: 'We met in Skopje' });
    setEventId('ev-legacy');

    eventDetailsService.create.mockResolvedValue({});
    agendaApi.createItem.mockResolvedValue({});
    ourStoryApi.create.mockResolvedValue({});

    const result = await syncDraftToBackend();

    expect(eventDetailsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CHURCH', eventId: 'ev-legacy' })
    );
    expect(agendaApi.createItem).toHaveBeenCalledWith(
      'ev-legacy',
      expect.objectContaining({ type: 'CEREMONY' })
    );
    expect(ourStoryApi.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'HOW_WE_MET', eventId: 'ev-legacy' })
    );
    expect(hasDraft()).toBe(false);
  });

  it('legacy path strips _localId and id from items', async () => {
    addDraftItem('eventDetails', { type: 'CHURCH', time: '16:00', _localId: '_local_1', id: '_local_1' });
    setEventId('ev-strip');
    eventDetailsService.create.mockResolvedValue({});

    await syncDraftToBackend();

    const callArg = eventDetailsService.create.mock.calls[0][0];
    expect(callArg._localId).toBeUndefined();
    expect(callArg.id).toBeUndefined();
    expect(callArg.type).toBe('CHURCH');
  });

  it('legacy path returns null when no eventId', async () => {
    addDraftItem('eventDetails', { type: 'CHURCH' });
    // No eventId set, no fullPayload
    const result = await syncDraftToBackend();
    expect(result).toBeNull();
    expect(eventDetailsService.create).not.toHaveBeenCalled();
  });

  it('full payload path takes priority over legacy items', async () => {
    addDraftItem('eventDetails', { type: 'CHURCH' });
    setDraftFullPayload({ invitationName: 'priority' });
    setEventId('ev-both');

    eventFullService.createFull.mockResolvedValue({
      data: { data: { event: { id: 'ev-new' } } },
    });

    await syncDraftToBackend();

    expect(eventFullService.createFull).toHaveBeenCalled();
    expect(eventDetailsService.create).not.toHaveBeenCalled();
  });

  it('handles API failure gracefully and returns null', async () => {
    setDraftFullPayload({ test: true });
    eventFullService.createFull.mockRejectedValue(new Error('Server 500'));

    const result = await syncDraftToBackend();
    expect(result).toBeNull();
  });
});


// ═══════════════════════════════════════════════════════
// 9. ROUTER GUARDS
// ═══════════════════════════════════════════════════════
describe('Router Guards', () => {
  // Simulate the guard logic from router.js

  function runGuards({ routeName, routeMeta = {}, isAuth, isAdmin, hasCategory, hasEventId, isEmailVerified }) {
    // Returns the redirect target or null (allowed)
    if (routeMeta.requiresAuth && !isAuth) {
      return { redirect: 'login' };
    }
    if (routeMeta.requiresAdmin && !isAdmin) {
      return { redirect: 'dashboard.overview' };
    }
    if (routeMeta.guestOnly && isAuth) {
      return { redirect: isAdmin ? 'admin.events' : 'dashboard.overview' };
    }
    if (routeName === 'EventCategoryPage' && !isEmailVerified && !isAuth) {
      return { redirect: 'AuthVerifyEmailPage' };
    }
    if (routeName === 'EventInvitationsPage' && !hasCategory && isAuth && !hasEventId) {
      return { redirect: 'EventCategoryPage' };
    }
    return null; // allowed
  }

  // requiresAuth
  it('blocks unauthenticated user from dashboard', () => {
    const result = runGuards({ routeName: 'dashboard.overview', routeMeta: { requiresAuth: true }, isAuth: false });
    expect(result.redirect).toBe('login');
  });

  it('allows authenticated user to dashboard', () => {
    const result = runGuards({ routeName: 'dashboard.overview', routeMeta: { requiresAuth: true }, isAuth: true });
    expect(result).toBeNull();
  });

  // requiresAdmin
  it('blocks non-admin from admin routes', () => {
    const result = runGuards({ routeName: 'admin.events', routeMeta: { requiresAuth: true, requiresAdmin: true }, isAuth: true, isAdmin: false });
    expect(result.redirect).toBe('dashboard.overview');
  });

  it('allows admin to admin routes', () => {
    const result = runGuards({ routeName: 'admin.events', routeMeta: { requiresAuth: true, requiresAdmin: true }, isAuth: true, isAdmin: true });
    expect(result).toBeNull();
  });

  // guestOnly
  it('redirects authenticated regular user away from signup', () => {
    const result = runGuards({ routeName: 'signup', routeMeta: { guestOnly: true }, isAuth: true, isAdmin: false });
    expect(result.redirect).toBe('dashboard.overview');
  });

  it('redirects authenticated admin away from login to admin dashboard', () => {
    const result = runGuards({ routeName: 'login', routeMeta: { guestOnly: true }, isAuth: true, isAdmin: true });
    expect(result.redirect).toBe('admin.events');
  });

  it('allows guest to access signup', () => {
    const result = runGuards({ routeName: 'signup', routeMeta: { guestOnly: true }, isAuth: false });
    expect(result).toBeNull();
  });

  // Category page guard
  it('blocks unverified unauthenticated user from category page', () => {
    const result = runGuards({ routeName: 'EventCategoryPage', isAuth: false, isEmailVerified: false });
    expect(result.redirect).toBe('AuthVerifyEmailPage');
  });

  it('allows authenticated user to category page (implicitly verified)', () => {
    const result = runGuards({ routeName: 'EventCategoryPage', isAuth: true, isEmailVerified: false });
    expect(result).toBeNull();
  });

  it('allows verified unauthenticated user to category page', () => {
    const result = runGuards({ routeName: 'EventCategoryPage', isAuth: false, isEmailVerified: true });
    expect(result).toBeNull();
  });

  // Invitations page guard
  it('blocks authenticated user without category from invitations', () => {
    const result = runGuards({ routeName: 'EventInvitationsPage', isAuth: true, hasCategory: false, hasEventId: false });
    expect(result.redirect).toBe('EventCategoryPage');
  });

  it('allows authenticated user with category to invitations', () => {
    const result = runGuards({ routeName: 'EventInvitationsPage', isAuth: true, hasCategory: true, hasEventId: false });
    expect(result).toBeNull();
  });

  it('allows authenticated user with eventId to skip category for invitations', () => {
    const result = runGuards({ routeName: 'EventInvitationsPage', isAuth: true, hasCategory: false, hasEventId: true });
    expect(result).toBeNull();
  });

  it('allows unauthenticated user to browse invitations freely', () => {
    const result = runGuards({ routeName: 'EventInvitationsPage', isAuth: false, hasCategory: false, hasEventId: false });
    expect(result).toBeNull();
  });
});


// ═══════════════════════════════════════════════════════
// 10. EVENT INVITATIONS PAGE — onContinue LOGIC
// ═══════════════════════════════════════════════════════
describe('EventInvitationsPage — onContinue', () => {
  const templates = [
    { id: 't1', name: 'Elegant Chateau', path: 'invitations/elegant-chateau' },
    { id: 't2', name: 'Coastal Breeze', path: 'invitations/coastal-breeze' },
    { id: 't3', name: 'Persian Wedding', path: 'invitations/persian-wedding' },
  ];

  // Simulate onContinue logic
  async function simulateOnContinue({ isAuth, invitationName, eventId, username, lang, templateList }) {
    if (!invitationName) return { action: 'noop' };
    if (!isAuth) return { action: 'redirect', target: 'signup' };

    try {
      let currentEventId = eventId;
      if (!currentEventId) {
        const res = await eventsService.create({
          name: 'New Event',
          categoryType: onboardingStore.selectedCategory,
          status: 'DRAFT',
          username,
          lang,
        });
        currentEventId = res?.id || res?.eventId;
        setEventId(currentEventId);
      }

      if (currentEventId) {
        const selected = templateList.find(t => t.id === invitationName);
        const path = selected?.path || invitationName;
        await eventsService.updateInvitation(currentEventId, { invitationName: path });
      }

      return { action: 'redirect', target: 'dashboard.overview', eventId: currentEventId };
    } catch (e) {
      return { action: 'error', message: e?.message || 'Failed to save invitation' };
    }
  }

  beforeEach(() => {
    setSelectedCategory(EventCategoryEnum.WEDDING);
  });

  it('does nothing when no invitation is selected', async () => {
    const result = await simulateOnContinue({ isAuth: true, invitationName: '', templateList: templates });
    expect(result.action).toBe('noop');
  });

  it('redirects guest to signup', async () => {
    const result = await simulateOnContinue({ isAuth: false, invitationName: 't1', templateList: templates });
    expect(result).toEqual({ action: 'redirect', target: 'signup' });
  });

  it('creates event and attaches invitation for authenticated user', async () => {
    eventsService.create.mockResolvedValue({ id: 'ev-new' });
    eventsService.updateInvitation.mockResolvedValue({});

    const result = await simulateOnContinue({
      isAuth: true,
      invitationName: 't1',
      eventId: '',
      username: 'marko.s',
      lang: 'mk',
      templateList: templates,
    });

    expect(eventsService.create).toHaveBeenCalledWith(expect.objectContaining({
      categoryType: 'WEDDING',
      status: 'DRAFT',
    }));
    expect(eventsService.updateInvitation).toHaveBeenCalledWith('ev-new', {
      invitationName: 'invitations/elegant-chateau',
    });
    expect(result).toEqual({ action: 'redirect', target: 'dashboard.overview', eventId: 'ev-new' });
  });

  it('skips event creation when eventId already exists', async () => {
    setEventId('existing-ev');
    eventsService.updateInvitation.mockResolvedValue({});

    const result = await simulateOnContinue({
      isAuth: true,
      invitationName: 't2',
      eventId: 'existing-ev',
      username: 'marko.s',
      lang: 'mk',
      templateList: templates,
    });

    expect(eventsService.create).not.toHaveBeenCalled();
    expect(eventsService.updateInvitation).toHaveBeenCalledWith('existing-ev', {
      invitationName: 'invitations/coastal-breeze',
    });
    expect(result.target).toBe('dashboard.overview');
  });

  it('uses invitation id as fallback path when template not found', async () => {
    eventsService.create.mockResolvedValue({ id: 'ev-fb' });
    eventsService.updateInvitation.mockResolvedValue({});

    const result = await simulateOnContinue({
      isAuth: true,
      invitationName: 'unknown-template-id',
      eventId: '',
      username: 'marko.s',
      lang: 'mk',
      templateList: templates,
    });

    expect(eventsService.updateInvitation).toHaveBeenCalledWith('ev-fb', {
      invitationName: 'unknown-template-id', // fallback
    });
  });

  it('extracts eventId from res.eventId variant', async () => {
    eventsService.create.mockResolvedValue({ eventId: 'ev-variant' });
    eventsService.updateInvitation.mockResolvedValue({});

    const result = await simulateOnContinue({
      isAuth: true,
      invitationName: 't1',
      eventId: '',
      username: 'marko.s',
      lang: 'mk',
      templateList: templates,
    });

    expect(result.eventId).toBe('ev-variant');
  });

  it('returns error when event creation fails', async () => {
    eventsService.create.mockRejectedValue(new Error('DB error'));

    const result = await simulateOnContinue({
      isAuth: true,
      invitationName: 't1',
      eventId: '',
      username: 'marko.s',
      lang: 'mk',
      templateList: templates,
    });

    expect(result.action).toBe('error');
    expect(result.message).toBe('DB error');
  });

  it('returns error when invitation attachment fails', async () => {
    eventsService.create.mockResolvedValue({ id: 'ev-ok' });
    eventsService.updateInvitation.mockRejectedValue(new Error('Not found'));

    const result = await simulateOnContinue({
      isAuth: true,
      invitationName: 't1',
      eventId: '',
      username: 'marko.s',
      lang: 'mk',
      templateList: templates,
    });

    expect(result.action).toBe('error');
    expect(result.message).toBe('Not found');
  });

  it('returns generic error message when exception has no message', async () => {
    eventsService.create.mockRejectedValue({});

    const result = await simulateOnContinue({
      isAuth: true,
      invitationName: 't1',
      eventId: '',
      username: 'marko.s',
      lang: 'mk',
      templateList: templates,
    });

    expect(result.message).toBe('Failed to save invitation');
  });
});


// ═══════════════════════════════════════════════════════
// 11. VERIFY PAGE — REDIRECT LOGIC
// ═══════════════════════════════════════════════════════
describe('Verify Page — Redirect Decision', () => {
  function decideRedirect({ createdEvent, isAuth, isAdmin }) {
    if (!isAuth) return 'login';
    if (createdEvent?.event?.id || createdEvent?.id) return 'dashboard.overview';
    return 'EventCategoryPage';
  }

  it('redirects to login when auto-login fails', () => {
    expect(decideRedirect({ createdEvent: null, isAuth: false })).toBe('login');
  });

  it('redirects to dashboard when event was created from draft', () => {
    expect(decideRedirect({ createdEvent: { event: { id: 'ev-1' } }, isAuth: true })).toBe('dashboard.overview');
  });

  it('redirects to dashboard when event has direct id', () => {
    expect(decideRedirect({ createdEvent: { id: 'ev-2' }, isAuth: true })).toBe('dashboard.overview');
  });

  it('redirects to EventCategoryPage when no event and authenticated', () => {
    expect(decideRedirect({ createdEvent: null, isAuth: true })).toBe('EventCategoryPage');
  });

  it('redirects to EventCategoryPage when syncDraft returns empty object', () => {
    expect(decideRedirect({ createdEvent: {}, isAuth: true })).toBe('EventCategoryPage');
  });
});


// ═══════════════════════════════════════════════════════
// 12. VERIFY PAGE — OAUTH CALLBACK REDIRECT
// ═══════════════════════════════════════════════════════
describe('Verify Page — OAuth Redirect Decision', () => {
  function decideOAuthRedirect({ createdEvent, intent, isAdmin }) {
    if (createdEvent?.event?.id || createdEvent?.id) return 'dashboard.overview';
    if (intent === 'login') return isAdmin ? 'admin.events' : 'dashboard.overview';
    return 'EventCategoryPage'; // signup intent
  }

  it('goes to dashboard when draft event was created', () => {
    expect(decideOAuthRedirect({ createdEvent: { event: { id: 'ev-1' } }, intent: 'signup' })).toBe('dashboard.overview');
  });

  it('goes to dashboard for login intent (regular user)', () => {
    expect(decideOAuthRedirect({ createdEvent: null, intent: 'login', isAdmin: false })).toBe('dashboard.overview');
  });

  it('goes to admin for login intent (admin user)', () => {
    expect(decideOAuthRedirect({ createdEvent: null, intent: 'login', isAdmin: true })).toBe('admin.events');
  });

  it('goes to category page for signup intent without draft', () => {
    expect(decideOAuthRedirect({ createdEvent: null, intent: 'signup' })).toBe('EventCategoryPage');
  });
});


// ═══════════════════════════════════════════════════════
// 13. onBack LOGIC (EventInvitationsPage)
// ═══════════════════════════════════════════════════════
describe('EventInvitationsPage — onBack', () => {
  function simulateOnBack({ fromDashboard, isAuth }) {
    if (fromDashboard) return 'dashboard.overview';
    if (!isAuth) return 'home';
    return 'EventCategoryPage';
  }

  it('returns to dashboard when coming from dashboard', () => {
    expect(simulateOnBack({ fromDashboard: true, isAuth: true })).toBe('dashboard.overview');
  });

  it('returns to home for unauthenticated user', () => {
    expect(simulateOnBack({ fromDashboard: false, isAuth: false })).toBe('home');
  });

  it('returns to category page for authenticated user', () => {
    expect(simulateOnBack({ fromDashboard: false, isAuth: true })).toBe('EventCategoryPage');
  });
});


// ═══════════════════════════════════════════════════════
// 14. filteredInvitations LOGIC
// ═══════════════════════════════════════════════════════
describe('filteredInvitations — newest 3 with selection priority', () => {
  function computeFiltered(templates, selectedId) {
    const mapped = templates.map(t => ({
      id: t.id,
      name: t.name,
      thumbnailUrl: t.thumbnailImage || (t.path ? `/thumbnails/${t.path.split('/').pop()}.svg` : ''),
    }));
    const newest = mapped.slice(-3).reverse();
    if (selectedId) {
      const idx = newest.findIndex(i => i.id === selectedId);
      if (idx > 0) {
        const [item] = newest.splice(idx, 1);
        newest.unshift(item);
      }
    }
    return newest;
  }

  const allTemplates = [
    { id: 't1', name: 'A', path: 'invitations/a', thumbnailImage: '/img/a.jpg' },
    { id: 't2', name: 'B', path: 'invitations/b', thumbnailImage: '/img/b.jpg' },
    { id: 't3', name: 'C', path: 'invitations/c', thumbnailImage: '' },
    { id: 't4', name: 'D', path: 'invitations/d', thumbnailImage: '/img/d.jpg' },
    { id: 't5', name: 'E', path: 'invitations/e', thumbnailImage: '/img/e.jpg' },
  ];

  it('returns last 3 templates reversed (newest first)', () => {
    const result = computeFiltered(allTemplates, null);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe('t5');
    expect(result[1].id).toBe('t4');
    expect(result[2].id).toBe('t3');
  });

  it('moves selected template to first position', () => {
    const result = computeFiltered(allTemplates, 't4');
    expect(result[0].id).toBe('t4');
    expect(result[1].id).toBe('t5');
    expect(result[2].id).toBe('t3');
  });

  it('keeps selected first if already first', () => {
    const result = computeFiltered(allTemplates, 't5');
    expect(result[0].id).toBe('t5'); // already first, no change
  });

  it('ignores selection not in newest 3', () => {
    const result = computeFiltered(allTemplates, 't1'); // t1 is not in last 3
    expect(result[0].id).toBe('t5'); // unchanged
    expect(result).toHaveLength(3);
  });

  it('generates fallback thumbnail from path', () => {
    const result = computeFiltered(allTemplates, null);
    const noThumb = result.find(r => r.id === 't3');
    expect(noThumb.thumbnailUrl).toBe('/thumbnails/c.svg');
  });

  it('uses thumbnailImage when available', () => {
    const result = computeFiltered(allTemplates, null);
    const withThumb = result.find(r => r.id === 't5');
    expect(withThumb.thumbnailUrl).toBe('/img/e.jpg');
  });

  it('handles fewer than 3 templates', () => {
    const result = computeFiltered([allTemplates[0], allTemplates[1]], null);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('t2');
    expect(result[1].id).toBe('t1');
  });

  it('handles empty template list', () => {
    const result = computeFiltered([], null);
    expect(result).toEqual([]);
  });

  it('handles single template', () => {
    const result = computeFiltered([allTemplates[0]], null);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('t1');
  });
});


// ═══════════════════════════════════════════════════════
// 15. resolveTemplate LOGIC
// ═══════════════════════════════════════════════════════
describe('resolveTemplate', () => {
  const templates = [
    { id: 'abc-123', path: 'invitations/elegant-chateau', slug: 'elegant-chateau', name: 'Elegant Chateau' },
    { id: 'def-456', path: 'invitations/coastal-breeze', slug: 'coastal-breeze', name: 'Coastal Breeze' },
  ];

  function resolveTemplate(name) {
    if (!name) return null;
    return templates.find(t =>
      t.id === name || t.path === name || t.slug === name ||
      t.name?.toLowerCase().replace(/\s+/g, '-') === name
    ) || null;
  }

  it('matches by id', () => {
    expect(resolveTemplate('abc-123')?.name).toBe('Elegant Chateau');
  });

  it('matches by path', () => {
    expect(resolveTemplate('invitations/elegant-chateau')?.name).toBe('Elegant Chateau');
  });

  it('matches by slug', () => {
    expect(resolveTemplate('coastal-breeze')?.name).toBe('Coastal Breeze');
  });

  it('matches by normalized name', () => {
    expect(resolveTemplate('elegant-chateau')?.name).toBe('Elegant Chateau');
  });

  it('returns null for empty input', () => {
    expect(resolveTemplate('')).toBeNull();
    expect(resolveTemplate(null)).toBeNull();
    expect(resolveTemplate(undefined)).toBeNull();
  });

  it('returns null for no match', () => {
    expect(resolveTemplate('nonexistent')).toBeNull();
  });
});


// ═══════════════════════════════════════════════════════
// 16. FULL E2E FLOW
// ═══════════════════════════════════════════════════════
describe('Full Signup-First Flow (end-to-end)', () => {
  it('Signup → Verify → Category → Invitation → Create Event → Dashboard', async () => {
    // ── 1. Signup ──
    apiPublic.post.mockImplementation((url) => {
      if (url === '/public/users/register') return Promise.resolve({ data: { username: 'marko.s' } });
      if (url === '/public/auth/verify-email') return Promise.resolve({ data: { success: true } });
      if (url === '/public/users/login') return Promise.resolve({ data: { access_token: fakeJwt(), refresh_token: 'r-tok' } });
      if (url === '/public/users/assign-role') return Promise.resolve({ data: {} });
      return Promise.reject(new Error(`Unmocked: ${url}`));
    });

    const { register, verifyEmail, loginWithCredentials, isAuthenticated } = await import('@/services/auth.service');
    await register({ username: 'marko.s', email: 'marko@example.com', password: 'Secure1!@', firstName: 'Marko', lastName: 'S', roles: ['USER'] });
    setEmail('marko@example.com');
    setTempPassword('Secure1!@');
    setTempUsername('marko.s');
    expect(hasDraft()).toBe(false);

    // ── 2. Verify ──
    await verifyEmail('999999', 'marko@example.com');
    setEmailVerified(true);
    await loginWithCredentials('marko@example.com', 'Secure1!@');
    clearTempCredentials();
    expect(isAuthenticated()).toBe(true);

    const draftResult = await syncDraftToBackend();
    expect(draftResult).toBeNull();

    // ── 3. Category ──
    setSelectedCategory(categoryIdToEnum('weddings'));
    expect(onboardingStore.selectedCategory).toBe('WEDDING');

    // ── 4. Invitation ──
    invitationTemplateService.listByCategory.mockResolvedValue([
      { id: 't1', name: 'Elegant Chateau', path: 'invitations/elegant-chateau', active: true },
      { id: 't2', name: 'Coastal Breeze', path: 'invitations/coastal-breeze', active: true },
    ]);
    const loaded = await invitationTemplateService.listByCategory('WEDDING');
    expect(loaded).toHaveLength(2);
    setInvitationName('t2');

    // ── 5. Create Event ──
    eventsService.create.mockResolvedValue({ id: 'event-final-456' });
    eventsService.updateInvitation.mockResolvedValue({});

    const res = await eventsService.create({ name: 'New Event', categoryType: 'WEDDING', status: 'DRAFT', username: 'marko.s', lang: 'mk' });
    setEventId(res.id);
    await eventsService.updateInvitation(res.id, { invitationName: 'invitations/coastal-breeze' });

    // ── 6. Verify final state ──
    expect(onboardingStore.eventId).toBe('event-final-456');
    expect(onboardingStore.selectedCategory).toBe('WEDDING');
    expect(onboardingStore.invitationName).toBe('t2');
    expect(onboardingStore.isEmailVerified).toBe(true);
  });

  it('recovers from event creation failure — state preserved for retry', async () => {
    setAuthenticated();
    setSelectedCategory(EventCategoryEnum.WEDDING);
    setInvitationName('t1');

    eventsService.create.mockRejectedValueOnce(new Error('Timeout'));
    eventsService.create.mockResolvedValueOnce({ id: 'ev-retry' });
    eventsService.updateInvitation.mockResolvedValue({});

    // First attempt fails
    let error;
    try {
      await eventsService.create({ name: 'New Event', categoryType: 'WEDDING', status: 'DRAFT' });
    } catch (e) {
      error = e.message;
    }
    expect(error).toBe('Timeout');
    expect(onboardingStore.eventId).toBeFalsy();

    // State preserved — retry succeeds
    expect(onboardingStore.selectedCategory).toBe('WEDDING');
    expect(onboardingStore.invitationName).toBe('t1');

    const res = await eventsService.create({ name: 'New Event', categoryType: 'WEDDING', status: 'DRAFT' });
    setEventId(res.id);
    await eventsService.updateInvitation(res.id, { invitationName: 'invitations/elegant-chateau' });

    expect(onboardingStore.eventId).toBe('ev-retry');
  });
});

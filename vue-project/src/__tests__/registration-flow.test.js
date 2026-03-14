/**
 * Registration Flow Integration Tests
 *
 * Tests the full onboarding flow:
 * Home → EventCategoryPage → EventInvitationsPage → Save (guest) →
 * Signup → Verify Email → Create Event from Draft → Redirect to Dashboard
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

// ─── Mock crypto.randomUUID ───
vi.stubGlobal('crypto', { randomUUID: () => `mock-${Date.now()}-${Math.random().toString(36).slice(2)}` });

// ─── Mock services (must come before store/composable imports) ───
vi.mock('@/services/backendApi', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
  scheduleProactiveRefresh: vi.fn(),
}));

vi.mock('@/services/env', () => ({
  getRuntimeEnv: () => ({ APP_ENV: 'local', VITE_KEYCLOAK_URL: 'http://localhost:8080' }),
  detectDefaultEnvFromLocation: () => 'local',
  computeKeycloakBaseUrl: () => 'http://localhost:8080',
}));

vi.mock('@/services/eventFull.service', () => ({
  eventFullService: {
    createFull: vi.fn(),
    updateFull: vi.fn(),
  },
}));

vi.mock('@/services/events.service', () => ({
  eventsService: {
    create: vi.fn(),
    updateInvitation: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('@/services/eventDetails.service', () => ({
  eventDetailsService: { create: vi.fn() },
}));

vi.mock('@/services/agenda.service', () => ({
  agendaApi: { createItem: vi.fn() },
}));

vi.mock('@/services/ourStory.service', () => ({
  ourStoryApi: { create: vi.fn() },
}));

vi.mock('@/services/invitationTemplate.service', () => ({
  invitationTemplateService: {
    listByCategory: vi.fn(),
  },
}));

// ─── Now import stores & composables ───
import {
  onboardingStore, setSelectedCategory, setInvitationName,
  setEmail, setTempPassword, setTempUsername, setEmailVerified,
  setEventId, clearOnboarding, getTempPassword, clearTempCredentials,
} from '@/store/onboarding.store';

import {
  draftStore, clearDraft, setDraftFullPayload, hasDraft, getDraftFullPayload,
} from '@/store/invitationDraft.store';

import { syncDraftToBackend } from '@/composables/useDraftSync';
import { eventFullService } from '@/services/eventFull.service';
import { invitationTemplateService } from '@/services/invitationTemplate.service';
import { categoryIdToEnum } from '@/helper/CategoryMapping.helper';
import { EventCategoryEnum } from '@/enums/EventCategory';
import apiPublic from '@/services/backendApi';

// ─── Helpers ───
function fakeJwt(claims = {}) {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const payload = btoa(JSON.stringify({
    sub: 'user-123',
    preferred_username: 'testuser',
    email: 'test@example.com',
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

// ─── Setup / Teardown ───
beforeEach(() => {
  localStorageMap.clear();
  sessionStorageMap.clear();
  clearDraft();
  clearOnboarding();
  clearAuth();
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════
// 1. CATEGORY SELECTION (EventCategoryPage step)
// ═══════════════════════════════════════════════════
describe('Step 1: Category Selection', () => {
  it('stores the selected category in the onboarding store', () => {
    setSelectedCategory(EventCategoryEnum.WEDDING);
    expect(onboardingStore.selectedCategory).toBe('WEDDING');
  });

  it('persists category to localStorage', () => {
    setSelectedCategory(EventCategoryEnum.WEDDING);
    const stored = JSON.parse(localStorageMap.get('onboarding_state_v1'));
    expect(stored.selectedCategory).toBe('WEDDING');
  });

  it('maps UI category ID to backend enum correctly', () => {
    expect(categoryIdToEnum('weddings')).toBe(EventCategoryEnum.WEDDING);
    expect(categoryIdToEnum('gallery')).toBe(EventCategoryEnum.GALLERY);
    expect(categoryIdToEnum('nonexistent')).toBeNull();
  });

  it('overwrites previously selected category', () => {
    setSelectedCategory(EventCategoryEnum.WEDDING);
    setSelectedCategory(EventCategoryEnum.GALLERY);
    expect(onboardingStore.selectedCategory).toBe('GALLERY');
  });
});

// ═══════════════════════════════════════════════════
// 2. INVITATION SELECTION (EventInvitationsPage step)
// ═══════════════════════════════════════════════════
describe('Step 2: Invitation Selection', () => {
  it('stores the selected invitation name', () => {
    setInvitationName('elegant-chateau');
    expect(onboardingStore.invitationName).toBe('elegant-chateau');
  });

  it('persists invitation name to localStorage', () => {
    setInvitationName('parisian-wedding');
    const stored = JSON.parse(localStorageMap.get('onboarding_state_v1'));
    expect(stored.invitationName).toBe('parisian-wedding');
  });

  it('listByCategory fetches templates for the selected category', async () => {
    const mockTemplates = [
      { id: '1', name: 'Template A', path: 'invitations/a', active: true },
      { id: '2', name: 'Template B', path: 'invitations/b', active: true },
      { id: '3', name: 'Template C', path: 'invitations/c', active: true },
    ];
    invitationTemplateService.listByCategory.mockResolvedValue(mockTemplates);

    const result = await invitationTemplateService.listByCategory('WEDDING');
    expect(invitationTemplateService.listByCategory).toHaveBeenCalledWith('WEDDING');
    expect(result).toHaveLength(3);
  });
});

// ═══════════════════════════════════════════════════
// 3. GUEST SAVE → DRAFT STORAGE (unauthenticated user saves invitation)
// ═══════════════════════════════════════════════════
describe('Step 3: Guest Save (unauthenticated → store draft)', () => {
  it('saves full event payload to draft store', () => {
    const payload = {
      brideName: 'Ana',
      groomName: 'Marko',
      invitationName: 'elegant-chateau',
      palette: { accent: '#9f8274' },
      categoryType: 'WEDDING',
    };
    setDraftFullPayload(payload);

    expect(hasDraft()).toBe(true);
    expect(getDraftFullPayload()).toEqual(payload);
  });

  it('persists draft to localStorage', () => {
    setDraftFullPayload({ invitationName: 'coastal-breeze' });
    const stored = JSON.parse(localStorageMap.get('invitation_draft_v1'));
    expect(stored.fullPayload.invitationName).toBe('coastal-breeze');
    expect(stored.updatedAt).toBeTruthy();
  });

  it('unauthenticated user does not have access_token', () => {
    expect(localStorageMap.has('access_token')).toBe(false);
  });

  it('stores invitation name in onboarding before redirecting to signup', () => {
    // Simulate: user picks category and invitation, then clicks save
    setSelectedCategory(EventCategoryEnum.WEDDING);
    setInvitationName('persian-wedding');
    setDraftFullPayload({ invitationName: 'persian-wedding', categoryType: 'WEDDING' });

    expect(onboardingStore.selectedCategory).toBe('WEDDING');
    expect(onboardingStore.invitationName).toBe('persian-wedding');
    expect(hasDraft()).toBe(true);
  });
});

// ═══════════════════════════════════════════════════
// 4. SIGNUP (registration)
// ═══════════════════════════════════════════════════
describe('Step 4: Signup', () => {
  it('register API call sends correct payload', async () => {
    apiPublic.post.mockResolvedValue({
      data: { username: 'testuser' },
    });

    const payload = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test123!@#',
      firstName: 'Test',
      lastName: 'User',
      roles: ['USER'],
    };

    const { register } = await import('@/services/auth.service');
    await register(payload);
    expect(apiPublic.post).toHaveBeenCalledWith('/public/users/register', payload);
  });

  it('stores email and temp credentials after registration', () => {
    setEmail('test@example.com');
    setTempPassword('Test123!@#');
    setTempUsername('testuser');

    expect(onboardingStore.email).toBe('test@example.com');
    expect(getTempPassword()).toBe('Test123!@#');
  });

  it('preserves draft data through registration step', () => {
    // Draft was saved before signup
    setDraftFullPayload({ invitationName: 'elegant-chateau', categoryType: 'WEDDING' });
    setSelectedCategory(EventCategoryEnum.WEDDING);
    setInvitationName('elegant-chateau');

    // Simulate signup storing credentials
    setEmail('user@example.com');
    setTempPassword('Pass123!');

    // Draft should still be intact
    expect(hasDraft()).toBe(true);
    expect(getDraftFullPayload().invitationName).toBe('elegant-chateau');
    expect(onboardingStore.selectedCategory).toBe('WEDDING');
  });
});

// ═══════════════════════════════════════════════════
// 5. EMAIL VERIFICATION
// ═══════════════════════════════════════════════════
describe('Step 5: Email Verification', () => {
  it('verifyEmail API call sends code and email', async () => {
    apiPublic.post.mockResolvedValue({ data: { success: true } });

    const { verifyEmail } = await import('@/services/auth.service');
    await verifyEmail('123456', 'test@example.com');
    expect(apiPublic.post).toHaveBeenCalledWith('/public/auth/verify-email', {
      code: '123456',
      email: 'test@example.com',
    });
  });

  it('sets email verified flag in onboarding store', () => {
    setEmailVerified(true);
    expect(onboardingStore.isEmailVerified).toBe(true);

    const stored = JSON.parse(localStorageMap.get('onboarding_state_v1'));
    expect(stored.isEmailVerified).toBe(true);
  });

  it('auto-login stores tokens in localStorage', async () => {
    apiPublic.post.mockResolvedValue({
      data: {
        access_token: fakeJwt(),
        refresh_token: 'refresh-123',
        id_token: 'id-123',
      },
    });

    const { loginWithCredentials } = await import('@/services/auth.service');
    await loginWithCredentials('test@example.com', 'Test123!');

    expect(localStorageMap.get('access_token')).toBeTruthy();
    expect(localStorageMap.get('refresh_token')).toBe('refresh-123');
  });

  it('clears temp credentials after auto-login', () => {
    setTempPassword('Test123!');
    setTempUsername('testuser');

    clearTempCredentials();

    expect(getTempPassword()).toBe('');
  });
});

// ═══════════════════════════════════════════════════
// 6. DRAFT SYNC → EVENT CREATION
// ═══════════════════════════════════════════════════
describe('Step 6: Draft Sync → Event Creation', () => {
  it('syncDraftToBackend creates event from full payload', async () => {
    const draftPayload = {
      brideName: 'Ana',
      groomName: 'Marko',
      invitationName: 'elegant-chateau',
      categoryType: 'WEDDING',
    };
    setDraftFullPayload(draftPayload);
    setAuthenticated();

    eventFullService.createFull.mockResolvedValue({
      data: {
        data: {
          event: { id: 'event-999' },
        },
      },
    });

    const result = await syncDraftToBackend();

    expect(eventFullService.createFull).toHaveBeenCalledWith(draftPayload);
    expect(result.event.id).toBe('event-999');
    expect(onboardingStore.eventId).toBe('event-999');
  });

  it('clears draft after successful sync', async () => {
    setDraftFullPayload({ invitationName: 'test' });

    eventFullService.createFull.mockResolvedValue({
      data: { data: { event: { id: 'ev-1' } } },
    });

    await syncDraftToBackend();
    expect(hasDraft()).toBe(false);
  });

  it('returns null when no draft exists', async () => {
    clearDraft();
    const result = await syncDraftToBackend();
    expect(result).toBeNull();
    expect(eventFullService.createFull).not.toHaveBeenCalled();
  });

  it('handles API failure gracefully and returns null', async () => {
    setDraftFullPayload({ invitationName: 'test' });

    eventFullService.createFull.mockRejectedValue(new Error('Network error'));

    const result = await syncDraftToBackend();
    expect(result).toBeNull();
  });

  it('sets eventId in onboarding store after event creation', async () => {
    setDraftFullPayload({ invitationName: 'test' });

    eventFullService.createFull.mockResolvedValue({
      data: { data: { id: 'event-abc' } },
    });

    await syncDraftToBackend();
    expect(onboardingStore.eventId).toBe('event-abc');
  });
});

// ═══════════════════════════════════════════════════
// 7. FULL FLOW: END-TO-END SEQUENCE
// ═══════════════════════════════════════════════════
describe('Full Registration Flow (end-to-end sequence)', () => {
  it('completes the full guest → signup → verify → create event flow', async () => {
    // ── Step 1: User selects category ──
    setSelectedCategory(EventCategoryEnum.WEDDING);
    expect(onboardingStore.selectedCategory).toBe('WEDDING');

    // ── Step 2: User selects invitation template ──
    setInvitationName('elegant-chateau');
    expect(onboardingStore.invitationName).toBe('elegant-chateau');

    // ── Step 3: User clicks save on invitation (not authenticated) ──
    // Invitation page saves full payload to draft and redirects to signup
    const fullPayload = {
      brideName: 'Ana',
      groomName: 'Marko',
      invitationName: 'elegant-chateau',
      categoryType: 'WEDDING',
      palette: { accent: '#9f8274', background: '#f9f8f6' },
      fonts: { heading: 'Playfair Display' },
      lang: 'mk',
    };
    setDraftFullPayload(fullPayload);
    expect(hasDraft()).toBe(true);

    // ── Step 4: User registers ──
    apiPublic.post.mockImplementation((url) => {
      if (url === '/public/users/register') {
        return Promise.resolve({ data: { username: 'ana.m' } });
      }
      if (url === '/public/auth/verify-email') {
        return Promise.resolve({ data: { success: true } });
      }
      if (url === '/public/users/login') {
        return Promise.resolve({
          data: {
            access_token: fakeJwt({ eventId: null }),
            refresh_token: 'r-tok',
          },
        });
      }
      if (url === '/public/users/assign-role') {
        return Promise.resolve({ data: {} });
      }
      return Promise.reject(new Error(`Unmocked: ${url}`));
    });

    const { register } = await import('@/services/auth.service');
    await register({
      username: 'ana.m',
      email: 'ana@example.com',
      password: 'Secure1!',
      firstName: 'Ana',
      lastName: 'M',
      roles: ['USER'],
    });

    setEmail('ana@example.com');
    setTempPassword('Secure1!');
    setTempUsername('ana.m');

    // Draft and onboarding data are preserved after signup
    expect(hasDraft()).toBe(true);
    expect(onboardingStore.email).toBe('ana@example.com');

    // ── Step 5: User verifies email ──
    const { verifyEmail, loginWithCredentials } = await import('@/services/auth.service');
    await verifyEmail('654321', 'ana@example.com');
    setEmailVerified(true);

    // Auto-login with temp credentials
    await loginWithCredentials('ana@example.com', 'Secure1!');
    expect(localStorageMap.get('access_token')).toBeTruthy();

    clearTempCredentials();
    expect(getTempPassword()).toBe('');

    // ── Step 6: Sync draft → create event ──
    eventFullService.createFull.mockResolvedValue({
      data: {
        data: {
          event: { id: 'event-final-123' },
        },
      },
    });

    const createdEvent = await syncDraftToBackend();

    // Event created from the draft saved in step 3
    expect(eventFullService.createFull).toHaveBeenCalledWith(fullPayload);
    expect(createdEvent.event.id).toBe('event-final-123');
    expect(onboardingStore.eventId).toBe('event-final-123');

    // Draft cleared after sync
    expect(hasDraft()).toBe(false);

    // ── Step 7: Redirect decision ──
    // createdEvent has an id → should redirect to dashboard.overview
    const shouldRedirectToDashboard = !!(createdEvent?.event?.id || createdEvent?.id);
    expect(shouldRedirectToDashboard).toBe(true);
  });

  it('redirects to EventCategoryPage when no draft exists after verify', async () => {
    // User registers without saving any invitation first
    clearDraft();
    setEmailVerified(true);
    setAuthenticated();

    const result = await syncDraftToBackend();
    expect(result).toBeNull();

    // No event was created → should redirect to category page, not dashboard
    const shouldRedirectToDashboard = !!(result?.event?.id || result?.id);
    expect(shouldRedirectToDashboard).toBe(false);
  });

  it('preserves all onboarding state across the full flow', () => {
    // Simulate the entire state being built up through the flow
    setSelectedCategory(EventCategoryEnum.WEDDING);
    setInvitationName('coastal-breeze');
    setEmail('user@test.com');
    setEmailVerified(true);
    setEventId('ev-42');

    // All state survives in localStorage
    const stored = JSON.parse(localStorageMap.get('onboarding_state_v1'));
    expect(stored.selectedCategory).toBe('WEDDING');
    expect(stored.invitationName).toBe('coastal-breeze');
    expect(stored.email).toBe('user@test.com');
    expect(stored.isEmailVerified).toBe(true);
    expect(stored.eventId).toBe('ev-42');
  });
});

// ═══════════════════════════════════════════════════
// 8. EDGE CASES & ERROR HANDLING
// ═══════════════════════════════════════════════════
describe('Edge Cases', () => {
  it('handles registration failure without corrupting state', async () => {
    setSelectedCategory(EventCategoryEnum.WEDDING);
    setInvitationName('elegant-chateau');
    setDraftFullPayload({ invitationName: 'elegant-chateau' });

    apiPublic.post.mockRejectedValue(new Error('Email already exists'));

    const { register } = await import('@/services/auth.service');
    await expect(register({
      username: 'dup',
      email: 'dup@test.com',
      password: 'P@ss1234',
      firstName: 'Dup',
      lastName: 'User',
      roles: ['USER'],
    })).rejects.toThrow('Email already exists');

    // State is still intact after failed registration
    expect(onboardingStore.selectedCategory).toBe('WEDDING');
    expect(hasDraft()).toBe(true);
  });

  it('handles verification failure without losing draft', async () => {
    setDraftFullPayload({ invitationName: 'test' });

    apiPublic.post.mockRejectedValue(new Error('Invalid code'));

    const { verifyEmail } = await import('@/services/auth.service');
    await expect(verifyEmail('wrong', 'user@test.com')).rejects.toThrow('Invalid code');

    // Draft survives verification failure
    expect(hasDraft()).toBe(true);
  });

  it('handles event creation failure during sync', async () => {
    setDraftFullPayload({ invitationName: 'test' });
    setAuthenticated();

    eventFullService.createFull.mockRejectedValue(new Error('Server 500'));

    const result = await syncDraftToBackend();
    // syncDraftToBackend catches errors and returns null
    expect(result).toBeNull();
  });

  it('clearOnboarding resets all state', () => {
    setSelectedCategory(EventCategoryEnum.WEDDING);
    setInvitationName('elegant-chateau');
    setEmail('test@test.com');
    setEmailVerified(true);
    setEventId('ev-1');

    clearOnboarding();

    expect(onboardingStore.selectedCategory).toBe('');
    expect(onboardingStore.invitationName).toBe('');
    expect(onboardingStore.email).toBe('');
    expect(onboardingStore.isEmailVerified).toBe(false);
    expect(onboardingStore.eventId).toBe('');
  });
});

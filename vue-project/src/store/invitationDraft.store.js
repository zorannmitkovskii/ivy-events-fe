import { reactive } from "vue";

const STORAGE_KEY = "invitation_draft_v1";
const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const defaultState = () => ({
  eventDetails: [],
  agenda: [],
  ourStory: [],
  theme: null,
  sectionState: null,
  fullPayload: null,
  updatedAt: null,
});

export const draftStore = reactive(defaultState());

export function generateLocalId() {
  return `_local_${crypto.randomUUID()}`;
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const saved = JSON.parse(raw);

    // TTL check — discard stale drafts
    if (saved.updatedAt) {
      const age = Date.now() - new Date(saved.updatedAt).getTime();
      if (age > DRAFT_TTL_MS) {
        clearDraft();
        return;
      }
    }

    draftStore.eventDetails = Array.isArray(saved.eventDetails) ? saved.eventDetails : [];
    draftStore.agenda = Array.isArray(saved.agenda) ? saved.agenda : [];
    draftStore.ourStory = Array.isArray(saved.ourStory) ? saved.ourStory : [];
    draftStore.theme = saved.theme || null;
    draftStore.sectionState = saved.sectionState || null;
    draftStore.fullPayload = saved.fullPayload || null;
    draftStore.updatedAt = saved.updatedAt || null;
  } catch (e) {
    console.warn("[invitationDraft] failed to parse saved state", e);
  }
}

export function saveDraft() {
  draftStore.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    eventDetails: draftStore.eventDetails,
    agenda: draftStore.agenda,
    ourStory: draftStore.ourStory,
    theme: draftStore.theme,
    sectionState: draftStore.sectionState,
    fullPayload: draftStore.fullPayload,
    updatedAt: draftStore.updatedAt,
  }));
}

export function clearDraft() {
  Object.assign(draftStore, defaultState());
  localStorage.removeItem(STORAGE_KEY);
}

export function hasDraft() {
  return (
    draftStore.eventDetails.length > 0 ||
    draftStore.agenda.length > 0 ||
    draftStore.ourStory.length > 0 ||
    draftStore.theme !== null ||
    draftStore.sectionState !== null ||
    draftStore.fullPayload !== null
  );
}

export function getDraftTheme() {
  return draftStore.theme;
}

export function setDraftTheme(theme) {
  draftStore.theme = theme;
  saveDraft();
}

export function getDraftSectionState() {
  return draftStore.sectionState;
}

export function setDraftSectionState(state) {
  draftStore.sectionState = state;
  saveDraft();
}

export function getDraftFullPayload() {
  return draftStore.fullPayload;
}

export function setDraftFullPayload(payload) {
  draftStore.fullPayload = payload;
  saveDraft();
}

export function getDraftItems(section) {
  return draftStore[section] || [];
}

export function addDraftItem(section, payload) {
  const localId = payload._localId || generateLocalId();
  const item = { ...payload, _localId: localId };
  draftStore[section].push(item);
  saveDraft();
  return item;
}

export function updateDraftItem(section, localId, payload) {
  const idx = draftStore[section].findIndex((x) => x._localId === localId);
  if (idx !== -1) {
    draftStore[section][idx] = { ...payload, _localId: localId };
    saveDraft();
  }
}

export function deleteDraftItem(section, localId) {
  draftStore[section] = draftStore[section].filter((x) => x._localId !== localId);
  saveDraft();
}

// Initialize on module load
loadDraft();

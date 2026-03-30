import { ref, computed, nextTick } from "vue";
import { useRoute } from "vue-router";
import { isAuthenticated } from "@/services/auth.service";
import { onboardingStore, setEventId } from "@/store/onboarding.store";
import { eventFullService } from "@/services/eventFull.service";
import { eventsService } from "@/services/events.service";
import { useAgenda } from "@/composables/useAgenda";
import { useEventDetails } from "@/composables/useEventDetails";
import { useOurStory } from "@/composables/useOurStory";
import {
  loadDraft,
  getDraftItems,
  addDraftItem,
  updateDraftItem,
  deleteDraftItem,
  generateLocalId,
} from "@/store/invitationDraft.store";
import { DESIGN_PRESETS } from "@/config/designPresets/index.js";

export function useInvitationEditMode() {
  const route = useRoute();

  // Edit mode is available whenever ?edit=true, regardless of auth
  const isEditMode = computed(() => route.query.edit === "true");

  // Sync eventId into onboarding store so CRUD composables can find it
  const eventId = computed(() => route.query.eventId || onboardingStore.eventId || null);
  if (isEditMode.value && eventId.value && onboardingStore.eventId !== eventId.value) {
    setEventId(eventId.value);
  }

  // Helper: true when we can make direct API calls (authenticated + event exists)
  const canUseApi = () => isAuthenticated() && eventId.value;

  // Modal state
  const activeModal = ref(null);
  const activeRootSection = ref(null);
  const editingItem = ref(null);
  const modalHistory = ref([]);

  // Dirty state & preview mode — enable save immediately for existing events
  const dirty = ref(!!eventId.value);
  const previewMode = ref('desktop');

  function markDirty() { dirty.value = true; }
  function clearDirty() { dirty.value = false; }

  // Toggle accordion section (single-expand)
  function toggleSection(key) {
    if (activeRootSection.value === key) {
      activeRootSection.value = null;
      activeModal.value = null;
      editingItem.value = null;
      modalHistory.value = [];
    } else {
      closeAllModals();
      activeRootSection.value = key;
      activeModal.value = key;
    }
  }

  // Unsaved changes guard
  function setupUnsavedGuard(router) {
    const onBeforeUnload = (e) => {
      if (dirty.value) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    const removeGuard = router.beforeEach((to, from, next) => {
      if (dirty.value) {
        const leave = window.confirm('You have unsaved changes. Leave without saving?');
        if (!leave) return next(false);
        clearDirty();
      }
      next();
    });

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      removeGuard();
    };
  }

  function openModal(section, item = null) {
    // Push current state to history if navigating deeper
    if (activeModal.value && activeModal.value !== section) {
      modalHistory.value.push({
        modal: activeModal.value,
        item: editingItem.value,
      });
    }
    activeModal.value = section;
    editingItem.value = item;
  }

  function closeModal() {
    // Pop from history if available
    if (modalHistory.value.length > 0) {
      const prev = modalHistory.value.pop();
      activeModal.value = prev.modal;
      editingItem.value = prev.item;
    } else {
      activeModal.value = null;
      editingItem.value = null;
      activeRootSection.value = null;
    }
  }

  function closeAllModals() {
    modalHistory.value = [];
    activeModal.value = null;
    activeRootSection.value = null;
    editingItem.value = null;
  }

  // Contextual edit: select a section from preview click
  function selectSection(key) {
    closeAllModals();
    activeRootSection.value = key;
    activeModal.value = key;
    nextTick(() => {
      const el = document.querySelector(`[data-edit-section="${key}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // Refresh callback — set by each invitation page
  const refreshCallback = ref(null);

  async function refresh() {
    if (typeof refreshCallback.value === "function") {
      await refreshCallback.value();
    }
  }

  // ---- Event Details handlers ----
  const eventDetails = useEventDetails();

  async function handleEventDetailSave(payload) {
    if (canUseApi()) {
      if (payload.id) {
        await eventDetails.updateItem(payload.id, payload);
      } else {
        await eventDetails.createItem(payload);
      }
    } else {
      if (payload.id && payload.id.startsWith("_local_")) {
        updateDraftItem("eventDetails", payload.id, payload);
        const idx = eventDetails.items.value.findIndex((x) => x.id === payload.id);
        if (idx !== -1) eventDetails.items.value[idx] = { ...payload, _localId: payload.id };
      } else {
        const localId = generateLocalId();
        addDraftItem("eventDetails", { ...payload, _localId: localId });
        eventDetails.items.value.push({ ...payload, _localId: localId, id: localId });
      }
    }
    closeModal();
    await refresh();
  }

  async function handleEventDetailUpdate(payload) {
    if (canUseApi()) {
      if (payload.id) await eventDetails.updateItem(payload.id, payload);
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("eventDetails", payload.id, payload);
      const idx = eventDetails.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) eventDetails.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
  }

  async function handleEventDetailDelete(id) {
    if (canUseApi()) {
      await eventDetails.deleteItem(id);
    } else {
      deleteDraftItem("eventDetails", id);
      eventDetails.items.value = eventDetails.items.value.filter((x) => x.id !== id);
    }
    closeModal();
    await refresh();
  }

  // ---- Agenda handlers ----
  const agenda = useAgenda();

  async function handleAgendaSave(payload) {
    if (canUseApi()) {
      if (payload.id) {
        await agenda.updateItem(payload.id, payload);
      } else {
        await agenda.createItem(payload);
      }
    } else {
      if (payload.id && payload.id.startsWith("_local_")) {
        updateDraftItem("agenda", payload.id, payload);
        const idx = agenda.items.value.findIndex((x) => x.id === payload.id);
        if (idx !== -1) agenda.items.value[idx] = { ...payload, _localId: payload.id };
      } else {
        const localId = generateLocalId();
        addDraftItem("agenda", { ...payload, _localId: localId });
        agenda.items.value.push({ ...payload, _localId: localId, id: localId });
      }
    }
    closeModal();
    await refresh();
  }

  async function handleAgendaUpdate(payload) {
    if (canUseApi()) {
      if (payload.id) await agenda.updateItem(payload.id, payload);
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("agenda", payload.id, payload);
      const idx = agenda.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) agenda.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
  }

  async function handleAgendaDelete(id) {
    if (canUseApi()) {
      await agenda.deleteItem(id);
    } else {
      deleteDraftItem("agenda", id);
      agenda.items.value = agenda.items.value.filter((x) => x.id !== id);
    }
    closeModal();
    await refresh();
  }

  // ---- Our Story handlers ----
  const ourStory = useOurStory();

  async function handleOurStorySave(payload, file) {
    if (canUseApi()) {
      if (payload.id) {
        await ourStory.updateItem(payload.id, payload, file);
      } else {
        await ourStory.createItem(payload, file);
      }
    } else {
      // File objects can't be stored in localStorage — skip file for drafts
      if (payload.id && payload.id.startsWith("_local_")) {
        updateDraftItem("ourStory", payload.id, payload);
        const idx = ourStory.items.value.findIndex((x) => x.id === payload.id);
        if (idx !== -1) ourStory.items.value[idx] = { ...payload, _localId: payload.id };
      } else {
        const localId = generateLocalId();
        addDraftItem("ourStory", { ...payload, _localId: localId });
        ourStory.items.value.push({ ...payload, _localId: localId, id: localId });
      }
    }
    closeModal();
    await refresh();
  }

  async function handleOurStoryUpdate(payload, file) {
    if (canUseApi()) {
      if (payload.id) {
        // Existing item with ID — update directly (file goes to /our-stories/{id})
        await ourStory.updateItem(payload.id, payload, file);
      } else {
        // Default item without ID — create on BE first so it gets an ID for the file upload
        const created = await ourStory.createItem(
          { ...payload, eventId: eventId.value },
          file
        );
        // Replace the in-memory default item with the real saved one
        const idx = ourStory.items.value.findIndex(
          (x) => !x.id && x.type === payload.type
        );
        if (idx !== -1) {
          ourStory.items.value[idx] = created;
        } else {
          ourStory.items.value.push(created);
        }
      }
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("ourStory", payload.id, payload);
      const idx = ourStory.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) ourStory.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
  }

  async function handleOurStoryDelete(id) {
    if (canUseApi()) {
      await ourStory.deleteItem(id);
    } else {
      deleteDraftItem("ourStory", id);
      ourStory.items.value = ourStory.items.value.filter((x) => x.id !== id);
    }
    closeModal();
    await refresh();
  }

  // ---- Load data based on auth state ----
  async function loadEditData() {
    if (canUseApi()) {
      await Promise.all([
        eventDetails.loadEventDetails(),
        agenda.loadAgenda(),
        ourStory.loadStories(),
      ]);
      ensureDefaultsInMemory();
    } else {
      loadDraft();
      // Deduplicate draft items by type (prevent 3x duplication from stale localStorage)
      function dedup(items, keyFn) {
        const seen = new Set();
        return items.filter(item => {
          const key = keyFn(item);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      eventDetails.items.value = dedup(
        getDraftItems("eventDetails").map(item => ({ ...item, id: item._localId })),
        d => d.type || d._localId
      );
      agenda.items.value = dedup(
        getDraftItems("agenda").map(item => ({ ...item, id: item._localId })),
        a => `${a.type}_${a.time}` || a._localId
      );
      ourStory.items.value = dedup(
        getDraftItems("ourStory").map(item => ({ ...item, id: item._localId })),
        s => s.type || s._localId
      );
      ensureDefaults();
    }
  }

  // Resolve default items from the current preset (per-template defaults)
  function getPresetDefaults() {
    const presetId = route.params.design || onboardingStore.invitationName || route.query.design || '';
    const preset = DESIGN_PRESETS[presetId];
    return preset?.defaultItems || null;
  }

  // Fallback defaults when no preset is found
  const FALLBACK_DEFAULTS = {
    eventDetails: [
      { type: 'CHURCH', time: '16:00', eventDate: '' },
      { type: 'RECEPTION', time: '18:00', eventDate: '' },
    ],
    agenda: [
      { type: 'START_GROOM', time: '14:00' },
      { type: 'START_BRIDE', time: '14:30' },
      { type: 'CHURCH', time: '15:00' },
      { type: 'CEREMONY', time: '16:00' },
      { type: 'RECEPTION', time: '18:00' },
      { type: 'FIRST_DANCE', time: '20:00' },
    ],
    ourStory: [
      { type: 'HOW_WE_MET', description: 'Случајна средба во кафуле што го промени се.', storyDate: '', imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&h=400&fit=crop' },
      { type: 'FIRST_DATE', description: 'Пикник на заход на сонцето покрај езерото, разговор што траеше со часови.', storyDate: '', imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&h=400&fit=crop' },
      { type: 'PROPOSAL', description: 'Под ѕвездите, прашање беше поставено и ветување дадено.', storyDate: '', imageUrl: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&h=400&fit=crop' },
    ],
  };

  // Populate default items in-memory only (not persisted to DB or draft).
  // They appear in the preview and get saved to DB only when user clicks save.
  function ensureDefaultsInMemory() {
    const defaults = getPresetDefaults() || FALLBACK_DEFAULTS;

    if (eventDetails.items.value.length === 0 && defaults.eventDetails?.length) {
      eventDetails.items.value = defaults.eventDetails.map(item => ({ ...item }));
    }
    if (agenda.items.value.length === 0 && defaults.agenda?.length) {
      agenda.items.value = defaults.agenda.map(item => ({ ...item }));
    }
    if (ourStory.items.value.length === 0 && defaults.ourStory?.length) {
      ourStory.items.value = defaults.ourStory.map(item => ({ ...item }));
    }
  }

  function ensureDefaults() {
    const defaults = getPresetDefaults() || FALLBACK_DEFAULTS;

    if (eventDetails.items.value.length === 0 && defaults.eventDetails?.length) {
      const items = defaults.eventDetails.map(item => {
        const localId = generateLocalId();
        return { ...item, _localId: localId, id: localId };
      });
      eventDetails.items.value = items;
      items.forEach(full => addDraftItem('eventDetails', full));
    }
    if (agenda.items.value.length === 0 && defaults.agenda?.length) {
      const items = defaults.agenda.map(item => {
        const localId = generateLocalId();
        return { ...item, _localId: localId, id: localId };
      });
      agenda.items.value = items;
      items.forEach(full => addDraftItem('agenda', full));
    }
    if (ourStory.items.value.length === 0 && defaults.ourStory?.length) {
      const items = defaults.ourStory.map(item => {
        const localId = generateLocalId();
        return { ...item, description: item.description || '', storyDate: item.storyDate || '', _localId: localId, id: localId };
      });
      ourStory.items.value = items;
      items.forEach(full => addDraftItem('ourStory', full));
    }
  }

  // ---- Fetch invitation config from event DTO ----
  async function fetchInvitationConfig() {
    if (!eventId.value || !isAuthenticated()) return null;
    try {
      const res = await eventsService.getById(eventId.value);
      // Unwrap ApiResponse wrapper if present
      const ev = res?.data || res;
      return ev?.invitation || null;
    } catch (e) {
      console.warn("[editMode] failed to fetch invitation config:", e);
      return null;
    }
  }

  // ---- Full event save (create or update) ----
  const saving = ref(false);

  async function saveFullEvent(payload, files = {}) {
    saving.value = true;
    try {
      let response;
      if (eventId.value) {
        // Existing event → update
        response = await eventFullService.updateFull(eventId.value, payload, files);
      } else {
        // New event → create
        response = await eventFullService.createFull(payload, files);
      }
      const result = response.data?.data || response.data;
      const newEventId = result?.event?.id || result?.id;
      if (newEventId && !eventId.value) {
        setEventId(newEventId);
      }
      clearDirty();
      return result;
    } catch (e) {
      console.error("[saveFullEvent] failed:", e);
      throw e;
    } finally {
      saving.value = false;
    }
  }

  return {
    isEditMode,
    activeModal,
    activeRootSection,
    editingItem,
    openModal,
    closeModal,
    closeAllModals,
    selectSection,
    refreshCallback,
    eventDetails,
    agenda,
    ourStory,
    handleEventDetailSave,
    handleEventDetailUpdate,
    handleEventDetailDelete,
    handleAgendaSave,
    handleAgendaUpdate,
    handleAgendaDelete,
    handleOurStorySave,
    handleOurStoryUpdate,
    handleOurStoryDelete,
    loadEditData,
    fetchInvitationConfig,
    dirty,
    previewMode,
    markDirty,
    clearDirty,
    toggleSection,
    setupUnsavedGuard,
    saveFullEvent,
    saving,
  };
}

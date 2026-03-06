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

export function useInvitationEditMode() {
  const route = useRoute();

  // Edit mode is available whenever ?edit=true, regardless of auth
  const isEditMode = computed(() => route.query.edit === "true");

  // Sync eventId into onboarding store so CRUD composables can find it
  const eventId = route.query.eventId || onboardingStore.eventId;
  if (isEditMode.value && eventId && onboardingStore.eventId !== eventId) {
    setEventId(eventId);
  }

  // Modal state
  const activeModal = ref(null);
  const activeRootSection = ref(null);
  const editingItem = ref(null);
  const modalHistory = ref([]);

  // Dirty state & preview mode — enable save immediately for existing events
  const dirty = ref(!!eventId);
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
    if (isAuthenticated()) {
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
    if (isAuthenticated()) {
      if (payload.id) await eventDetails.updateItem(payload.id, payload);
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("eventDetails", payload.id, payload);
      const idx = eventDetails.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) eventDetails.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
    await refresh();
  }

  async function handleEventDetailDelete(id) {
    if (isAuthenticated()) {
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
    if (isAuthenticated()) {
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
    if (isAuthenticated()) {
      if (payload.id) await agenda.updateItem(payload.id, payload);
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("agenda", payload.id, payload);
      const idx = agenda.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) agenda.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
    await refresh();
  }

  async function handleAgendaDelete(id) {
    if (isAuthenticated()) {
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
    if (isAuthenticated()) {
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
    if (isAuthenticated()) {
      if (payload.id) await ourStory.updateItem(payload.id, payload, file);
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("ourStory", payload.id, payload);
      const idx = ourStory.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) ourStory.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
    await refresh();
  }

  async function handleOurStoryDelete(id) {
    if (isAuthenticated()) {
      await ourStory.deleteItem(id);
    } else {
      deleteDraftItem("ourStory", id);
      ourStory.items.value = ourStory.items.value.filter((x) => x.id !== id);
    }
    closeModal();
    await refresh();
  }

  // ---- Load data based on auth state ----
  function loadEditData() {
    if (isAuthenticated()) {
      eventDetails.loadEventDetails();
      agenda.loadAgenda();
      ourStory.loadStories();
    } else {
      loadDraft();
      eventDetails.items.value = getDraftItems("eventDetails").map((item) => ({
        ...item,
        id: item._localId,
      }));
      agenda.items.value = getDraftItems("agenda").map((item) => ({
        ...item,
        id: item._localId,
      }));
      ourStory.items.value = getDraftItems("ourStory").map((item) => ({
        ...item,
        id: item._localId,
      }));
      ensureDefaults();
    }
  }

  function ensureDefaults() {
    if (eventDetails.items.value.length === 0) {
      [
        { type: 'CHURCH', time: '16:00', eventDate: '' },
        { type: 'RECEPTION', time: '18:00', eventDate: '' },
      ].forEach(item => {
        const localId = generateLocalId();
        const full = { ...item, _localId: localId, id: localId };
        addDraftItem('eventDetails', full);
        eventDetails.items.value.push(full);
      });
    }
    if (agenda.items.value.length === 0) {
      [
        { type: 'CEREMONY', time: '16:00' },
        { type: 'RECEPTION', time: '17:00' },
        { type: 'FIRST_DANCE', time: '20:00' },
      ].forEach(item => {
        const localId = generateLocalId();
        const full = { ...item, _localId: localId, id: localId };
        addDraftItem('agenda', full);
        agenda.items.value.push(full);
      });
    }
    if (ourStory.items.value.length === 0) {
      [
        { type: 'HOW_WE_MET' },
        { type: 'FIRST_DATE' },
        { type: 'PROPOSAL' },
      ].forEach(item => {
        const localId = generateLocalId();
        const full = { ...item, description: '', storyDate: '', _localId: localId, id: localId };
        addDraftItem('ourStory', full);
        ourStory.items.value.push(full);
      });
    }
  }

  // ---- Fetch invitation config from event DTO ----
  async function fetchInvitationConfig() {
    if (!eventId || !isAuthenticated()) return null;
    try {
      const ev = await eventsService.getById(eventId);
      return ev.invitation || null;
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
      if (eventId) {
        // Existing event → update
        response = await eventFullService.updateFull(eventId, payload, files);
      } else {
        // New event → create
        response = await eventFullService.createFull(payload, files);
      }
      const result = response.data?.data || response.data;
      const newEventId = result?.event?.id || result?.id;
      if (newEventId && !eventId) {
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

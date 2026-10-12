import { ref, reactive, computed, nextTick, toRaw } from "vue";
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
  isDraftSectionSeeded,
  markDraftSectionSeeded,
} from "@/store/invitationDraft.store";
import { DESIGN_PRESETS } from "@/config/designPresets/index.js";
import { isUnsavedExample } from "@/utils/creationSteps";

export function useInvitationEditMode() {
  const route = useRoute();

  // Edit mode is available whenever ?edit=true, regardless of auth
  const isEditMode = computed(() => route.query.edit === "true");

  // A new event being made (INV-104 onboarding: ?new=1). The dashboard's
  // current event in the onboarding store is somebody else's invitation as far
  // as this editor is concerned — falling back to it would overwrite it.
  const isNewEvent = computed(() => route.query.new === "1");
  // The event this editor created, once the server confirmed it. Without it a
  // second save in the same visit would have no id and create again.
  const createdEventId = ref(null);

  // Sync eventId into onboarding store so CRUD composables can find it
  const eventId = computed(() =>
    route.query.eventId || createdEventId.value || (isNewEvent.value ? null : onboardingStore.eventId) || null
  );
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
  // A change made in this visit that no save has confirmed yet (INV-502).
  // `dirty` starts true for an existing event only to enable its Save button;
  // opening an event and leaving it untouched is not "unsaved changes".
  const changed = ref(false);
  const previewMode = ref('desktop');

  // Change listeners — the autosave hooks in here (IVY-INV-301).
  const changeListeners = new Set();
  function onChange(fn) {
    changeListeners.add(fn);
    return () => changeListeners.delete(fn);
  }

  // INV-801: undo/redo learns which changes are the person's from here.
  let editTracker = null;
  function setEditTracker(tracker) {
    editTracker = tracker;
  }
  /** Runs an edit that waits for a request; its changes are one history step. */
  function tracked(fn) {
    return editTracker ? editTracker.track(fn) : fn();
  }

  function markDirty() {
    dirty.value = true;
    changed.value = true;
    editTracker?.noteEdit();
    changeListeners.forEach((fn) => {
      try { fn(); } catch (e) { console.warn("[editMode] change listener failed", e); }
    });
  }
  function clearDirty() {
    dirty.value = false;
    changed.value = false;
  }

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

  // Unsaved changes guard (INV-502)
  let removeUnsavedGuard = null;

  /** Same route record: the editor stays mounted (preview, query, design switch). */
  function staysOnPage(to, from) {
    const a = to.matched?.[to.matched.length - 1];
    const b = from.matched?.[from.matched.length - 1];
    return !!a && a === b;
  }

  /**
   * Asks before the editor is left with changes that leaving would lose.
   *
   *  opts.isUnsaved()    — whether leaving now loses something (default: a
   *                        change made in this visit that no save cleared).
   *  opts.settle()       — writes what is pending first (the autosave flush);
   *                        a change it saves needs no question.
   *  opts.beforeUnload() — the same, synchronously, for a closing tab.
   *  opts.confirmLeave() — resolves true to leave (after "Save and exit" or
   *                        "Discard"), false to keep editing.
   *  opts.message        — the text for the plain `window.confirm` fallback,
   *                        used only when no `confirmLeave` is given.
   *
   * Registered once per editor; the returned function removes both the router
   * guard and the `beforeunload` listener (the editor calls it on unmount).
   */
  function setupUnsavedGuard(router, opts = {}) {
    if (removeUnsavedGuard) return removeUnsavedGuard;
    const isUnsaved = opts.isUnsaved || (() => changed.value);
    const confirmLeave = opts.confirmLeave || (() => window.confirm(opts.message || ''));
    let asking = false;

    const onBeforeUnload = (e) => {
      if (!changed.value) return;
      // Best effort: the browser shows its own text and offers no choices.
      try { opts.beforeUnload?.(); } catch (err) { console.warn('[editMode] flush on unload failed', err); }
      if (!isUnsaved()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    const removeGuard = router.beforeEach(async (to, from) => {
      if (!changed.value || staysOnPage(to, from)) return true;
      // Another navigation while the question is open: that one is answered first.
      if (asking) return false;
      asking = true;
      try {
        if (opts.settle) {
          try { await opts.settle(); } catch (err) { console.warn('[editMode] save before leaving failed', err); }
        }
        if (!isUnsaved()) return true;
        const leave = await confirmLeave(to);
        if (!leave) return false;
        clearDirty();
        return true;
      } finally {
        asking = false;
      }
    });

    removeUnsavedGuard = () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      removeGuard();
      removeUnsavedGuard = null;
    };
    return removeUnsavedGuard;
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

  // INV-401: once the person adds an entry of their own to a section of an
  // existing event, the design's on-screen examples in it go — the preview
  // then shows what the guests will see.
  function dropUnsavedExamples(listRef, section) {
    listRef.value = listRef.value.filter((i) => !isUnsavedExample(i, section));
  }

  // INV-402: an example shown in an empty section of an existing event has no
  // server row, so an edit addressed by id went nowhere. Changing it makes it
  // the person's own entry: it is created on the server and takes the
  // example's place in the list. Changes made while that create is on its
  // way (a second select, the next keystroke) wait for it and update the new
  // row — they never create a second one.
  const exampleEdits = new WeakMap();

  function placeInstead(listRef, original, row) {
    const list = listRef.value.filter((x) => toRaw(x) !== toRaw(row));
    const at = list.findIndex((x) => toRaw(x) === toRaw(original));
    if (at === -1) list.push(row);
    else list[at] = row;
    listRef.value = list;
  }

  /**
   * @param section  the useAgenda / useEventDetails / useOurStory composable
   * @param original the example as it is in `section.items`
   * @param payload  the changed fields (no id)
   * @param extra    further arguments of create/update (a story's file)
   */
  function editExample(section, original, payload, ...extra) {
    const key = toRaw(original);
    const { id, _localId, ...fields } = payload;
    const createInstead = async () => {
      const row = await section.createItem(fields, ...extra);
      placeInstead(section.items, original, row);
      return row;
    };
    const previous = exampleEdits.get(key);
    const next = previous
      ? previous.catch(() => null).then((row) => (row?.id ? section.updateItem(row.id, fields, ...extra) : createInstead()))
      : createInstead();
    exampleEdits.set(key, next);
    return next;
  }

  /** The example being edited, if the change is for one (no server id). */
  function exampleTarget(payload, original) {
    return !payload?.id && original ? original : null;
  }

  /** An example removed from an existing event's section exists only on screen. */
  function removeExample(listRef, original) {
    listRef.value = listRef.value.filter((x) => toRaw(x) !== toRaw(original));
  }

  // ---- Event Details handlers ----
  const eventDetails = useEventDetails();

  async function handleEventDetailSave(payload) {
    if (canUseApi()) {
      await tracked(async () => {
        if (payload.id) {
          await eventDetails.updateItem(payload.id, payload);
        } else {
          await eventDetails.createItem(payload);
          dropUnsavedExamples(eventDetails.items, "eventDetails");
        }
      });
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
      markDirty();
    }
    closeModal();
    await refresh();
  }

  async function handleEventDetailUpdate(payload, original = null) {
    if (canUseApi()) {
      await tracked(async () => {
        const example = exampleTarget(payload, original);
        if (example) await editExample(eventDetails, example, { ...payload, visibility: payload.visibility || "PUBLIC" });
        else if (payload.id) await eventDetails.updateItem(payload.id, payload);
      });
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("eventDetails", payload.id, payload);
      const idx = eventDetails.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) eventDetails.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
  }

  async function handleEventDetailDelete(id, original = null) {
    if (canUseApi()) {
      await tracked(async () => {
        if (id) await eventDetails.deleteItem(id);
        else if (original) removeExample(eventDetails.items, original);
      });
    } else {
      deleteDraftItem("eventDetails", id);
      eventDetails.items.value = eventDetails.items.value.filter((x) => x.id !== id);
      markDirty();
    }
    closeModal();
    await refresh();
  }

  // ---- Agenda handlers ----
  const agenda = useAgenda();

  async function handleAgendaSave(payload) {
    if (canUseApi()) {
      await tracked(async () => {
        if (payload.id) {
          await agenda.updateItem(payload.id, payload);
        } else {
          await agenda.createItem(payload);
          dropUnsavedExamples(agenda.items, "agenda");
        }
      });
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
      markDirty();
    }
    closeModal();
    await refresh();
  }

  async function handleAgendaUpdate(payload, original = null) {
    if (canUseApi()) {
      await tracked(async () => {
        const example = exampleTarget(payload, original);
        if (example) await editExample(agenda, example, payload);
        else if (payload.id) await agenda.updateItem(payload.id, payload);
      });
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("agenda", payload.id, payload);
      const idx = agenda.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) agenda.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
  }

  async function handleAgendaDelete(id, original = null) {
    if (canUseApi()) {
      await tracked(async () => {
        if (id) await agenda.deleteItem(id);
        else if (original) removeExample(agenda.items, original);
      });
    } else {
      deleteDraftItem("agenda", id);
      agenda.items.value = agenda.items.value.filter((x) => x.id !== id);
      markDirty();
    }
    closeModal();
    await refresh();
  }

  // ---- Our Story handlers ----
  const ourStory = useOurStory();

  async function handleOurStorySave(payload, file) {
    if (canUseApi()) {
      await tracked(async () => {
        if (payload.id) {
          await ourStory.updateItem(payload.id, payload, file);
        } else {
          await ourStory.createItem(payload, file);
          dropUnsavedExamples(ourStory.items, "ourStory");
        }
      });
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
      markDirty();
    }
    closeModal();
    await refresh();
  }

  async function handleOurStoryUpdate(payload, file, original = null) {
    if (canUseApi()) {
      await tracked(async () => {
        const example = exampleTarget(payload, original);
        if (example) {
          await editExample(ourStory, example, { ...payload, eventId: eventId.value }, file);
        } else if (payload.id) {
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
      });
    } else if (payload.id && payload.id.startsWith("_local_")) {
      updateDraftItem("ourStory", payload.id, payload);
      const idx = ourStory.items.value.findIndex((x) => x.id === payload.id);
      if (idx !== -1) ourStory.items.value[idx] = { ...payload, _localId: payload.id };
    }
    markDirty();
  }

  async function handleOurStoryDelete(id, original = null) {
    if (canUseApi()) {
      await tracked(async () => {
        if (id) await ourStory.deleteItem(id);
        else if (original) removeExample(ourStory.items, original);
      });
    } else {
      deleteDraftItem("ourStory", id);
      ourStory.items.value = ourStory.items.value.filter((x) => x.id !== id);
      markDirty();
    }
    closeModal();
    await refresh();
  }

  // ---- Whether each section was read (INV-402) ----
  // A save of an existing event is a full replacement: a list that was never
  // read from the server would be sent empty and erase what is stored. So
  // each section knows whether it was read: "idle" (not yet), "loading",
  // "loaded" or "failed". Only a loaded section may be sent; while any failed
  // the editor saves nothing to the server and offers to read it again.
  const SECTION_KEYS = ["eventDetails", "agenda", "ourStory"];
  const SECTION_LOAD = Object.freeze({ IDLE: "idle", LOADING: "loading", LOADED: "loaded", FAILED: "failed" });
  const sectionLoad = reactive({ eventDetails: SECTION_LOAD.IDLE, agenda: SECTION_LOAD.IDLE, ourStory: SECTION_LOAD.IDLE });
  const sectionLoaders = {
    eventDetails: () => eventDetails.loadEventDetails(),
    agenda: () => agenda.loadAgenda(),
    ourStory: () => ourStory.loadStories(),
  };
  const sectionSources = { eventDetails, agenda, ourStory };
  let sectionsLoading = null;

  const failedSections = computed(() => SECTION_KEYS.filter((k) => sectionLoad[k] === SECTION_LOAD.FAILED));

  /** True when this section's list is what the server has (or the draft's own). */
  function isSectionLoaded(key) {
    return sectionLoad[key] === SECTION_LOAD.LOADED;
  }

  async function loadSectionFromServer(key) {
    sectionLoad[key] = SECTION_LOAD.LOADING;
    await sectionLoaders[key]();
    // The composables keep a failure in `error` (reset to null on each try).
    sectionLoad[key] = sectionSources[key].error.value !== null ? SECTION_LOAD.FAILED : SECTION_LOAD.LOADED;
  }

  async function loadSectionsFromServer(keys) {
    const run = Promise.all(keys.map(loadSectionFromServer)).then(() => {
      // Examples only where the server answered with an empty list.
      ensureDefaultsInMemory(keys);
    });
    const tracked = run.finally(() => {
      if (sectionsLoading === tracked) sectionsLoading = null;
    });
    sectionsLoading = tracked;
    await run;
  }

  /** Resolves once no section is being read. */
  async function whenSectionsSettled() {
    while (sectionsLoading) await sectionsLoading;
  }

  /** "Try again": reads the sections that failed. True when all are loaded now. */
  async function retryFailedSections() {
    const keys = failedSections.value;
    if (keys.length) await loadSectionsFromServer(keys);
    return failedSections.value.length === 0;
  }

  // ---- Load data based on auth state ----
  async function loadEditData() {
    if (canUseApi()) {
      await loadSectionsFromServer(SECTION_KEYS);
    } else {
      SECTION_KEYS.forEach((k) => { sectionLoad[k] = SECTION_LOAD.LOADED; });
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
      // Only the editor writes a design's sample items into the draft. A
      // preview (e.g. a design looked at from the catalogue, INV-201) shows
      // them without writing, so looking leaves the draft as it was.
      if (isEditMode.value) ensureDefaults();
      else ensureDefaultsInMemory(SECTION_KEYS, { draft: true });
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
  //
  // INV-402: never in a section that could not be read (the examples would
  // stand in for content the server has), and never in a draft section the
  // person emptied themselves (the starter entries were written there once).
  function ensureDefaultsInMemory(keys = SECTION_KEYS, { draft = false } = {}) {
    const defaults = getPresetDefaults() || FALLBACK_DEFAULTS;
    keys.forEach((key) => {
      const list = sectionSources[key].items;
      if (sectionLoad[key] === SECTION_LOAD.FAILED || (draft && isDraftSectionSeeded(key))) return;
      if (list.value.length === 0 && defaults[key]?.length) {
        list.value = defaults[key].map((item) => ({ ...item }));
      }
    });
  }

  function ensureDefaults() {
    const defaults = getPresetDefaults() || FALLBACK_DEFAULTS;
    // A section that has entries, or was filled once and emptied by the
    // person, keeps what it has (INV-402).
    const fill = (key) => {
      const empty = sectionSources[key].items.value.length === 0;
      const seeded = isDraftSectionSeeded(key);
      if (!empty || seeded) {
        if (!empty) markDraftSectionSeeded(key);
        return false;
      }
      markDraftSectionSeeded(key);
      return true;
    };

    if (fill("eventDetails") && defaults.eventDetails?.length) {
      const items = defaults.eventDetails.map(item => {
        const localId = generateLocalId();
        return { ...item, _localId: localId, id: localId };
      });
      eventDetails.items.value = items;
      items.forEach(full => addDraftItem('eventDetails', full));
    }
    if (fill("agenda") && defaults.agenda?.length) {
      const items = defaults.agenda.map(item => {
        const localId = generateLocalId();
        return { ...item, _localId: localId, id: localId };
      });
      agenda.items.value = items;
      items.forEach(full => addDraftItem('agenda', full));
    }
    if (fill("ourStory") && defaults.ourStory?.length) {
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

  /**
   * PUT for an existing event (a full replacement — safe to repeat), POST for
   * a new one. `clientRequestId` makes the POST safe to repeat too: the server
   * answers a second request with that key with the event the first made.
   */
  async function saveFullEvent(payload, files = {}, { clientRequestId, onUploadProgress } = {}) {
    saving.value = true;
    // INV-403: how far the photos sent with the save have got.
    const progress = onUploadProgress ? [{ onUploadProgress }] : [];
    try {
      let response;
      if (eventId.value) {
        // Existing event → update
        response = await eventFullService.updateFull(eventId.value, payload, files, ...progress);
      } else {
        // New event → create
        const body = clientRequestId ? { ...payload, clientRequestId } : payload;
        response = await eventFullService.createFull(body, files, ...progress);
      }
      const result = response.data?.data || response.data;
      const newEventId = result?.event?.id || result?.id;
      if (newEventId && !eventId.value) {
        createdEventId.value = newEventId;
        setEventId(newEventId);
      }
      // Dirty is cleared by the caller: a change made while this request ran
      // is still unsaved (IVY-INV-301).
      return result;
    } catch (e) {
      console.error("[saveFullEvent] failed:", e);
      throw e;
    } finally {
      saving.value = false;
    }
  }

  /**
   * After a full save the server has new ids for the sections: details and
   * agenda are replaced (new rows, same order as sent), stories are upserted.
   * The in-memory items take those ids so the next edit of one item addresses
   * the row that exists, not a deleted one or a local placeholder.
   *
   * Only when the list still matches what was sent; if it changed meanwhile,
   * the follow-up save brings fresh ids.
   */
  // INV-801: the id an entry had before a save → the id it has now. A step
  // undone later may hold the earlier id; it is put back under the current one.
  const idAliases = new Map();
  function rememberId(from, to) {
    if (from && to && from !== to) idAliases.set(from, to);
  }

  /** The id the entry that once had `id` has now (the same id if it never changed). */
  function currentIdOf(id) {
    let at = id;
    for (let hops = 0; idAliases.has(at) && hops < 100; hops++) at = idAliases.get(at);
    return at;
  }

  function adoptSavedIds(result, sent) {
    if (!result) return;
    // INV-401: examples shown only on screen were not sent; the saved rows
    // line up with the other entries, and the examples stay as they are.
    const sentPositions = (items, section) =>
      items.reduce((acc, item, i) => (isUnsavedExample(item, section) ? acc : [...acc, i]), []);
    const adoptByIndex = (listRef, saved, sentItems, typeOf, section) => {
      if (!Array.isArray(saved) || !Array.isArray(sentItems)) return;
      const items = listRef.value;
      const at = sentPositions(items, section);
      if (at.length !== saved.length || at.length !== sentItems.length) return;
      for (let k = 0; k < at.length; k++) {
        if ((typeOf(items[at[k]]) || "") !== (saved[k]?.type || "")) return;
      }
      const next = [...items];
      at.forEach((i, k) => {
        const { _localId, ...rest } = items[i];
        rememberId(items[i].id, saved[k].id);
        next[i] = { ...rest, id: saved[k].id };
      });
      listRef.value = next;
    };
    const detailType = (x) => x.type;
    const agendaType = (x) => x.agendaType || x.type;
    adoptByIndex(eventDetails.items, result.eventDetails, sent?.eventDetails, detailType, "eventDetails");
    adoptByIndex(agenda.items, result.agendas, sent?.agendas, agendaType, "agenda");

    if (Array.isArray(result.ourStories) && Array.isArray(sent?.ourStories)) {
      const items = ourStory.items.value;
      const at = sentPositions(items, "ourStory");
      if (at.length === sent.ourStories.length && at.length === result.ourStories.length) {
        const byOrder = new Map(result.ourStories.map((s) => [s.displayOrder, s]));
        const next = [...items];
        const ok = at.every((i, k) => {
          const saved = byOrder.get(k + 1);
          if (!saved || (saved.type || "") !== (items[i].type || "")) return false;
          const { _localId, ...rest } = items[i];
          rememberId(items[i].id, saved.id);
          next[i] = { ...rest, id: saved.id };
          return true;
        });
        if (ok) ourStory.items.value = next;
      }
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
    changed,
    previewMode,
    markDirty,
    clearDirty,
    toggleSection,
    setupUnsavedGuard,
    saveFullEvent,
    saving,
    onChange,
    adoptSavedIds,
    // INV-801: undo/redo
    setEditTracker,
    currentIdOf,
    eventId,
    // INV-402: which sections were read; a failed one blocks saving
    sectionLoad,
    failedSections,
    isSectionLoaded,
    whenSectionsSettled,
    retryFailedSections,
  };
}

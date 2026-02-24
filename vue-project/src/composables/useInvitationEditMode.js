import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { isAuthenticated } from "@/services/auth.service";
import { onboardingStore, setEventId } from "@/store/onboarding.store";
import { useAgenda } from "@/composables/useAgenda";
import { useEventDetails } from "@/composables/useEventDetails";
import { useOurStory } from "@/composables/useOurStory";

export function useInvitationEditMode() {
  const route = useRoute();

  const isEditMode = computed(
    () => route.query.edit === "true" && isAuthenticated()
  );

  // Sync eventId into onboarding store so CRUD composables can find it
  const eventId = route.query.eventId || onboardingStore.eventId;
  if (isEditMode.value && eventId && onboardingStore.eventId !== eventId) {
    setEventId(eventId);
  }

  // Modal state
  const activeModal = ref(null);
  const editingItem = ref(null);

  function openModal(section, item = null) {
    activeModal.value = section;
    editingItem.value = item;
  }

  function closeModal() {
    activeModal.value = null;
    editingItem.value = null;
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
    if (payload.id) {
      await eventDetails.updateItem(payload.id, payload);
    } else {
      await eventDetails.createItem(payload);
    }
    closeModal();
    await refresh();
  }

  async function handleEventDetailDelete(id) {
    await eventDetails.deleteItem(id);
    closeModal();
    await refresh();
  }

  // ---- Agenda handlers ----
  const agenda = useAgenda();

  async function handleAgendaSave(payload) {
    if (payload.id) {
      await agenda.updateItem(payload.id, payload);
    } else {
      await agenda.createItem(payload);
    }
    closeModal();
    await refresh();
  }

  async function handleAgendaDelete(id) {
    await agenda.deleteItem(id);
    closeModal();
    await refresh();
  }

  // ---- Our Story handlers ----
  const ourStory = useOurStory();

  async function handleOurStorySave(payload, file) {
    if (payload.id) {
      await ourStory.updateItem(payload.id, payload, file);
    } else {
      await ourStory.createItem(payload, file);
    }
    closeModal();
    await refresh();
  }

  async function handleOurStoryDelete(id) {
    await ourStory.deleteItem(id);
    closeModal();
    await refresh();
  }

  return {
    isEditMode,
    activeModal,
    editingItem,
    openModal,
    closeModal,
    refreshCallback,
    eventDetails,
    agenda,
    ourStory,
    handleEventDetailSave,
    handleEventDetailDelete,
    handleAgendaSave,
    handleAgendaDelete,
    handleOurStorySave,
    handleOurStoryDelete,
  };
}

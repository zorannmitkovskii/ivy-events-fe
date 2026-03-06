import { hasDraft, getDraftItems, getDraftFullPayload, clearDraft } from "@/store/invitationDraft.store";
import { onboardingStore, setEventId } from "@/store/onboarding.store";
import { eventFullService } from "@/services/eventFull.service";
import { eventDetailsService } from "@/services/eventDetails.service";
import { agendaApi } from "@/services/agenda.service";
import { ourStoryApi } from "@/services/ourStory.service";

/**
 * Syncs localStorage draft to the backend after login/verification.
 * If a full payload exists (unauthenticated user clicked "Create"),
 * calls POST /events/full in one shot and returns the created event.
 * Otherwise falls back to individual item sync (legacy).
 */
export async function syncDraftToBackend() {
  if (!hasDraft()) return null;

  try {
    // Full payload path — unauthenticated user built the complete event
    const fullPayload = getDraftFullPayload();
    console.log("[draftSync] hasDraft:", true, "fullPayload:", !!fullPayload);
    if (fullPayload) {
      console.log("[draftSync] calling POST /events/full …");
      const response = await eventFullService.createFull(fullPayload);
      const created = response.data?.data || response.data;
      console.log("[draftSync] created event:", created);
      const eventId = created?.event?.id || created?.id;
      if (eventId) {
        setEventId(eventId);
      }
      clearDraft();
      return created;
    }

    // Legacy fallback — sync individual items if eventId exists
    const eventId = onboardingStore.eventId;
    if (!eventId) return null;

    const detailItems = getDraftItems("eventDetails");
    for (const item of detailItems) {
      const { _localId, id, ...payload } = item;
      await eventDetailsService.create({ ...payload, eventId });
    }

    const agendaItems = getDraftItems("agenda");
    for (const item of agendaItems) {
      const { _localId, id, ...payload } = item;
      await agendaApi.createItem(eventId, payload);
    }

    const storyItems = getDraftItems("ourStory");
    for (const item of storyItems) {
      const { _localId, id, ...payload } = item;
      await ourStoryApi.create({ ...payload, eventId });
    }

    clearDraft();
    return null;
  } catch (e) {
    console.error("[draftSync] failed to sync draft to backend:", e);
    return null;
  }
}

import { onboardingStore } from "@/store/onboarding.store";

export const DRAFT_LIMITS = {
  guests: 10,
  galleryImages: 5,
  budgetItems: 5,
  tasks: 5,
};

export function isDraftEvent() {
  return onboardingStore.eventStatus === "DRAFT";
}

/**
 * Returns an object { type, limit, currentCount } if the draft limit is hit,
 * or null if no limit applies (event is not DRAFT or limit not reached).
 */
export function checkDraftLimit(type, currentCount) {
  if (!isDraftEvent()) return null;
  const limit = DRAFT_LIMITS[type];
  if (limit == null) return null;
  if (currentCount >= limit) {
    return { type, limit, currentCount };
  }
  return null;
}

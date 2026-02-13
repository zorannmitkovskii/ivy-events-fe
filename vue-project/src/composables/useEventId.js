import { computed } from 'vue'
import { onboardingStore } from '@/store/onboarding.store'

export default function useEventId() {
  const eventId = computed(() => onboardingStore.eventId || null)
  return { eventId }
}

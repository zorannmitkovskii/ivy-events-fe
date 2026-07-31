import { computed } from "vue";
import { authStore } from "@/store/auth.store";

export function useAuthUser() {
  const user = computed(() => authStore.user);
  // Null, not "demo". That placeholder was sent to the API as a real event id
  // and is not even a UUID, so every call carrying it is now refused — and
  // before that it quietly queried an event nobody owns.
  const eventId = computed(() => authStore.user?.eventId || null);
  return { user, eventId };
}

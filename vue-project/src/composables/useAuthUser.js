import { computed } from "vue";
import { authStore } from "@/store/auth.store";

export function useAuthUser() {
  const user = computed(() => authStore.user);
  const eventId = computed(() => authStore.user?.eventId || "demo");
  return { user, eventId };
}

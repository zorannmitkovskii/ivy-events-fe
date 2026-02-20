import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { invitationPageService } from "@/services/invitationPage.service";
import { onboardingStore } from "@/store/onboarding.store";

export function useInvitationData() {
  const route = useRoute();
  const lang = computed(() => route.params.lang || "mk");
  const eventId = route.query.eventId || onboardingStore.eventId;

  const loading = ref(!!eventId);
  const error = ref(null);
  const data = ref(null);

  function localized(i18nObj, fallback) {
    if (!i18nObj) return fallback || "";
    return i18nObj[lang.value] || i18nObj.en || fallback || "";
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  async function fetchData() {
    if (!eventId) {
      loading.value = false;
      return null;
    }
    loading.value = true;
    try {
      const result = await invitationPageService.getByEventId(eventId);
      data.value = result;
      return result;
    } catch (e) {
      console.error("Failed to fetch invitation data:", e);
      error.value = e;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    eventId,
    lang,
    loading,
    error,
    data,
    localized,
    formatDate,
    formatTime,
    fetchData,
  };
}

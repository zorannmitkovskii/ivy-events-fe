<template>
  <div class="ov-header">
    <div style="width: 100%">
      <h1 class="ov-title">{{ event.name }}</h1>

      <div class="ov-subline">
        <span>📅 {{ event.date }}</span>
        <span>•</span>
        <span>{{ event.daysLeft }} {{ t("overview.daysToGo") }}</span>
        <span class="pill-status">{{ event.status }}</span>
      </div>
    </div>

    <div class="ov-actions">
      <ButtonMain
        v-if="event.status !== 'ACTIVE'"
        variant="success"
        @click="goToPackages"
      >
        {{ t('cpay.upgrade') }}
      </ButtonMain>
      <ButtonMain variant="main" :disabled="sending" @click="sendNotification">
        ➤ {{ sending ? t("overview.sending") : t("overview.sendUpdate") }}
      </ButtonMain>
      <ButtonMain variant="outline" @click="goToGuests">👥 {{ t("overview.manageGuests") }}</ButtonMain>
      <ButtonMain variant="outline" @click="goToInvitations">✉ {{ t("overview.editInvitation") }}</ButtonMain>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { guestsService } from "@/services/guests.service";
import { onboardingStore } from "@/store/onboarding.store";

defineProps({ event: Object });
const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const lang = computed(() => route.params.lang || "mk");
const eventId = computed(() => onboardingStore.eventId);
const sending = ref(false);

function goToPackages() {
  router.push({ name: "dashboard.packages", params: { lang: lang.value } });
}

function goToInvitations() {
  router.push({ name: "EventInvitationsPage", params: { lang: lang.value } });
}

function goToGuests() {
  router.push(`/${lang.value}/dashboard/events/guests`);
}

async function sendNotification() {
  if (sending.value || !eventId.value) return;
  sending.value = true;
  try {
    await guestsService.sendNotification(eventId.value);
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <main class="payment-result">
    <div class="result-card" :data-phase="phase" data-testid="payment-result">
      <div v-if="phase === 'published' || phase === 'paid'" class="result-icon success" aria-hidden="true">
        <i class="bi bi-check-circle-fill"></i>
      </div>
      <div v-else-if="phase === 'failed'" class="result-icon failed" aria-hidden="true">
        <i class="bi bi-x-circle-fill"></i>
      </div>
      <div v-else-if="isWaiting" class="result-icon pending" aria-hidden="true">
        <div class="result-spinner" :class="{ still: phase === 'slow' }"></div>
      </div>
      <div v-else class="result-icon expired" aria-hidden="true">
        <i class="bi bi-exclamation-circle-fill"></i>
      </div>

      <h1 ref="headingRef" class="result-title" tabindex="-1" data-testid="payment-result-title">{{ title }}</h1>

      <!-- Polite live region: the waiting texts are announced as they change. -->
      <div role="status" aria-live="polite" class="result-live">
        <p v-if="description" class="result-desc" data-testid="payment-result-desc">{{ description }}</p>
      </div>

      <PublishedInvitation
        v-if="phase === 'published'"
        :public-url="publicUrl"
        :event-id="eventId"
        :edit-to="editTo"
        :links-to="linksTo"
      >
        <!-- INV-702: copy link / QR code / native share of the same public link. -->
        <template #share="{ publicUrl: shareUrl }">
          <InvitationShare :url="shareUrl" :event-id="eventId" field-id="published-link" />
        </template>
        <!-- INV-703: where the RSVP replies appear — the guest list of this event. -->
        <template #next="{ eventId: nextEventId }">
          <RsvpNextStep :event-id="nextEventId" />
        </template>
      </PublishedInvitation>

      <p v-if="phase === 'error' && errorText" class="result-error" role="alert">{{ errorText }}</p>

      <p v-if="orderRef" class="order-id">{{ t("cpay.orderId") }}: {{ orderRef }}</p>

      <div class="result-actions">
        <button
          v-if="phase === 'slow' || phase === 'error'"
          type="button"
          class="result-btn primary"
          :disabled="checking"
          data-testid="check-again"
          @click="checkAgain"
        >
          {{ checking ? t("cpay.publish.checking") : (phase === 'error' ? t("cpay.publish.retry") : t("cpay.publish.checkAgain")) }}
        </button>

        <template v-if="phase === 'failed'">
          <button
            v-if="eventId"
            type="button"
            class="result-btn primary"
            data-testid="retry-payment"
            @click="retryPayment"
          >
            {{ t("cpay.publish.retryPayment") }}
          </button>
          <router-link v-if="editTo" class="result-btn secondary" :to="editTo" data-testid="failed-continue-editing">
            {{ t("cpay.publish.continueEditing") }}
          </router-link>
        </template>

        <router-link
          v-if="phase === 'signedOut'"
          class="result-btn primary"
          :to="loginTo"
          data-testid="payment-sign-in"
        >
          {{ t("cpay.publish.signIn") }}
        </router-link>

        <button
          v-if="showDashboard"
          type="button"
          class="result-btn secondary"
          data-testid="go-to-dashboard"
          @click="goToDashboard"
        >
          {{ t("cpay.goToDashboard") }}
        </button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { isAuthenticated } from "@/services/auth.service";
import { getErrorMessage } from "@/services/apiError";
import { onboardingStore, setEventId, setEventStatus } from "@/store/onboarding.store";
import { usePublishConfirmation } from "@/composables/usePublishConfirmation";
import { safePublicUrl, editorLocation } from "@/utils/publishOutcome";
import PublishedInvitation from "@/components/payment/PublishedInvitation.vue";
import InvitationShare from "@/components/payment/InvitationShare.vue";
import RsvpNextStep from "@/components/payment/RsvpNextStep.vue";

/**
 * INV-701 — where the organizer lands after CPay.
 *
 * The bank returns the browser through the payment callback, which redirects
 * here (directly, or via the dashboard overview with `?ref=`, see the router).
 * Nothing in the address is trusted (the callback sends only `?ref=` since CPay
 * round 2; an older `status=` is ignored — it only ever said the bank's
 * checksum was valid). "Published" is shown only after the server confirms the
 * payment SUCCEEDED and the event is ACTIVE; until then the page says it is
 * confirming and keeps asking, and if that takes too long it says so — it
 * never guesses success or failure.
 */

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const lang = computed(() => route.params.lang || "mk");

function firstString(value) {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" ? v.trim() : "";
}

function storedRef() {
  try {
    return sessionStorage.getItem("cpay:lastOrderRef") || "";
  } catch {
    return "";
  }
}

const orderRef = computed(() =>
  firstString(route.query.ref) || firstString(route.query.orderId) || storedRef()
);

const signedIn = isAuthenticated();
const { phase: serverPhase, data, error, check } = usePublishConfirmation(() => orderRef.value);
const phase = computed(() => (signedIn ? serverPhase.value : "signedOut"));

const checking = ref(false);
const headingRef = ref(null);

const isWaiting = computed(() => ["loading", "confirming", "slow"].includes(phase.value));

const eventId = computed(() => (data.value?.eventId ? String(data.value.eventId) : ""));
const publicUrl = computed(() => safePublicUrl(data.value?.publicUrl, eventId.value));
const editTo = computed(() => editorLocation(lang.value, data.value?.design, eventId.value));
const linksTo = computed(() => (eventId.value ? { name: "dashboard.invitation-links", params: { lang: lang.value } } : ""));
const loginTo = computed(() => ({
  path: `/${lang.value}/auth/login`,
  query: {
    redirect: router.resolve({
      name: "PaymentResult",
      params: { lang: lang.value },
      query: orderRef.value ? { ref: orderRef.value } : {},
    }).fullPath,
  },
}));

const TITLES = {
  loading: "cpay.publish.loadingTitle",
  confirming: "cpay.publish.confirmingTitle",
  slow: "cpay.publish.slowTitle",
  published: "cpay.publish.publishedTitle",
  paid: "cpay.publish.paidTitle",
  failed: "cpay.publish.failedTitle",
  error: "cpay.publish.errorTitle",
  forbidden: "cpay.publish.forbiddenTitle",
  notFound: "cpay.publish.notFoundTitle",
  signedOut: "cpay.publish.signedOutTitle",
};
const DESCRIPTIONS = {
  confirming: "cpay.publish.confirmingDesc",
  slow: "cpay.publish.slowDesc",
  published: "cpay.publish.publishedDesc",
  paid: "cpay.publish.paidDesc",
  failed: "cpay.publish.failedDesc",
  error: "cpay.publish.errorDesc",
  forbidden: "cpay.publish.forbiddenDesc",
  notFound: "cpay.publish.notFoundDesc",
  signedOut: "cpay.publish.signedOutDesc",
};

const title = computed(() => t(TITLES[phase.value] || TITLES.loading));
const description = computed(() => {
  const text = DESCRIPTIONS[phase.value] ? t(DESCRIPTIONS[phase.value]) : "";
  // A failure says why first (failed / canceled / expired), then that nothing is lost.
  return phase.value === "failed" && failedReason.value ? `${failedReason.value} ${text}` : text;
});
const failedReason = computed(() => {
  const status = String(data.value?.paymentStatus || "").toUpperCase();
  return ["FAILED", "CANCELED", "EXPIRED"].includes(status) ? t(`cpay.publish.failedReason.${status}`) : "";
});
const errorText = computed(() => (error.value ? getErrorMessage(error.value) : ""));
const showDashboard = computed(() => !["loading", "confirming", "signedOut"].includes(phase.value));

async function checkAgain() {
  checking.value = true;
  try {
    await check();
  } finally {
    checking.value = false;
  }
}

/** The dashboard works on the selected event; make it this one before going there. */
function selectThisEvent() {
  if (eventId.value && onboardingStore.eventId !== eventId.value) setEventId(eventId.value);
}

function retryPayment() {
  selectThisEvent();
  router.push({ name: "dashboard.packages", params: { lang: lang.value } });
}

function goToDashboard() {
  selectThisEvent();
  router.push(`/${lang.value}/dashboard/events/overview`);
}

// Settled answers move focus to the heading so the result is read out once;
// the waiting texts are announced through the live region instead.
watch(phase, async (now, before) => {
  if (now === "published" && eventId.value) {
    selectThisEvent();
    setEventStatus("ACTIVE");
  }
  if (now === before || now === "loading" || now === "confirming") return;
  await nextTick();
  headingRef.value?.focus?.();
});

onMounted(() => {
  if (signedIn) check();
});
</script>

<style scoped>
.payment-result {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f6f1 0%, #ede9df 100%);
  display: grid;
  place-items: center;
  padding: 24px 16px;
  box-sizing: border-box;
}

.result-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px 24px;
  width: 100%;
  max-width: 480px;
  min-width: 0;
  box-sizing: border-box;
  text-align: center;
}

.result-icon {
  margin: 0 auto 20px;
  font-size: 56px;
}

.result-icon.success { color: #2e7d32; }
.result-icon.failed { color: #c62828; }
.result-icon.expired { color: #e65100; }
.result-icon.pending { color: var(--brand-gold, #b08d57); }

.result-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--neutral-300, #ddd);
  border-top-color: var(--brand-gold, #b08d57);
  border-radius: 50%;
  animation: rspin 0.8s linear infinite;
  margin: 0 auto;
}
.result-spinner.still { animation-duration: 2s; }

@media (prefers-reduced-motion: reduce) {
  .result-spinner { animation: none; }
}

@keyframes rspin {
  to { transform: rotate(360deg); }
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--neutral-900, #1a1a1a);
  margin: 0 0 8px;
  overflow-wrap: anywhere;
}
.result-title:focus { outline: none; }
.result-title:focus-visible { outline: 3px solid var(--brand-gold, #b08d57); outline-offset: 4px; }

.result-desc {
  font-size: 14px;
  color: #5f5f5f;
  margin: 0 0 16px;
}

.order-id {
  font-size: 12px;
  color: #6b6b6b;
  margin: 0 0 20px;
  font-family: monospace;
}

.result-error {
  font-size: 13px;
  color: #b71c1c;
  background: #fce4ec;
  padding: 10px 12px;
  border-radius: 8px;
  margin: 0 0 16px;
}

.result-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-btn {
  display: block;
  padding: 14px;
  min-height: 44px;
  box-sizing: border-box;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
  transition: opacity 0.2s;
}

.result-btn.primary {
  background: var(--brand-gold, #8a6d3b);
  color: #fff;
  border: 0;
}
.result-btn.secondary {
  background: #fff;
  color: var(--neutral-900, #1a1a1a);
  border: 1px solid var(--neutral-300, #ccc);
}
.result-btn:disabled { opacity: 0.6; cursor: progress; }
.result-btn:hover { opacity: 0.9; }
.result-btn:focus-visible { outline: 3px solid var(--neutral-900, #1a1a1a); outline-offset: 2px; }
</style>

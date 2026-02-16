<template>
  <div class="payment-result">
    <div class="result-card">
      <div v-if="status === 'SUCCESS'" class="result-icon success">
        <i class="bi bi-check-circle-fill"></i>
      </div>
      <div v-else-if="status === 'FAILED' || status === 'CANCELED'" class="result-icon failed">
        <i class="bi bi-x-circle-fill"></i>
      </div>
      <div v-else-if="status === 'EXPIRED'" class="result-icon expired">
        <i class="bi bi-clock-fill"></i>
      </div>
      <div v-else class="result-icon pending">
        <div class="result-spinner"></div>
      </div>

      <h1 class="result-title">{{ statusTitle }}</h1>
      <p class="result-desc">{{ statusDesc }}</p>

      <p v-if="orderId" class="order-id">{{ t("cpay.orderId") }}: {{ orderId }}</p>

      <p v-if="error" class="result-error">{{ error }}</p>

      <div class="result-actions">
        <button class="result-btn primary" @click="goToDashboard">
          {{ t("cpay.goToDashboard") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { cpayService } from "@/services/cpay.service";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const lang = computed(() => route.params.lang || "mk");

const orderId = computed(() =>
  route.query.orderId || sessionStorage.getItem("cpay:lastOrderRef") || ""
);

const status = ref("PENDING");
const error = ref(null);

let timer = null;

const statusTitle = computed(() => {
  const map = {
    SUCCESS: t("cpay.successTitle"),
    FAILED: t("cpay.failedTitle"),
    CANCELED: t("cpay.canceledTitle"),
    EXPIRED: t("cpay.expiredTitle"),
    PENDING: t("cpay.pendingTitle"),
  };
  return map[status.value] || t("cpay.unknownTitle");
});

const statusDesc = computed(() => {
  const map = {
    SUCCESS: t("cpay.successDesc"),
    FAILED: t("cpay.failedDesc"),
    CANCELED: t("cpay.canceledDesc"),
    EXPIRED: t("cpay.expiredDesc"),
    PENDING: t("cpay.pendingDesc"),
  };
  return map[status.value] || "";
});

async function loadStatus() {
  if (!orderId.value) {
    status.value = "UNKNOWN";
    return;
  }
  try {
    const res = await cpayService.getPaymentStatus(orderId.value);
    const data = res?.data ?? res;
    status.value = data.status || "UNKNOWN";
  } catch (e) {
    error.value = e?.message || "Could not fetch payment status.";
  }
}

function goToDashboard() {
  router.push(`/${lang.value}/dashboard/events/overview`);
}

onMounted(async () => {
  await loadStatus();

  // Auto-redirect to dashboard on success
  if (status.value === "SUCCESS") {
    goToDashboard();
    return;
  }

  if (status.value === "PENDING") {
    const started = Date.now();
    timer = setInterval(async () => {
      await loadStatus();
      if (status.value === "SUCCESS") {
        clearInterval(timer);
        goToDashboard();
        return;
      }
      if (status.value !== "PENDING" || Date.now() - started > 30000) {
        clearInterval(timer);
      }
    }, 2000);
  }
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.payment-result {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f6f1 0%, #ede9df 100%);
  display: grid;
  place-items: center;
  padding: 24px;
}

.result-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 40px 32px;
  width: 100%;
  max-width: 440px;
  text-align: center;
}

.result-icon {
  margin: 0 auto 20px;
  font-size: 56px;
}

.result-icon.success { color: #2e7d32; }
.result-icon.failed { color: #c62828; }
.result-icon.expired { color: #e65100; }
.result-icon.pending { color: var(--brand-gold, #C8A24D); }

.result-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--neutral-300, #ddd);
  border-top-color: var(--brand-gold, #C8A24D);
  border-radius: 50%;
  animation: rspin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes rspin {
  to { transform: rotate(360deg); }
}

.result-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--neutral-900, #1a1a1a);
  margin: 0 0 8px;
}

.result-desc {
  font-size: 14px;
  color: var(--neutral-500, #888);
  margin: 0 0 16px;
}

.order-id {
  font-size: 12px;
  color: var(--neutral-400, #aaa);
  margin: 0 0 20px;
  font-family: monospace;
}

.result-error {
  font-size: 13px;
  color: #c62828;
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
  padding: 14px;
  border: 0;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.result-btn.primary {
  background: var(--brand-gold, #C8A24D);
  color: #fff;
}

.result-btn.primary:hover {
  opacity: 0.9;
}
</style>

<template>
  <button
    type="button"
    class="cpay-btn"
    :class="[variant, { loading }]"
    :disabled="loading"
    @click="payWithCpay"
  >
    <span v-if="loading" class="cpay-spinner"></span>
    <svg v-else class="cpay-icon" width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
    <span>{{ loading ? t("cpay.redirecting") : label || t("cpay.pay") }}</span>
  </button>

  <p v-if="error" class="cpay-error">{{ error }}</p>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useAuthUser } from "@/composables/useAuthUser";
import { getUserId } from "@/services/auth.service";
import { cpayService } from "@/services/cpay.service";
import { redirectToCpay } from "@/utils/redirectToCpay";

const props = defineProps({
  packageType: { type: String, default: "INV_BASIC" }, // INV_BASIC | INV_PRO | IVY_PREMIUM | GALLERY | ORGANIZER
  eventId: { type: String, default: "" },
  label: { type: String, default: "" },
  variant: { type: String, default: "default" }, // "default" | "gold" | "success" | "sidebar"
  price: { type: Number, default: 0 },
});

const { t } = useI18n();
const { user, eventId: authEventId } = useAuthUser();
const loading = ref(false);
const error = ref(null);

async function payWithCpay() {
  if (loading.value) return;

  loading.value = true;
  error.value = null;

  try {
    const payload = {
      amount: props.price,
      currency: "MKD",
      description: "Payment",
      email: user.value?.email || "",
      telephone: user.value?.phone || "",
      eventId: props.eventId || authEventId.value,
      userId: getUserId(),
    };
    if (props.packageType) payload.packageType = props.packageType;
    const res = await cpayService.initPayment(payload);
    const data = res?.data ?? res;
    const paymentUrl = data.paymentUrl;
    const fields = data.fields;

    const orderRef = fields?.Details2 || fields?.details2 || "";
    if (orderRef) sessionStorage.setItem("cpay:lastOrderRef", orderRef);

    redirectToCpay(paymentUrl, fields);
  } catch (e) {
    error.value = e?.message || t("cpay.initFailed");
    loading.value = false;
  }
}
</script>

<style scoped>
.cpay-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid var(--neutral-300, #ddd);
  border-radius: var(--radius-md, 8px);
  background: #fff;
  color: var(--brand-main, #334338);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.cpay-btn:hover:not(:disabled) {
  border-color: var(--brand-gold, #C8A24D);
  background: rgba(200, 162, 77, 0.06);
}

.cpay-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Gold variant */
.cpay-btn.gold {
  background: var(--brand-gold, #C8A24D);
  color: #fff;
  border-color: var(--brand-gold, #C8A24D);
}

.cpay-btn.gold:hover:not(:disabled) {
  background: #b8923d;
  border-color: #b8923d;
}

/* Sidebar variant */
.cpay-btn.sidebar {
  width: 100%;
  justify-content: center;
  padding: 10px 12px;
  background: var(--brand-gold, #C8A24D);
  color: #1b1b1b;
  border: none;
  border-radius: var(--radius-md, 8px);
  font-weight: 700;
  font-size: 13px;
}

.cpay-btn.sidebar:hover:not(:disabled) {
  background: #d4af5c;
}

/* Success / light-green variant */
.cpay-btn.success {
  background: var(--success, #BFD2A4);
  color: var(--brand-main, #2F3E36);
  border-color: var(--success, #BFD2A4);
}

.cpay-btn.success:hover:not(:disabled) {
  background: #adc48e;
  border-color: #adc48e;
}

.cpay-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: cpay-spin 0.6s linear infinite;
}

@keyframes cpay-spin {
  to { transform: rotate(360deg); }
}

.cpay-error {
  margin-top: 6px;
  font-size: 13px;
  color: var(--error, #c62828);
  font-weight: 600;
}
</style>

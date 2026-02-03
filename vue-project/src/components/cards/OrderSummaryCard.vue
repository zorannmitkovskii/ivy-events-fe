<template>
  <CheckoutCard :title="$t('checkout.summary.title')">
    <div class="summary-top">
      <div class="plan">
        <div class="plan-name">
          {{ $t(plan.nameKey) }}
          <span v-if="isSelected" class="badge">{{ $t("checkout.summary.selected") }}</span>
        </div>
        <div class="plan-tagline">{{ $t(plan.taglineKey) }}</div>
      </div>
    </div>

<!--    <div class="cycle">-->
<!--      <div class="cycle-row">-->
<!--        <span class="cycle-label">{{ $t("checkout.summary.duration") }}</span>-->
<!--        <BillingCycleSwitch-->
<!--          :modelValue="billingCycle"-->
<!--          @update:modelValue="$emit('update:billingCycle', $event)"-->
<!--        />-->
<!--      </div>-->
<!--    </div>-->

    <!-- Coupon -->
    <div class="coupon">
      <label class="coupon-label">{{ $t("checkout.summary.couponLabel") }}</label>

      <input
        class="coupon-input"
        :placeholder="$t('checkout.summary.couponPh')"
        :value="couponValue"
        @input="$emit('update:couponValue', $event.target.value)"
        @blur="onCouponBlur"
        :disabled="isCouponLoading"
        autocomplete="off"
      />

      <div v-if="isCouponLoading" class="coupon-hint">
        {{ $t("checkout.summary.couponValidating") }}
      </div>

      <div v-else-if="couponStatus?.type" class="coupon-hint" :class="couponStatus.type">
        {{ couponStatus.message }}
      </div>
    </div>

    <div class="totals">
      <SummaryRow :label="$t('checkout.summary.subtotal')" :value="money(subtotal)" />

      <SummaryRow
        :label="$t('checkout.summary.discount')"
        :value="discountAmount > 0 ? '-' + money(discountAmount) : money(0)"
        valueClass="savings"
      />

      <div class="divider"></div>

      <SummaryRow
        :label="$t('checkout.summary.total')"
        :value="money(total)"
        valueClass="total"
      />
    </div>

    <ButtonMain
      variant="main"
      :label="$t('checkout.summary.pay')"
      @click="$emit('pay')"
    />

    <p class="tiny">{{ $t("checkout.summary.ssl") }}</p>
    <p class="legal">
      {{ $t("checkout.summary.legalPrefix") }}
      <a class="link" href="#" @click.prevent>{{ $t("checkout.summary.terms") }}</a>
      {{ $t("checkout.summary.and") }}
      <a class="link" href="#" @click.prevent>{{ $t("checkout.summary.privacy") }}</a>.
    </p>
  </CheckoutCard>
</template>

<script setup>
import CheckoutCard from "@/components/cards/CheckoutCard.vue";
import SummaryRow from "@/components/generic/SummaryRow.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const props = defineProps({
  plan: { type: Object, required: true },
  billingCycle: { type: String, required: true },

  // amounts
  subtotal: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // coupon
  email: { type: String, default: "" }, // logged-in email
  couponValue: { type: String, default: "" },
  isCouponLoading: { type: Boolean, default: false },
  couponStatus: {
    type: Object,
    default: () => ({ type: "", message: "" }) // type: 'ok' | 'err' | ''
  },

  isSelected: { type: Boolean, default: false }
});

const emit = defineEmits([
  "update:billingCycle",
  "update:couponValue",
  "validate-coupon",
  "pay"
]);

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function onCouponBlur() {
  const code = (props.couponValue || "").trim();
  if (!code) return;

  emit("validate-coupon", {
    email: props.email,
    coupon: code
  });
}
</script>

<style scoped>
/* existing styles... keep yours */
.coupon {
  margin-top: 14px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(247, 245, 240, 0.7);
  border: 1px solid rgba(0,0,0,0.06);
  display: grid;
  gap: 8px;
}

.coupon-label {
  font-size: 12px;
  font-weight: 700;
  color: rgba(51, 67, 56, 0.75);
}

.coupon-input {
  width: 100%;
  border: 1px solid rgba(0,0,0,0.10);
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  outline: none;
  background: var(--bg-white);
  color: var(--neutral-900);
  transition: box-shadow 0.18s ease, border-color 0.18s ease;
}

.coupon-input:focus {
  border-color: rgba(200, 162, 77, 0.70);
  box-shadow: 0 0 0 4px rgba(200, 162, 77, 0.12);
}

.coupon-hint {
  font-size: 11px;
  line-height: 1.35;
  color: rgba(51, 67, 56, 0.70);
}

.coupon-hint.ok {
  color: var(--brand-main);
}

.coupon-hint.err {
  color: var(--error);
}
</style>

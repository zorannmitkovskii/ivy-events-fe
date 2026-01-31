<template>
  <main class="checkout-page">
    <div class="checkout-container">
      <CardHeader />

      <div class="checkout-grid">
        <PaymentInformationCard
          v-model:email="email"
          v-model:country="country" />

        <OrderSummaryCard
          :plan="selectedPlan"
          :billingCycle="billingCycle"
          :subtotal="subtotal"
          :discountAmount="discountAmount"
          :total="total"
          :email="userEmail"
          :couponValue="coupon"
          :isCouponLoading="couponLoading"
          :couponStatus="couponStatus"
          :isSelected="true"
          @update:billingCycle="billingCycle = $event"
          @update:couponValue="coupon = $event"
          @validate-coupon="validateCoupon"
          @pay="onPay"
        />
      </div>
    </div>
  </main>
</template>
<script setup>
import { computed, ref } from "vue";
import PaymentInformationCard from "@/components/cards/PaymentInformationCard.vue";
import OrderSummaryCard from "@/components/cards/OrderSummaryCard.vue";
import CardHeader from "@/components/generic/CardHeader.vue";

// EXAMPLE: replace with your auth store
const userEmail = computed(() => "zoran@example.com");

const email = ref(userEmail.value);   // email is taken from login user
const country = ref("");

const selectedPlan = ref({
  nameKey: "checkout.plan.pro.name",
  taglineKey: "checkout.plan.pro.tagline"
});

const billingCycle = ref("annual");

const subtotal = computed(() => 348.0);

const coupon = ref("");
const discountAmount = ref(0);
const total = computed(() => subtotal.value - discountAmount.value);

const couponLoading = ref(false);
const couponStatus = ref({ type: "", message: "" });

async function validateCoupon({ email, coupon }) {
  try {
    couponLoading.value = true;
    couponStatus.value = { type: "", message: "" };

    // IMPORTANT: Replace URL with your backend
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,                 // from logged-in user
        coupon,                // from field
        plan: "PRO",
        billingCycle: billingCycle.value,
        subtotal: subtotal.value
      })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Coupon validation failed");
    }

    const data = await res.json();
    // expected example:
    // { valid: true, discountAmount: 58, message: "Applied", finalTotal: 290 }

    if (data.valid) {
      discountAmount.value = Number(data.discountAmount || 0);
      couponStatus.value = { type: "ok", message: data.message || "Coupon applied." };
    } else {
      discountAmount.value = 0;
      couponStatus.value = { type: "err", message: data.message || "Invalid coupon." };
    }
  } catch (e) {
    discountAmount.value = 0;
    couponStatus.value = { type: "err", message: "Invalid or expired coupon." };
  } finally {
    couponLoading.value = false;
  }
}

function onPay() {
  console.log("Pay", {
    email: userEmail.value,
    coupon: coupon.value,
    subtotal: subtotal.value,
    discount: discountAmount.value,
    total: total.value
  });
}
</script>
<style scoped>
.checkout-page {
  min-height: 100vh;
  background: var(--bg-main);
  padding: 44px 16px 80px;
}

.checkout-container {
  max-width: 1100px;
  margin: 0 auto;
}

.checkout-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 22px;
  align-items: start;
  margin-top: 22px;
}

@media (max-width: 980px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
}
</style>

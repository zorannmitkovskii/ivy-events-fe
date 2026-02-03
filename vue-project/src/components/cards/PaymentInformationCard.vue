<template>
  <CheckoutCard :title="$t('checkout.payment.title')">
    <template #header-right>
      <div class="brands" aria-hidden="true">
        <span class="brand-pill">VISA</span>
        <span class="brand-pill">MC</span>
      </div>
    </template>

    <div class="form">
      <AuthInput
        v-model="emailProxy"
        :label="$t('checkout.payment.email')"
        :placeholder="$t('checkout.payment.emailPh')"
        type="email"
        required
      >
        <template #icon>✉️</template>
      </AuthInput>

      <!-- Stripe note: replace these 3 with Stripe Elements -->
      <AuthInput
        v-model="cardNumber"
        :label="$t('checkout.payment.cardNumber')"
        placeholder="0000 0000 0000 0000"
        type="text"
      >
        <template #icon>💳</template>
      </AuthInput>

      <div class="row-2">
        <AuthInput
          v-model="expiry"
          :label="$t('checkout.payment.expiry')"
          placeholder="MM / YY"
          type="text"
        >
          <template #icon>📅</template>
        </AuthInput>

        <AuthInput
          v-model="cvc"
          :label="$t('checkout.payment.cvc')"
          placeholder="123"
          type="text"
        >
          <template #icon>🔒</template>
        </AuthInput>
      </div>

      <AuthInput
        v-model="countryProxy"
        :label="$t('checkout.payment.country')"
        :placeholder="$t('checkout.payment.countryPh')"
        type="text"
      >
        <template #icon>🌍</template>
      </AuthInput>

      <div class="info">
        <span class="info-dot" aria-hidden="true">🛡️</span>
        <p class="info-text">{{ $t("checkout.payment.note") }}</p>
      </div>
    </div>
  </CheckoutCard>
</template>

<script setup>

import AuthInput from "@/components/auth/AuthInput.vue";
import CheckoutCard from "@/components/cards/CheckoutCard.vue";
import {computed, ref} from "vue";

const props = defineProps({
  email: { type: String, default: "" },
  country: { type: String, default: "" },
  paymentMethod: { type: String, default: "card" }
});

const emit = defineEmits(["update:email", "update:country"]);

const emailProxy = computed({
  get: () => props.email,
  set: (v) => emit("update:email", v)
});

const countryProxy = computed({
  get: () => props.country,
  set: (v) => emit("update:country", v)
});

// placeholders (swap later with Stripe Elements)
const cardNumber = ref("");
const expiry = ref("");
const cvc = ref("");
</script>

<style scoped>
.brands {
  display: flex;
  gap: 6px;
  opacity: 0.75;
}

.brand-pill {
  font-size: 10px;
  font-weight: 700;
  border: 1px solid rgba(0,0,0,0.08);
  padding: 3px 6px;
  border-radius: 7px;
  color: rgba(51, 67, 56, 0.75);
  background: rgba(247, 245, 240, 0.6);
}

.form {
  display: grid;
  gap: 12px;
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info {
  margin-top: 2px;
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(191, 210, 164, 0.18);
  border: 1px solid rgba(191, 210, 164, 0.35);
}

.info-dot {
  margin-top: 1px;
  color: var(--brand-main);
}

.info-text {
  margin: 0;
  font-size: 11px;
  line-height: 1.35;
  color: rgba(51, 67, 56, 0.72);
}

@media (max-width: 520px) {
  .row-2 {
    grid-template-columns: 1fr;
  }
}
</style>

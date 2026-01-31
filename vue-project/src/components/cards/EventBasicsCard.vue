<template>
  <OnboardingCard>
    <OnboardingCardHeader
      icon="💚"
      :title="$t('onboarding.eventBasics.title')"
      :subtitle="$t('onboarding.eventBasics.subtitle')"
    />

    <form class="form" @submit.prevent="onContinue">
      <div class="grid">
        <AuthInput
          v-model="brideName"
          :label="$t('onboarding.eventBasics.fields.brideName')"
          :placeholder="$t('onboarding.eventBasics.placeholders.brideName')"
          required
        >
          <template #icon>👰</template>
        </AuthInput>

        <AuthInput
          v-model="groomName"
          :label="$t('onboarding.eventBasics.fields.groomName')"
          :placeholder="$t('onboarding.eventBasics.placeholders.groomName')"
          required
        >
          <template #icon>🤵</template>
        </AuthInput>

        <div class="field-with-hint">
          <AuthInput
            v-model="weddingDate"
            :label="$t('onboarding.eventBasics.fields.weddingDate')"
            type="date"
          >
            <template #icon>📅</template>
          </AuthInput>
          <p class="hint">{{ $t('onboarding.eventBasics.hints.weddingDate') }}</p>
        </div>

        <div class="field-with-hint">
          <AuthInput
            v-model="location"
            :label="$t('onboarding.eventBasics.fields.location')"
            :placeholder="$t('onboarding.eventBasics.placeholders.location')"
          >
            <template #icon>📍</template>
          </AuthInput>
          <p class="hint">{{ $t('onboarding.eventBasics.hints.location') }}</p>
        </div>
      </div>

      <div class="actions">
        <!-- Continue uses RouterLink via ButtonMain -->
        <ButtonMain
          class="w-100"
          :label="$t('onboarding.eventBasics.actions.continue')"
          :to="continueTo"
          variant="main"
        />

        <button type="button" class="skip" @click="$emit('skip')">
          {{ $t('onboarding.eventBasics.actions.skip') }}
        </button>
      </div>
    </form>

    <div class="protip">
      <span class="dot" aria-hidden="true">•</span>
      <p class="protip-text">
        <strong>{{ $t('onboarding.eventBasics.protip.label') }}</strong>
        {{ $t('onboarding.eventBasics.protip.text') }}
      </p>
    </div>
  </OnboardingCard>
</template>

<script setup>
import { ref } from "vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

import OnboardingCardHeader from "@/components/onboarding/OnboardingCardHeader.vue";
import OnboardingCard from "@/components/cards/OnboardingCard.vue";

defineProps({
  continueTo: { type: [String, Object], required: true }
});

defineEmits(["skip"]);

const brideName = ref("");
const groomName = ref("");
const weddingDate = ref("");
const location = ref("");

function onContinue() {
  // If you later want to validate and route programmatically:
  // - validate here
  // - store in Pinia / API
  // ButtonMain already navigates, so submit isn’t required.
}
</script>

<style scoped>
.form {
  margin-top: 14px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field-with-hint {
  display: grid;
  gap: 6px;
}

.hint {
  margin: 0;
  font-size: 11px;
  color: rgba(51, 67, 56, 0.65);
  line-height: 1.3;
}

.actions {
  margin-top: 16px;
  display: grid;
  gap: 10px;
  justify-items: center;
}

.w-100 {
  width: 100%;
}

/* "Skip for now" link */
.skip {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: rgba(51, 67, 56, 0.65);
  text-decoration: none;
}

.skip:hover {
  color: var(--brand-main);
  text-decoration: underline;
}

.protip {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--neutral-300);
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 8px;
  align-items: start;
}

.dot {
  color: var(--brand-gold);
  line-height: 1;
  margin-top: 2px;
}

.protip-text {
  margin: 0;
  font-size: 11px;
  color: rgba(51, 67, 56, 0.65);
  line-height: 1.35;
}

@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

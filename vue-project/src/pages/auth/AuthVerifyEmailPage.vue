<template>
  <AuthShell>
    <AuthCard>
      <AuthBrandHeader :title="$t('auth.brand')" />

      <AuthCardTitle
        :title="$t('auth.verify.title')"
        :subtitle="$t('auth.verify.subtitle', { email })"
      />
      <form class="auth-form" @submit.prevent="onVerify">
        <AuthInput v-model="code" @complete="onVerify"  label=""/>

        <p v-if="error" class="error">{{ error }}</p>

        <ButtonMain
          :label="$t('auth.verify.cta')"
          variant="main"
          class="w-100"
          :disabled="!code || loading"
          :loading="loading"
          type="submit"
        />
      </form>



      <div class="auth-links">
        <button class="link" type="button" @click="onResend">
          {{ $t('auth.verify.resend') }}
        </button>

        <button class="link" type="button" @click="onChangeEmail">
          {{ $t('auth.verify.changeEmail') }}
        </button>
      </div>
    </AuthCard>
  </AuthShell>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCardTitle from "@/components/auth/AuthCardTitle.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import { onboardingStore, setEmailVerified } from "@/store/onboarding.store";
import { verifyEmail } from "@/services/auth.service";

const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const email = computed(() => onboardingStore.email || "");
const code = ref("");
const loading = ref(false);
const error = ref("");

async function onVerify() {
  error.value = "";
  if (!code.value || !email.value) return;
  loading.value = true;
  try {
    await verifyEmail(code.value.trim(), email.value.trim());
    setEmailVerified(true);
    await router.push({ name: "EventCategoryPage", params: { lang: lang.value } });
  } catch (e) {
    error.value = e?.message || "Verification failed";
  } finally {
    loading.value = false;
  }
}

function onResend() {
  // optionally call resend endpoint if available
  // toast or message
}

function onChangeEmail() {
  router.push({ name: "signup", params: { lang: lang.value } });
}
</script>

<style scoped>
.auth-links {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  justify-items: center;
}

.link {
  background: transparent;
  border: 0;
  color: var(--brand-main);
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>

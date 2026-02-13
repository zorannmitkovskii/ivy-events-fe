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
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCardTitle from "@/components/auth/AuthCardTitle.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import { onboardingStore, setEmailVerified, getTempPassword, getTempUsername, clearTempCredentials } from "@/store/onboarding.store";
import { verifyEmail, exchangeOAuthCode, loginWithCredentials } from "@/services/auth.service";

const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const email = computed(() => onboardingStore.email || "");
const code = ref("");
const loading = ref(false);
const error = ref("");

// Detect Google OAuth callback and skip verification
onMounted(async () => {
  const oauthCode = route.query.code;
  const sessionState = route.query.session_state;

  if (oauthCode && sessionState) {
    loading.value = true;
    try {
      const redirectUri = `${window.location.origin}/${lang.value}/auth/verify-email`;
      await exchangeOAuthCode(oauthCode, redirectUri);
      setEmailVerified(true);
      await router.replace({ name: "EventCategoryPage", params: { lang: lang.value } });
    } catch (e) {
      error.value = e?.message || "Google sign-in failed. Please try again.";
      loading.value = false;
    }
  }
});

async function onVerify() {
  error.value = "";
  if (!code.value || !email.value) return;
  loading.value = true;
  try {
    await verifyEmail(code.value.trim(), email.value.trim());
    setEmailVerified(true);

    // Auto-login with credentials stored during registration
    const tempPw = getTempPassword();
    const tempUser = getTempUsername();
    if (tempPw && tempUser) {
      try {
        await loginWithCredentials(tempUser, tempPw);
      } catch (loginErr) {
        console.warn("[auto-login] failed after verify:", loginErr?.message);
      } finally {
        clearTempCredentials();
      }
    }

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

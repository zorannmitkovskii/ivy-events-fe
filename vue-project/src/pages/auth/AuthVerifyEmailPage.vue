<template>
  <!-- Google OAuth callback: show only a spinner, never the verify form -->
  <AuthShell v-if="isOAuthCallback">
    <AuthCard>
      <div class="oauth-loading">
        <div class="spinner"></div>
        <p v-if="error" class="oauth-error">{{ error }}</p>
      </div>
    </AuthCard>
  </AuthShell>

  <!-- Normal email verification flow -->
  <AuthShell v-else>
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
import { onboardingStore, setEmailVerified, setEventId, getTempPassword, getTempUsername, clearTempCredentials } from "@/store/onboarding.store";
import { verifyEmail, exchangeOAuthCode, assignRole, refreshAccessToken, getEventId, loginWithCredentials } from "@/services/auth.service";

const router = useRouter();
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const email = computed(() => onboardingStore.email || "");
const code = ref("");
const loading = ref(false);
const error = ref("");

// Detect OAuth callback synchronously so template never shows the verify form
const isOAuthCallback = computed(() => !!(route.query.code && route.query.session_state));

// Handle Google OAuth callback — exchange code and redirect to category page
onMounted(async () => {
  if (!isOAuthCallback.value) return;

  loading.value = true;
  try {
    const redirectUri = `${window.location.origin}/${lang.value}/auth/verify-email`;
    await exchangeOAuthCode(route.query.code, redirectUri);

    // Assign USER role to the Google-created user, then refresh token so role is in JWT
    try {
      const claims = JSON.parse(atob(localStorage.getItem("access_token").split(".")[1]));
      await assignRole(claims.email, "USER");
      await refreshAccessToken();
    } catch (e) {
      console.warn("[google-assign-role]", e?.message);
    }

    setEmailVerified(true);
    setEventId(getEventId());

    // Login → dashboard, Signup → event creation flow
    const intent = sessionStorage.getItem("google_oauth_intent");
    sessionStorage.removeItem("google_oauth_intent");

    if (intent === "login") {
      await router.replace({ name: "dashboard.overview", params: { lang: lang.value } });
    } else {
      await router.replace({ name: "EventCategoryPage", params: { lang: lang.value } });
    }
  } catch (e) {
    error.value = e?.message || "Google sign-in failed. Please try again.";
    loading.value = false;
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

.oauth-loading {
  display: grid;
  place-items: center;
  padding: 48px 24px;
  gap: 16px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--brand-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.oauth-error {
  color: var(--error);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}
</style>

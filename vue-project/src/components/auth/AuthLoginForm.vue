<template>
  <form class="auth-form" @submit.prevent="onSubmit">
    <AuthInput
      v-model="email"
      :label="$t('auth.fields.email')"
      :placeholder="$t('auth.placeholders.email')"
      type="email"
      required
      autocomplete="email"
    >
      <template #icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
          <rect x="2" y="4" width="20" height="16" rx="2" />
        </svg>
      </template>
    </AuthInput>

    <AuthInput
      v-model="password"
      :label="$t('auth.fields.password')"
      :placeholder="$t('auth.placeholders.password')"
      type="password"
      required
      autocomplete="current-password"
    >
      <template #icon>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </template>
    </AuthInput>

    <div class="auth-row">
      <RouterLink class="auth-link" :to="{ name: 'forgot-password', params: { lang } }">
        {{ $t('auth.login.forgotPassword') }}
      </RouterLink>
    </div>

    <p v-if="formError" class="auth-error">{{ formError }}</p>

    <ButtonMain
      :label="$t('auth.login.signIn')"
      variant="main"
      type="submit"
      class="auth-submit-btn"
      :loading="isLoading"
      :disabled="!canSubmit"
    />

    <AuthDivider :label="$t('auth.common.orContinue')" />

    <GoogleButton @click="onGoogle" />

    <p class="auth-signup">
      {{ $t('auth.login.noAccount') }}
      <RouterLink :to="{ name: 'signup', params: { lang } }">
        {{ $t('auth.login.createAccount') }}
      </RouterLink>
    </p>
  </form>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AuthDivider from '@/components/auth/AuthDivider.vue';
import AuthInput from '@/components/auth/AuthInput.vue';
import GoogleButton from '@/components/auth/GoogleButton.vue';
import ButtonMain from '@/components/generic/ButtonMain.vue';
import { loginWithCredentials, getEventId } from '@/services/auth.service';
import { setEventId } from '@/store/onboarding.store';
import { getRuntimeEnv, detectDefaultEnvFromLocation, computeKeycloakBaseUrl } from '@/services/env';

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || 'mk');

const email = ref(route.query.email || '');
const password = ref('');
const isLoading = ref(false);
const formError = ref('');

const canSubmit = computed(() => {
  return email.value.trim().length > 0 && password.value.length > 0 && !isLoading.value;
});

// Auto-continue Google flow after Keycloak logout redirect
onMounted(() => {
  if (sessionStorage.getItem("google_oauth_pending")) {
    sessionStorage.removeItem("google_oauth_pending");
    onGoogle();
  }
});

async function onSubmit() {
  formError.value = '';
  isLoading.value = true;

  try {
    await loginWithCredentials(email.value.trim(), password.value);
    setEventId(getEventId());

    const redirect = route.query.redirect;
    if (redirect) {
      await router.push(redirect);
    } else {
      await router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
    }
  } catch (e) {
    formError.value = e?.message || 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
}

function getKeycloakConfig() {
  const env = getRuntimeEnv();
  const appEnv = (env.APP_ENV || detectDefaultEnvFromLocation()).toString().toLowerCase();
  const keycloakUrl = appEnv !== 'local' ? computeKeycloakBaseUrl(appEnv) : (env.VITE_KEYCLOAK_URL || computeKeycloakBaseUrl(appEnv));
  const realm = appEnv !== 'local' ? 'event-app' : (env.VITE_KEYCLOAK_REALM || 'event-app');
  const clientId = appEnv !== 'local' ? 'eventFE' : (env.VITE_KEYCLOAK_CLIENT_ID || 'eventFE');
  return { keycloakUrl, realm, clientId };
}

function onGoogle() {
  const idToken = localStorage.getItem("id_token");

  // Clear local auth tokens
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("id_token");
  localStorage.removeItem("onboarding_state_v1");

  const { keycloakUrl, realm, clientId } = getKeycloakConfig();

  sessionStorage.setItem("google_oauth_intent", "login");

  const redirectUri = encodeURIComponent(
    `${window.location.origin}/${lang.value}/auth/verify-email`
  );

  const googleAuthUrl =
    `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&response_type=code` +
    `&scope=openid` +
    `&kc_idp_hint=google`;

  if (idToken) {
    // Active Keycloak session — end it via full redirect first,
    // then auto-continue to Google on return
    sessionStorage.setItem("google_oauth_pending", "1");

    const postLogoutUri = encodeURIComponent(
      `${window.location.origin}/${lang.value}/auth/login`
    );

    window.location.href =
      `${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout` +
      `?id_token_hint=${encodeURIComponent(idToken)}` +
      `&post_logout_redirect_uri=${postLogoutUri}`;
  } else {
    // No existing session — go directly to Google via Keycloak
    window.location.href = googleAuthUrl;
  }
}
</script>

<style scoped>
.auth-submit-btn {
  width: 100%;
  justify-content: center;
}
.auth-signup {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--neutral-500);
  text-align: center;
}
.auth-signup a {
  color: var(--brand-main);
  font-weight: 600;
  text-decoration: none;
}
.auth-signup a:hover {
  text-decoration: underline;
}
</style>

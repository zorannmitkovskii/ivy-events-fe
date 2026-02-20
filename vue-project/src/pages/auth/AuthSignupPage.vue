<template>
  <AuthLayout>
    <template #left>
      <div>
        <AuthBrand />

        <h1 class="title">{{ t('register.title') }}</h1>
        <p class="subtitle">{{ t('register.subtitle') }}</p>
        <div class="accent-line" aria-hidden="true"></div>

        <GoogleButton
          :label="t('register.googleButton')"
          icon-src="https://www.svgrepo.com/show/475656/google-color.svg"
          @click="onGoogle"
        />

        <AuthDivider :label="t('register.divider')" />

        <form class="form" @submit.prevent="onRegister">
          <AuthInput v-model="firstName" :label="t('register.firstName')" required autofocus>
            <template #icon>👤</template>
          </AuthInput>

          <AuthInput v-model="lastName" :label="t('register.lastName')">
            <template #icon>👤</template>
          </AuthInput>

          <AuthInput v-model="email" :label="t('register.email')" type="email" required>
            <template #icon>✉️</template>
          </AuthInput>

          <AuthInput
            v-model="password"
            :label="t('register.password')"
            type="password"
            required
            @blur="validatePassword"
          >
            <template #icon>🔒</template>
          </AuthInput>

          <!-- Password strength indicator -->
          <div v-if="password && passwordErrors.length > 0" class="password-hints">
            <p class="hints-title">{{ t('register.passwordRequirements') }}</p>
            <ul class="hints-list">
              <li :class="{ valid: !passwordErrors.includes('length') }">
                {{ t('register.passwordLength') }}
              </li>
              <li :class="{ valid: !passwordErrors.includes('uppercase') }">
                {{ t('register.passwordUppercase') }}
              </li>
              <li :class="{ valid: !passwordErrors.includes('lowercase') }">
                {{ t('register.passwordLowercase') }}
              </li>
              <li :class="{ valid: !passwordErrors.includes('digit') }">
                {{ t('register.passwordDigit') }}
              </li>
              <li :class="{ valid: !passwordErrors.includes('special') }">
                {{ t('register.passwordSpecial') }}
              </li>
            </ul>
          </div>

          <AuthInput
            v-model="confirmPassword"
            :label="t('register.confirmPassword')"
            type="password"
            required
            @blur="checkPasswordMatch"
          >
            <template #icon>✅</template>
          </AuthInput>

          <!-- Password mismatch warning -->
          <p v-if="confirmPassword && !passwordsMatch" class="warning">
            {{ t('register.passwordMismatch') }}
          </p>

          <AuthCheckbox v-model="agree">
            {{ t('register.agreeText') }}
            <RouterLink :to="{ name: 'terms', params: { lang } }" target="_blank">{{ t('register.terms') }}</RouterLink>
            {{ t('register.and') }}
            <RouterLink :to="{ name: 'terms', params: { lang } }" target="_blank">{{ t('register.privacy') }}</RouterLink>
          </AuthCheckbox>

          <!-- Error message -->
          <p v-if="formError" class="error">{{ formError }}</p>

          <ButtonMain
            :label="t('register.createAccount')"
            variant="main"
            class="cta"
            type="submit"
            :loading="isLoading"
            :disabled="!canSubmit"
          />

          <p class="signin">
            {{ t('register.haveAccount') }}
            <RouterLink :to="{ name: 'login', params: { lang } }">
              {{ t('register.signIn') }}
            </RouterLink>
          </p>

          <div class="bottom-links">
            <a href="/help">{{ t('register.help') }}</a>
            <span>•</span>
            <a href="/contact">{{ t('register.contact') }}</a>
          </div>
        </form>
      </div>
    </template>

    <template #right>
      <RightPromoPanel
        :title="t('register.promoTitle')"
        :subtitle="t('register.promoSubtitle')"
        :items="[
          t('register.promoItem1'),
          t('register.promoItem2'),
          t('register.promoItem3'),
          t('register.promoItem4'),
          t('register.promoItem5')
        ]"
        background-url="/images/wedding-bg.jpg"
      />
    </template>
  </AuthLayout>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { register } from "@/services/auth.service";
import { getRuntimeEnv, detectDefaultEnvFromLocation, computeKeycloakBaseUrl } from '@/services/env';
import { setEmail, setTempPassword, setTempUsername } from "@/store/onboarding.store";

import AuthLayout from "@/components/layout/AuthLayout.vue";
import AuthBrand from "@/components/auth/AuthBrand.vue";
import AuthDivider from "@/components/auth/AuthDivider.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import AuthCheckbox from "@/components/auth/AuthCheckbox.vue";

import ButtonMain from "@/components/generic/ButtonMain.vue";
import RightPromoPanel from "@/components/auth/RightPromoPanel.vue";
import GoogleButton from "@/components/auth/GoogleButton.vue";

const router = useRouter();
const route = useRoute();

const lang = computed(() => route.params.lang || "mk");

// Auto-continue Google flow after Keycloak logout redirect
onMounted(() => {
  if (sessionStorage.getItem("google_oauth_pending")) {
    sessionStorage.removeItem("google_oauth_pending");
    onGoogle();
  }
});

const firstName = ref("");
const lastName = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const agree = ref(false);

const isLoading = ref(false);
const formError = ref("");
const passwordErrors = ref([]);

// Translation function (replace with your i18n setup)
const translations = {
  en: {
    'register.title': 'Create your account',
    'register.subtitle': 'Begin planning your unforgettable celebration.',
    'register.googleButton': 'Continue with Google',
    'register.divider': 'Or continue with email',
    'register.firstName': 'First Name',
        'register.lastName': 'Last Name',
    'register.email': 'Email Address',
    'register.password': 'Password',
    'register.confirmPassword': 'Confirm Password',
    'register.passwordRequirements': 'Password must contain:',
    'register.passwordLength': 'At least 8 characters',
    'register.passwordUppercase': 'One uppercase letter',
    'register.passwordLowercase': 'One lowercase letter',
    'register.passwordDigit': 'One number',
    'register.passwordSpecial': 'One special character (!@#$%^&*)',
    'register.passwordMismatch': 'Passwords do not match',
    'register.agreeText': 'I agree to the',
    'register.terms': 'Terms of Service',
    'register.and': 'and',
    'register.privacy': 'Privacy Policy',
    'register.createAccount': 'Create Account',
    'register.haveAccount': 'Already have an account?',
    'register.signIn': 'Sign in',
    'register.help': 'Help',
    'register.contact': 'Contact',
    'register.promoTitle': 'Plan your perfect day',
    'register.promoSubtitle': 'From guest lists to seating arrangements, manage every detail of your wedding in one place.',
    'register.promoItem1': 'Create beautiful wedding websites',
    'register.promoItem2': 'Manage guest list easily',
    'register.promoItem3': 'Design perfect seating arrangement',
    'register.promoItem4': 'Collaborate with your partner',
    'register.promoItem5': 'Find and book trusted vendors',
    'register.error.network': 'Network error. Please try again.',
    'register.error.termsRequired': 'You must accept the Terms and Privacy Policy.',
    'register.error.passwordMismatch': 'Passwords do not match.',
    'register.error.invalidPassword': 'Please fix password requirements before continuing.',
    'register.error.default': 'Registration failed. Please try again.'
  },
  mk: {
    'register.title': 'Креирајте сметка',
    'register.subtitle': 'Започнете со планирањето на вашата незаборавна прослава.',
    'register.googleButton': 'Продолжи со Google',
    'register.divider': 'Или продолжи со е-пошта',
    'register.firstName': 'Име',
    'register.lastName': 'Презиме',
    'register.email': 'Е-пошта',
    'register.password': 'Лозинка',
    'register.confirmPassword': 'Потврди Лозинка',
    'register.passwordRequirements': 'Лозинката мора да содржи:',
    'register.passwordLength': 'Најмалку 8 карактери',
    'register.passwordUppercase': 'Една голема буква',
    'register.passwordLowercase': 'Една мала буква',
    'register.passwordDigit': 'Еден број',
    'register.passwordSpecial': 'Еден специјален карактер (!@#$%^&*)',
    'register.passwordMismatch': 'Лозинките не се совпаѓаат',
    'register.agreeText': 'Се согласувам со',
    'register.terms': 'Условите за користење',
    'register.and': 'и',
    'register.privacy': 'Политиката за приватност',
    'register.createAccount': 'Креирај Сметка',
    'register.haveAccount': 'Веќе имате сметка?',
    'register.signIn': 'Најави се',
    'register.help': 'Помош',
    'register.contact': 'Контакт',
    'register.promoTitle': 'Планирајте го вашиот совршен ден',
    'register.promoSubtitle': 'Од списоци на гости до распоред на седење, управувајте со секој детал на вашата свадба на едно место.',
    'register.promoItem1': 'Креирајте прекрасни венчални веб-страници',
    'register.promoItem2': 'Управувајте со листата на гости лесно',
    'register.promoItem3': 'Дизајнирајте совршен распоред на седење',
    'register.promoItem4': 'Соработувајте со вашиот партнер',
    'register.promoItem5': 'Најдете и резервирајте доверливи добавувачи',
    'register.error.network': 'Грешка во мрежата. Ве молиме обидете се повторно.',
    'register.error.termsRequired': 'Мора да ги прифатите Условите и Политиката за приватност.',
    'register.error.passwordMismatch': 'Лозинките не се совпаѓаат.',
    'register.error.invalidPassword': 'Ве молиме поправете ги барањата за лозинка пред да продолжите.',
    'register.error.default': 'Регистрацијата не успеа. Ве молиме обидете се повторно.'
  }
};

const t = (key) => {
  return translations[lang.value]?.[key] || translations.en[key] || key;
};

// Password validation
const validatePassword = () => {
  const errors = [];

  if (password.value.length < 8) {
    errors.push('length');
  }
  if (!/[A-Z]/.test(password.value)) {
    errors.push('uppercase');
  }
  if (!/[a-z]/.test(password.value)) {
    errors.push('lowercase');
  }
  if (!/[0-9]/.test(password.value)) {
    errors.push('digit');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password.value)) {
    errors.push('special');
  }

  passwordErrors.value = errors;
  return errors.length === 0;
};

// Re-validate password in real-time as user types
watch(password, () => {
  if (passwordErrors.value.length > 0 || password.value) {
    validatePassword();
  }
});

const isPasswordValid = computed(() => {
  return password.value && passwordErrors.value.length === 0;
});

// Check if passwords match
const checkPasswordMatch = () => {
  return password.value === confirmPassword.value;
};

const passwordsMatch = computed(() => {
  if (!confirmPassword.value) return true; // Don't show error until user types
  return password.value === confirmPassword.value;
});

// Enable submit button only when all validations pass
const canSubmit = computed(() => {
  return (
    firstName.value.trim().length > 0 &&
    email.value.trim().length > 3 &&
    password.value.length >= 8 &&
    isPasswordValid.value &&
    confirmPassword.value.length >= 8 &&
    passwordsMatch.value &&
    agree.value &&
    !isLoading.value
  );
});


function usernameFromEmail(emailStr) {
  const base = (emailStr.split("@")[0] || "user").trim();
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "");
  return sanitized || `user${Date.now()}`;
}

async function onRegister() {
  formError.value = "";

  // Validate terms acceptance
  if (!agree.value) {
    formError.value = t('register.error.termsRequired');
    return;
  }

  // Validate password match
  if (password.value !== confirmPassword.value) {
    formError.value = t('register.error.passwordMismatch');
    return;
  }

  // Validate password requirements
  if (!validatePassword()) {
    formError.value = t('register.error.invalidPassword');
    return;
  }

  const firstNameVal = firstName.value.trim();
  const lastNameVal = lastName.value.trim();

  isLoading.value = true;
  try {
    const regResponse = await register({
      username: usernameFromEmail(email.value),
      email: email.value.trim(),
      password: password.value,
      firstName: firstNameVal,
      lastName: lastNameVal,
      roles: ["USER"]
    });

    setEmail(email.value.trim());
    setTempPassword(password.value);
    setTempUsername(regResponse?.username || usernameFromEmail(email.value));

    await router.push({
      name: "AuthVerifyEmailPage",
      params: { lang: lang.value }
    });
  } catch (e) {
    console.error('Registration error:', e);
    formError.value = e?.message || t('register.error.default');
  } finally {
    isLoading.value = false;
  }
}

function onGoogle() {
  const idToken = localStorage.getItem("id_token");

  // Clear local auth tokens
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("id_token");
  localStorage.removeItem("onboarding_state_v1");

  const env = getRuntimeEnv();
  const appEnv = (env.APP_ENV || detectDefaultEnvFromLocation()).toString().toLowerCase();
  const keycloakBaseUrl = appEnv !== 'local' ? computeKeycloakBaseUrl(appEnv) : (env.VITE_KEYCLOAK_URL || computeKeycloakBaseUrl(appEnv));
  const realm = appEnv !== 'local' ? 'event-app' : (env.VITE_KEYCLOAK_REALM || 'event-app');
  const clientId = appEnv !== 'local' ? 'eventFE' : (env.VITE_KEYCLOAK_CLIENT_ID || 'eventFE');

  sessionStorage.setItem("google_oauth_intent", "signup");

  const redirectUri = encodeURIComponent(
    `${window.location.origin}/${lang.value}/auth/verify-email`
  );

  const googleAuthUrl =
    `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/auth` +
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
      `${window.location.origin}/${lang.value}/auth/signup`
    );

    window.location.href =
      `${keycloakBaseUrl}/realms/${realm}/protocol/openid-connect/logout` +
      `?id_token_hint=${encodeURIComponent(idToken)}` +
      `&post_logout_redirect_uri=${postLogoutUri}`;
  } else {
    // No existing session — go directly to Google via Keycloak
    window.location.href = googleAuthUrl;
  }
}
</script>

<style scoped>
.title {
  font-family: var(--font-family, inherit), serif;
  font-size: 42px;
  line-height: 1.1;
  margin: 8px 0 6px;
  color: var(--neutral-900);
  font-weight: 500;
}

.subtitle {
  margin: 0 0 12px;
  color: var(--neutral-700);
  font-size: 14px;
}

.accent-line {
  width: 34px;
  height: 3px;
  background: var(--brand-gold);
  border-radius: 99px;
  margin: 10px 0 18px;
}

.form {
  display: grid;
  gap: 14px;
}

.cta {
  width: 100%;
  justify-content: center;
}

.error {
  margin: 4px 0 0;
  font-size: 13px;
  color: #b42318;
  background: rgba(180, 35, 24, 0.08);
  border: 1px solid rgba(180, 35, 24, 0.18);
  padding: 10px 12px;
  border-radius: 12px;
}

.warning {
  margin: -8px 0 0;
  font-size: 12px;
  color: #dc6803;
  background: rgba(220, 104, 3, 0.08);
  border: 1px solid rgba(220, 104, 3, 0.18);
  padding: 8px 10px;
  border-radius: 8px;
}

.password-hints {
  margin: -8px 0 0;
  font-size: 12px;
  background: rgba(147, 162, 154, 0.06);
  border: 1px solid rgba(147, 162, 154, 0.15);
  padding: 10px 12px;
  border-radius: 8px;
}

.hints-title {
  margin: 0 0 6px;
  font-weight: 600;
  color: var(--brand-dark);
}

.hints-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.hints-list li {
  position: relative;
  margin: 4px 0;
  color: var(--brand-dark);
}

.hints-list li::before {
  content: "✗";
  position: absolute;
  left: -18px;
  color: #dc6803;
  font-weight: bold;
}

.hints-list li.valid {
  color: #027a48;
}

.hints-list li.valid::before {
  content: "✓";
  color: #027a48;
}

.signin {
  margin: 6px 0 0;
  font-size: 12px;
  color: rgba(51, 67, 56, 0.7);
  text-align: center;
}

.signin a {
  color: var(--neutral-900);
  font-weight: 700;
  text-decoration: none;
}

.signin a:hover {
  text-decoration: underline;
}

.bottom-links {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  color: rgba(51, 67, 56, 0.55);
}

.bottom-links a {
  color: rgba(51, 67, 56, 0.75);
  text-decoration: none;
}

.bottom-links a:hover {
  text-decoration: underline;
}
</style>

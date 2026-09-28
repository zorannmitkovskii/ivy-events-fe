<template>
  <AuthShell>
    <p class="tag">{{ $t('auth.register.eyebrow') }}</p>
    <h1 class="title">{{ t('register.title') }}</h1>
    <p class="subtitle">{{ t('register.subtitle') }}</p>

    <GoogleButton :label="t('register.googleButton')" @click="onGoogle" />

    <AuthDivider :label="t('register.divider')" />

    <form class="signup-form" @submit.prevent="onRegister">
      <!--
        Asked first, because it changes what the rest of the form means and
        what the account can do afterwards. Left to be inferred, everyone
        became personal and an agency met a wall of refusals with nothing
        on screen saying an account type had been chosen for them.
      -->
      <fieldset class="account-type">
        <legend>{{ t('register.accountType') }}</legend>

        <!--
          A segmented switch rather than two stacked cards: there are
          exactly two mutually exclusive options, and side by side they can
          be compared in one glance instead of read in sequence.

          Still radios underneath. A pair of styled buttons would look the
          same and lose keyboard arrow-key selection, the focus ring and
          what a screen reader announces.
        -->
        <div class="segmented" :data-picked="accountType">
          <label
            v-for="option in ACCOUNT_TYPES"
            :key="option"
            class="segment"
            :class="{ picked: accountType === option }"
          >
            <input v-model="accountType" type="radio" :value="option" />
            <span class="segment-title">{{ t(`register.${option.toLowerCase()}`) }}</span>
          </label>
        </div>

        <!-- One hint, for whichever is selected. Two hints side by side
             is twice the text to compare and half the room to say it in. -->
        <p class="segment-hint">{{ t(`register.${accountType.toLowerCase()}Hint`) }}</p>
      </fieldset>

      <!-- Required for an agency: the organization is created at
           verification, and one with no name is a row nobody can identify
           in a registry other products read. -->
      <AuthInput
        v-if="accountType === 'AGENCY_MEMBER'"
        v-model="organizationName"
        :label="t('register.organizationName')"
        required
      >
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" /><path d="M15 9h2a2 2 0 0 1 2 2v10" /><path d="M9 7h2M9 11h2M9 15h2" />
          </svg>
        </template>
      </AuthInput>

      <AuthInput v-model="firstName" :label="t('register.firstName')" required autofocus>
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </template>
      </AuthInput>

      <AuthInput v-model="lastName" :label="t('register.lastName')">
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </template>
      </AuthInput>

      <AuthInput v-model="email" :label="t('register.email')" type="email" required>
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" />
          </svg>
        </template>
      </AuthInput>

      <AuthInput
        v-model="password"
        :label="t('register.password')"
        type="password"
        required
        @blur="validatePassword"
      >
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </template>
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
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
          </svg>
        </template>
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
  </AuthShell>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { register } from "@/services/auth.service";
import { resumePendingGoogleSignIn, startGoogleSignIn } from '@/services/googleOAuth';
import { setEmail, setTempPassword, setTempUsername } from "@/store/onboarding.store";
import { ApiError } from "@/services/apiError";

import AuthShell from "@/components/auth/AuthShell.vue";
import AuthDivider from "@/components/auth/AuthDivider.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import AuthCheckbox from "@/components/auth/AuthCheckbox.vue";

import ButtonMain from "@/components/generic/ButtonMain.vue";
import GoogleButton from "@/components/auth/GoogleButton.vue";

const router = useRouter();
const route = useRoute();

const lang = computed(() => route.params.lang || "mk");

// Auto-continue Google flow after Keycloak logout redirect
onMounted(() => resumePendingGoogleSignIn(onGoogle));

// Personal by default. The safe reading of "they did not choose": an account
// that should have been an agency is a support ticket; an agency created by
// accident is a tenant in the registry nobody asked for.
const ACCOUNT_TYPES = ["PERSONAL", "AGENCY_MEMBER"];

const accountType = ref("PERSONAL");
const organizationName = ref("");
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
    'register.accountType': 'What kind of account do you need?',
    'register.personal': 'Personal',
    'register.personalHint': 'I am planning my own event',
    'register.organizer': 'Organizer',
    'register.organizerHint': 'I plan events for clients',
    'register.organizationName': 'Agency name',
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
    'register.promoItem5': 'Find and book trusted professionals',
    'register.error.network': 'Network error. Please try again.',
    'register.error.termsRequired': 'You must accept the Terms and Privacy Policy.',
    'register.error.passwordMismatch': 'Passwords do not match.',
    'register.error.invalidPassword': 'Please fix password requirements before continuing.',
    'register.error.alreadyExists': 'An account with this email already exists.',
    'register.error.default': 'Registration failed. Please try again.'
  },
  mk: {
    'register.title': 'Креирајте сметка',
    'register.subtitle': 'Започнете со планирањето на вашата незаборавна прослава.',
    'register.googleButton': 'Продолжи со Google',
    'register.divider': 'Или продолжи со е-пошта',
    'register.accountType': 'Каков профил ти треба?',
    'register.personal': 'Личен',
    'register.personalHint': 'Планирам сопствен настан',
    'register.organizer': 'Организатор',
    'register.organizerHint': 'Планирам настани за клиенти',
    'register.organizationName': 'Име на агенцијата',
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
    'register.promoItem5': 'Најдете и резервирајте доверливи професионалци',
    'register.error.network': 'Грешка во мрежата. Ве молиме обидете се повторно.',
    'register.error.termsRequired': 'Мора да ги прифатите Условите и Политиката за приватност.',
    'register.error.passwordMismatch': 'Лозинките не се совпаѓаат.',
    'register.error.invalidPassword': 'Ве молиме поправете ги барањата за лозинка пред да продолжите.',
    'register.error.alreadyExists': 'Веќе постои сметка со оваа е-пошта.',
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
  // An agency without a name cannot be created, and the server refuses it. The
  // button says so first rather than letting somebody fill in a whole form to
  // be told at the end.
  const organizationNamed = accountType.value !== "AGENCY_MEMBER"
    || organizationName.value.trim().length > 0;

  return (
    organizationNamed &&
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
      roles: ["USER"],
      accountType: accountType.value,
      // Sent only when it means something. An organization name on a personal
      // signup is a field the server would have to decide to ignore.
      organizationName: accountType.value === "AGENCY_MEMBER"
        ? organizationName.value.trim()
        : null
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
    if (e instanceof ApiError) {
      if (e.errorCode === 'VAL_REQUEST_BODY_INVALID' && e.validationErrors) {
        // Show field-level errors as a list
        const fields = Object.entries(e.validationErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('\n');
        formError.value = fields;
      } else if (e.errorCode === 'CONFLICT_OBJECT_ALREADY_EXISTS') {
        formError.value = e.detail || t('register.error.alreadyExists');
      } else {
        formError.value = e.detail || e.message;
      }
    } else {
      formError.value = e?.message || t('register.error.default');
    }
  } finally {
    isLoading.value = false;
  }
}

function onGoogle() {
  startGoogleSignIn({ lang: lang.value, intent: 'signup', returnPath: 'auth/signup' });
}

</script>

<style scoped>
/* The heading block matches AuthCardTitle's, which the other auth pages get
   from the component. Signup keeps its own because its title and subtitle
   come from a local translation table rather than the app bundle. */
.title {
  margin: 0;
  font-size: clamp(32px, 3.4vw, 44px);
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 10px 0 22px;
  font-family: var(--font-ui);
  font-size: 16px;
  line-height: 1.5;
  color: var(--ink-2);
}

/*
  Not `.form`. That name belongs to the contact page in `site.css`, where it
  is a two-column grid with its own field styling — and at the 420px this
  column gets, two columns put "Потврди лозинка" on two lines over a 130px
  box. This form is one column and builds its fields from `AuthInput`.
*/
.signup-form {
  display: grid;
  gap: 14px;
  margin-top: 4px;
}

.cta {
  width: 100%;
  justify-content: center;
}

/* Status colours come from the tokens, so they follow the theme. The literals
   these replace were fixed light-mode values. */
.error {
  margin: 4px 0 0;
  padding: 11px 14px;
  border: 1px solid var(--error);
  border-radius: var(--radius-control);
  background: var(--error-pale);
  font-size: 14.5px;
  color: var(--error);
}

.warning {
  margin: -8px 0 0;
  padding: 9px 12px;
  border: 1px solid var(--warning);
  border-radius: var(--radius-control);
  background: var(--warning-pale);
  font-size: 14px;
  color: var(--warning);
}

.password-hints {
  margin: -8px 0 0;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  background: var(--mist-2);
  font-size: 14px;
}

.hints-title {
  margin: 0 0 6px;
  font-weight: 600;
  color: var(--ink);
}

.hints-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.hints-list li {
  position: relative;
  margin: 4px 0;
  color: var(--ink-2);
}

.hints-list li::before {
  content: "✗";
  position: absolute;
  left: -18px;
  color: var(--warning);
  font-weight: bold;
}

.hints-list li.valid {
  color: var(--success);
}

.hints-list li.valid::before {
  content: "✓";
  color: var(--success);
}

.signin {
  margin: 6px 0 0;
  font-family: var(--font-ui);
  font-size: 14.5px;
  color: var(--ink-3);
  text-align: center;
}

.signin a {
  color: var(--ink);
  font-weight: 600;
  text-decoration: none;
}

.signin a:hover {
  text-decoration: underline;
}

.bottom-links {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 14px;
  font-size: 14px;
  color: var(--ink-3);
}

.bottom-links a {
  color: var(--ink-3);
  text-decoration: none;
}

.bottom-links a:hover {
  text-decoration: underline;
}
</style>

<style scoped>
/* A segmented switch: two halves of one control, with a thumb that slides
   between them. It is the most consequential field on the form and the
   smallest one by default. */
.account-type {
  border: 0;
  padding: 0;
  margin: 0 0 0.25rem;
}

.account-type legend {
  padding: 0;
  margin-bottom: 8px;
  font-family: var(--font-ui);
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink-2);
}

.segmented {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 4px;
  border: 1px solid var(--line-2);
  border-radius: 999px;
  background: var(--sunken);
  isolation: isolate;
}

/* The moving half. One element rather than a background on each label, so the
   travel between them is a slide instead of two independent fades. */
.segmented::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: 4px;
  bottom: 4px;
  left: 4px;
  width: calc(50% - 4px);
  border-radius: 999px;
  background: var(--brand);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
  transition: transform 0.2s ease;
}

.segmented[data-picked='AGENCY_MEMBER']::before {
  transform: translateX(100%);
}

.segment {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 0.5rem;
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
}

/* Visually hidden, not removed. Styled buttons would look identical and lose
   arrow-key selection, the focus ring, and what a screen reader announces. */
.segment input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.segment-title {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  color: var(--ink-2);
  transition: color 0.2s ease;
}

.segment.picked .segment-title {
  color: #fff;
}

/* Keyboard users need to see where they are; the thumb alone does not say
   which half has focus. */
.segment input:focus-visible + .segment-title {
  outline: 2px solid var(--brand-mid);
  outline-offset: 4px;
  border-radius: 4px;
}

.segment-hint {
  margin: 0.5rem 0 0;
  font: 12px/1.5 var(--font-display);
  color: var(--ink-3);
  min-height: 1.1rem;
}

@media (prefers-reduced-motion: reduce) {
  .segmented::before {
    transition: none;
  }
}
</style>

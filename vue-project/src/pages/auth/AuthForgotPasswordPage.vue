<template>
  <AuthShell>
    <AuthHeader />

    <AuthCard>
      <!-- Step 1: Enter email -->
      <template v-if="step === 'email'">
        <AuthCardTitle
          :title="$t('auth.forgot.title')"
          :subtitle="$t('auth.forgot.subtitle')"
        />

        <form class="auth-form" @submit.prevent="onSendCode">
          <AuthInput
            v-model="email"
            :label="$t('auth.fields.email')"
            :placeholder="$t('auth.fields.emailPlaceholder')"
            type="email"
            required
          >
            <template #icon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                <rect x="2" y="4" width="20" height="16" rx="2" />
              </svg>
            </template>
          </AuthInput>

          <p v-if="formError" class="error">{{ formError }}</p>

          <ButtonMain
            :label="$t('auth.forgot.cta')"
            variant="main"
            type="submit"
            class="auth-submit-btn"
            :loading="isLoading"
            :disabled="!email"
          />
        </form>
      </template>

      <!-- Step 2: Enter code + new password -->
      <template v-else-if="step === 'code'">
        <AuthCardTitle
          :title="$t('auth.forgot.codeTitle') || 'Enter Code'"
          :subtitle="$t('auth.forgot.sentSubtitle') || 'We sent a verification code to your email'"
        />

        <form class="auth-form" @submit.prevent="onConfirmReset">
          <div class="code-field">
            <label class="code-label">{{ $t('auth.forgot.codeLabel') || 'Verification Code' }}</label>
            <input
              v-model="code"
              type="text"
              inputmode="numeric"
              maxlength="6"
              class="code-input"
              :placeholder="'000000'"
              required
            />
          </div>

          <AuthInput
            v-model="newPassword"
            :label="$t('auth.fields.newPassword') || 'New Password'"
            :placeholder="$t('auth.fields.passwordPlaceholder')"
            type="password"
            required
          >
            <template #icon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </template>
          </AuthInput>

          <AuthInput
            v-model="confirmPassword"
            :label="$t('auth.fields.confirmPassword') || 'Confirm Password'"
            :placeholder="$t('auth.fields.passwordPlaceholder')"
            type="password"
            required
          >
            <template #icon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </template>
          </AuthInput>

          <p v-if="formError" class="error">{{ formError }}</p>

          <ButtonMain
            :label="$t('auth.reset.cta') || 'Reset Password'"
            variant="main"
            type="submit"
            class="auth-submit-btn"
            :loading="isLoading"
            :disabled="!code || !newPassword"
          />

          <button type="button" class="resend-btn" @click="onResendCode" :disabled="isLoading">
            {{ $t('auth.forgot.resend') || 'Resend code' }}
          </button>
        </form>
      </template>

      <!-- Step 3: Success -->
      <template v-else>
        <AuthCardTitle
          :title="$t('auth.reset.successTitle') || 'Password Reset'"
          :subtitle="$t('auth.reset.successSubtitle') || 'Your password has been reset successfully'"
        />
        <div class="success-message">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="success-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p class="success-text">{{ $t('auth.reset.successMessage') || 'You can now log in with your new password.' }}</p>
        </div>
      </template>

      <template #footer>
        <RouterLink class="card-footer-link" :to="{ name: 'login', params: { lang } }">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          {{ $t('auth.forgot.backToLogin') }}
        </RouterLink>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup>
import { computed, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthHeader from "@/components/auth/AuthHeader.vue";
import AuthCardTitle from "@/components/auth/AuthCardTitle.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { requestPasswordReset, confirmPasswordReset } from "@/services/auth.service";
import { getErrorMessage } from "@/services/apiError";

const { t } = useI18n();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');

const step = ref('email'); // 'email' | 'code' | 'done'
const email = ref("");
const code = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);
const formError = ref("");

async function onSendCode() {
  formError.value = "";
  isLoading.value = true;
  try {
    await requestPasswordReset(email.value);
    step.value = 'code';
  } catch (e) {
    formError.value = getErrorMessage(e) || t('auth.forgot.error');
  } finally {
    isLoading.value = false;
  }
}

async function onResendCode() {
  formError.value = "";
  isLoading.value = true;
  try {
    await requestPasswordReset(email.value);
    formError.value = ""; // clear any previous error
  } catch (e) {
    formError.value = getErrorMessage(e) || t('auth.forgot.error');
  } finally {
    isLoading.value = false;
  }
}

async function onConfirmReset() {
  formError.value = "";

  if (newPassword.value.length < 8) {
    formError.value = t('auth.reset.minLength') || 'Password must be at least 8 characters';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    formError.value = t('auth.reset.mismatch') || 'Passwords do not match';
    return;
  }

  isLoading.value = true;
  try {
    await confirmPasswordReset(email.value, code.value, newPassword.value);
    step.value = 'done';
  } catch (e) {
    formError.value = getErrorMessage(e) || t('auth.forgot.invalidCode') || 'Invalid or expired code';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style>
@import "@/assets/styles/auth/auth.css";
</style>

<style scoped>
.auth-submit-btn { width: 100%; justify-content: center; }
.card-footer-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--neutral-500);
  text-decoration: none;
  transition: color 0.2s ease;
}
.card-footer-link:hover { color: var(--brand-gold); }
.error {
  color: var(--error, #e53935);
  font-size: 13px;
  margin: 0 0 8px;
}
.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  text-align: center;
}
.success-icon {
  color: var(--brand-gold, #c9a96e);
}
.success-text {
  font-size: 14px;
  color: var(--neutral-600, #666);
  line-height: 1.5;
  margin: 0;
}

/* Code input */
.code-field {
  display: grid;
  gap: 8px;
}
.code-label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(51, 67, 56, 0.75);
}
.code-input {
  width: 100%;
  border: 1px solid var(--neutral-300);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.5em;
  text-align: center;
  color: var(--neutral-900);
  background: color-mix(in srgb, var(--bg-main, #f8f6f1) 30%, transparent);
  outline: none;
  transition: border-color 0.2s;
}
.code-input:focus {
  border-color: var(--brand-gold, #c9a96e);
  box-shadow: 0 0 0 3px rgba(200, 162, 77, 0.15);
}
.code-input::placeholder {
  color: var(--neutral-300);
  letter-spacing: 0.5em;
}

.resend-btn {
  display: block;
  width: 100%;
  padding: 8px;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-500);
  cursor: pointer;
  font-family: inherit;
  transition: color 0.15s;
}
.resend-btn:hover { color: var(--brand-gold); }
.resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

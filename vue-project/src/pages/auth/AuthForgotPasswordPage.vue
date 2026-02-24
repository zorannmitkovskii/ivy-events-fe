<template>
  <AuthShell>
    <AuthHeader />

    <AuthCard>
      <AuthCardTitle
        :title="$t('auth.forgot.title')"
        :subtitle="sent ? $t('auth.forgot.sentSubtitle') : $t('auth.forgot.subtitle')"
      />

      <div v-if="sent" class="success-message">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="success-icon">
          <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
        </svg>
        <p class="success-text">{{ $t('auth.forgot.sentMessage') }}</p>
      </div>

      <form v-else class="auth-form" @submit.prevent="onSendResetLink">
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
import { requestPasswordReset } from "@/services/auth.service";

const { t } = useI18n();
const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
const email = ref("");
const isLoading = ref(false);
const formError = ref("");
const sent = ref(false);

async function onSendResetLink() {
  formError.value = "";
  isLoading.value = true;
  try {
    await requestPasswordReset(email.value);
    sent.value = true;
  } catch (e) {
    formError.value = e?.response?.data?.message || e?.message || t('auth.forgot.error');
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
</style>

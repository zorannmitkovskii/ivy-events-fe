<template>
  <AuthShell>
    <AuthHeader />

    <AuthCard>
      <AuthCardTitle
        :title="$t('auth.reset.title')"
        :subtitle="$t('auth.reset.subtitle')"
      />

      <form class="auth-form" @submit.prevent="onReset">
        <AuthInput
          v-model="password"
          :label="$t('auth.fields.newPassword')"
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
          :label="$t('auth.fields.confirmPassword')"
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

        <p v-if="formError" class="auth-error">{{ formError }}</p>

        <ButtonMain
          :label="isLoading ? 'Saving...' : $t('auth.reset.cta')"
          variant="main"
          type="submit"
          class="auth-submit-btn"
          :loading="isLoading"
          :disabled="isLoading"
        />
      </form>

      <template #footer>
        <RouterLink class="card-footer-link" :to="{ name: 'login', params: { lang } }">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
          </svg>
          {{ $t('auth.reset.backToLogin') }}
        </RouterLink>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthHeader from "@/components/auth/AuthHeader.vue";
import AuthCardTitle from "@/components/auth/AuthCardTitle.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { changePassword, loginWithCredentials, getEventId, hasRole } from "@/services/auth.service";
import { setEventId } from "@/store/onboarding.store";

const route = useRoute();
const router = useRouter();
const lang = computed(() => route.params.lang || 'mk');
const password = ref("");
const confirmPassword = ref("");
const isLoading = ref(false);
const formError = ref("");
const isTempFlow = ref(false);

onMounted(() => {
  isTempFlow.value = route.query.temp === '1';
});

async function onReset() {
  formError.value = "";

  if (password.value.length < 8) {
    formError.value = "Password must be at least 8 characters";
    return;
  }
  if (password.value !== confirmPassword.value) {
    formError.value = "Passwords do not match";
    return;
  }

  if (isTempFlow.value) {
    const tempEmail = sessionStorage.getItem("temp_email");
    const tempPassword = sessionStorage.getItem("temp_password");
    if (!tempEmail || !tempPassword) {
      formError.value = "Session expired. Please log in again.";
      return;
    }

    isLoading.value = true;
    try {
      await changePassword(tempEmail, tempPassword, password.value);
      sessionStorage.removeItem("temp_email");
      sessionStorage.removeItem("temp_password");

      // Log in with new password
      await loginWithCredentials(tempEmail, password.value);
      setEventId(getEventId());

      if (hasRole('ADMIN')) {
        await router.push(`/${lang.value}/admin/events`);
      } else {
        await router.push({ name: 'dashboard.overview', params: { lang: lang.value } });
      }
    } catch (e) {
      formError.value = e?.message || "Failed to change password";
    } finally {
      isLoading.value = false;
    }
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
</style>
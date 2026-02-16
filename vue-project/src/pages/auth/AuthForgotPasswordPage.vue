<template>
  <AuthShell>
    <AuthHeader />

    <AuthCard>
      <AuthCardTitle
        :title="$t('auth.forgot.title')"
        :subtitle="$t('auth.forgot.subtitle')"
      />

      <form class="auth-form" @submit.prevent="onSendResetLink">
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

        <ButtonMain
          :label="$t('auth.forgot.cta')"
          variant="main"
          type="submit"
          class="auth-submit-btn"
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
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthHeader from "@/components/auth/AuthHeader.vue";
import AuthCardTitle from "@/components/auth/AuthCardTitle.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
const email = ref("");

function onSendResetLink() {
  console.log("send reset link to", email.value);
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

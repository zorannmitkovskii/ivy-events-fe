<template>
  <AuthShell>
    <AuthCard>
      <AuthHeader :title="$t('auth.brand')" />

      <AuthCardTitle
        :title="$t('auth.forgot.title')"
        :subtitle="$t('auth.forgot.subtitle')"
      />
      <form class="auth-form">
        <AuthInput
          v-model="email"
          :label="$t('auth.fields.email')"
          :placeholder="$t('auth.fields.emailPlaceholder')"
          type="email"
          required
        >
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
              <rect x="2" y="4" width="20" height="16" rx="2"></rect>
            </svg>
          </template>
        </AuthInput>

        <ButtonMain
          :label="$t('auth.forgot.cta')"
          to="#"
          variant="main"
          @click.prevent="onSendResetLink"
        />
      </form>

      <div class="auth-links mt-4">
        <RouterLink class="link ml-2" to="/auth/login">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="10 3 14 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="arrow-left" aria-hidden="true" class="lucide lucide-arrow-left w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
          {{ $t('auth.forgot.backToLogin') }}
        </RouterLink>
      </div>
    </AuthCard>
  </AuthShell>
</template>

<script setup>
import { ref } from "vue";
import { RouterLink } from "vue-router";
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthHeader from "@/components/auth/AuthHeader.vue";
import AuthCardTitle from "@/components/auth/AuthCardTitle.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const email = ref("");

function onSendResetLink() {
  console.log("send reset link to", email.value);
}
</script>

<style scoped>
.auth-links {
  margin-top: 14px;
  text-align: center;
}

.link {
  color: var(--brand-main);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
</style>

<template>
  <AuthShell>
    <AuthCard>
      <AuthHeader :title="$t('auth.brand')"/>

      <AuthCardTitle
        :title="$t('auth.reset.title')"
        :subtitle="$t('auth.reset.subtitle')"
      />

      <form class="auth-form">
        <AuthInput
          v-model="password"
          :label="$t('auth.fields.newPassword')"
          :placeholder="$t('auth.fields.passwordPlaceholder')"
          type="password"
          required
        >
          <template #icon>🔒</template>
        </AuthInput>

        <AuthInput
          v-model="confirmPassword"
          :label="$t('auth.fields.confirmPassword')"
          :placeholder="$t('auth.fields.passwordPlaceholder')"
          type="password"
          required
        >
          <template #icon>✅</template>
        </AuthInput>

        <ButtonMain
          :label="$t('auth.reset.cta')"
          to="#"
          variant="main"
          @click.prevent="onReset"
        />
      </form>

      <div class="auth-links">
        <RouterLink class="link" to="/login">
          {{ $t('auth.reset.backToLogin') }}
        </RouterLink>
      </div>
    </AuthCard>
  </AuthShell>
</template>

<script setup>
import {ref} from "vue";
import {RouterLink} from "vue-router";
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthHeader from "@/components/auth/AuthHeader.vue";
import AuthCardTitle from "@/components/auth/AuthCardTitle.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import ButtonMain from "@/components/generic/ButtonMain.vue";

const password = ref("");
const confirmPassword = ref("");

function onReset() {
  console.log("reset password", password.value, confirmPassword.value);
}
</script>

<style scoped>
.auth-links {
  margin-top: 14px;
  text-align: center;
}

.link {
  color: var(--brand-main);
  font-weight: 700;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>

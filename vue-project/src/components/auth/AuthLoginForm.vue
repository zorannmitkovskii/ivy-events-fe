<template>
  <form class="auth-form" @submit.prevent="onSubmit">
    <AuthInput v-model="email" :label="$t('auth.fields.email')" placeholder="" type="email" required>
      <template #icon>✉️</template>
    </AuthInput>

    <AuthInput v-model="password" :label="$t('auth.fields.password')" placeholder="" type="password" required>
      <template #icon>🔒</template>
    </AuthInput>

    <div class="auth-row">
      <RouterLink class="auth-link" to="/forgot-password">
        {{ $t('auth.login.forgotPassword') }}
      </RouterLink>
    </div>

    <button class="btn btn-main auth-submit" type="submit">
      {{ $t('auth.login.signIn') }}
    </button>

    <AuthDivider :text="$t('auth.common.orContinue')" />

    <GoogleButton @click="onGoogle">
      {{ $t('auth.common.continueWithGoogle') }}
    </GoogleButton>
  </form>
</template>
<script setup lang="ts">
import AuthDivider from "@/components/auth/AuthDivider.vue";
import AuthInput from "@/components/auth/AuthInput.vue";
import GoogleButton from "@/components/auth/GoogleButton.vue";
</script>

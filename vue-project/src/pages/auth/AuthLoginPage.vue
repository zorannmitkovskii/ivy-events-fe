<template>
  <AuthShell>
    <AuthCard>
      <AuthHeader
        icon="gift"
        title="Welcome Back"
        subtitle="Sign in to continue planning your perfect event"
      />

      <AuthLoginForm />

      <AuthFooterLinks
        :primary="{ text: `Don't have an account?`, linkText: 'Create account', to: '/register' }"
        :legal="true"
      />
    </AuthCard>
  </AuthShell>
</template>

<script setup>
import AuthShell from "@/components/auth/AuthShell.vue";
import AuthCard from "@/components/auth/AuthCard.vue";
import AuthHeader from "@/components/auth/AuthHeader.vue";
import AuthFooterLinks from "@/components/auth/AuthFooterLinks.vue";
import AuthLoginForm from "@/components/auth/AuthLoginForm.vue";
</script>

<style>
@import "@/assets/styles/auth.css";
</style>

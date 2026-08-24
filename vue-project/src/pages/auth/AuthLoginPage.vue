<template>
  <AuthShell>
    <AuthCard>
      <AuthCardTitle
        :eyebrow="$t('auth.login.eyebrow')"
        :title="$t('auth.login.heading')"
        :subtitle="$t('auth.login.subtitle')"
      />

      <AuthLoginForm />

      <template #footer>
        {{ $t('auth.login.noAccount') }}
        <RouterLink :to="{ name: 'signup', params: { lang } }">
          {{ $t('auth.login.createAccount') }}
        </RouterLink>
      </template>
    </AuthCard>
  </AuthShell>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AuthShell from '@/components/auth/AuthShell.vue';
import AuthCard from '@/components/auth/AuthCard.vue';
import AuthCardTitle from '@/components/auth/AuthCardTitle.vue';
import AuthLoginForm from '@/components/auth/AuthLoginForm.vue';

const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
</script>

<style>
@import "@/assets/styles/auth/auth.css";
</style>

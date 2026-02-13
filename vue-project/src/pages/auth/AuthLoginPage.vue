<template>
  <AuthShell>
    <AuthHeader />

    <AuthCard>
      <AuthCardTitle
        :title="$t('auth.login.title')"
        :subtitle="$t('auth.login.subtitle')"
      />

      <AuthLoginForm />

      <template #footer>
        <RouterLink class="card-footer-link" :to="{ name: 'signup', params: { lang } }">
          {{ $t('auth.login.noAccount') }}
          <strong>{{ $t('auth.login.createAccount') }}</strong>
        </RouterLink>
      </template>
    </AuthCard>

    <footer class="page-footer">
      <span class="page-footer__link">{{ $t('auth.common.privacy') }}</span>
      <span class="page-footer__dot"></span>
      <span class="page-footer__link">Help Center</span>
    </footer>
  </AuthShell>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AuthShell from '@/components/auth/AuthShell.vue';
import AuthCard from '@/components/auth/AuthCard.vue';
import AuthHeader from '@/components/auth/AuthHeader.vue';
import AuthCardTitle from '@/components/auth/AuthCardTitle.vue';
import AuthLoginForm from '@/components/auth/AuthLoginForm.vue';

const route = useRoute();
const lang = computed(() => route.params.lang || 'mk');
</script>

<style>
@import "@/assets/styles/auth/auth.css";
</style>

<style scoped>
.card-footer-link {
  font-size: 13px;
  color: var(--neutral-500);
  text-decoration: none;
  transition: color 0.2s ease;
}
.card-footer-link strong {
  color: var(--brand-gold);
  font-weight: 600;
}
.card-footer-link:hover {
  color: var(--brand-main);
}

.page-footer {
  margin-top: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.page-footer__link {
  font-size: 12px;
  color: var(--neutral-500);
  cursor: pointer;
  transition: color 0.2s ease;
}
.page-footer__link:hover {
  color: var(--brand-main);
}
.page-footer__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--neutral-300);
}
</style>

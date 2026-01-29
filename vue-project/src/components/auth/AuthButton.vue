<template>
  <AuthShell>
    <AuthCard>
      <AuthHeader
        :title="$t('auth.login.title')"
        :subtitle="$t('auth.login.subtitle')"
      />

      <LoginForm />

      <AuthFooterLinks
        :primary="{
          text: $t('auth.login.noAccount'),
          linkText: $t('auth.login.createAccount'),
          to: '/register'
        }"
        :legal="true"
      />
    </AuthCard>
  </AuthShell>
</template>

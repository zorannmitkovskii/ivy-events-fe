<template>
  <header class="navbar">
    <div class="container">
      <div class="navbar__brand">
        <slot name="brand">
          <span>ivy.events</span>
        </slot>
      </div>
      <nav class="navbar__links">
        <slot name="links">
          <NavLinks :links="defaultLinks" />
        </slot>
      </nav>
      <div class="navbar__cta">
        <slot name="cta">
          <AppButton variant="outline" size="sm">Sign in</AppButton>
          <AppButton size="sm">Get Started</AppButton>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup>
import NavLinks from '@/components/ui/NavLinks.vue'
import AppButton from '@/components/ui/AppButton.vue'

const defaultLinks = [
  { label: 'Home', to: '/' },
  { label: 'Templates', to: '/templates' },
  { label: 'Pricing', to: '/pricing' },
]
</script>

<style scoped>
@import '@/assets/styles/variables.css';
@import '@/assets/styles/navbar.css';
</style>

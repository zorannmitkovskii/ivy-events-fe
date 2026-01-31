<template>
  <div class="footer-links">
    <RouterLink class="link" :to="{ name: 'home' }">
      {{ $t('onboarding.footer.help') }}
    </RouterLink>
    <span class="sep">•</span>
    <RouterLink class="link" :to="{ name: 'home' }">
      {{ $t('onboarding.footer.privacy') }}
    </RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
</script>

<style scoped>
.footer-links {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  font-size: 11px;
  color: rgba(51, 67, 56, 0.55);
}

.link {
  text-decoration: none;
  color: rgba(51, 67, 56, 0.55);
}

.link:hover {
  color: var(--brand-main);
  text-decoration: underline;
}

.sep {
  opacity: 0.6;
}
</style>

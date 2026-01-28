<template>
  <div class="actions desktop-actions">
    <ButtonMain
      :label="$t('header.actions.signIn')"
      to="/login"
      variant="outline"
    />
    <ButtonMain
      :label="$t('pricing.cta.getStarted')"
      to="/register"
      variant="main"
    />
  </div>
</template>

<script setup>
import ButtonMain from "@/components/generic/ButtonMain.vue";
</script>

<style scoped>
.actions {
  display: flex;
  gap: 12px;
}
</style>

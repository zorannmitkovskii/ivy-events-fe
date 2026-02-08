<template>
  <div class="actions desktop-actions">
    <ButtonMain
      :label="$t('header.actions.signIn')"
      :to="{ name: 'login', params: { lang } }"
      variant="outline"
    />
    <ButtonMain
      :label="$t('pricing.cta.getStarted')"
      :to="{ name: 'signup', params: { lang } }"
      variant="main"
    />
  </div>
</template>

<script setup>
import ButtonMain from "@/components/generic/ButtonMain.vue";
import { useRoute } from "vue-router";
const route = useRoute();
const lang = route.params.lang || "mk";
</script>

<style scoped>
.actions {
  display: flex;
  gap: 12px;
}
</style>

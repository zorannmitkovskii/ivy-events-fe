<template>
  <div class="dash-page">
    <div class="dash-page-header">
      <div class="page-eyebrow">{{ t("sidebar.navigation") }}</div>
      <h1 class="dash-page-title">{{ t("team.title") }}</h1>
      <p class="dash-page-subtitle">{{ t("team.subtitle") }}</p>
    </div>

    <div class="d-card d-card-pad placeholder">
      {{ t("team.placeholder") }}
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<style scoped>
.d-card {
  background: var(--dash-cream-card);
  border-radius: var(--dash-radius);
  border: 1px solid var(--dash-cream-border);
  box-shadow: var(--dash-shadow-sm);
}
.d-card-pad { padding: 24px; }
.placeholder {
  color: var(--dash-muted);
  font-size: 13px;
  text-align: center;
  padding: 48px 24px;
}
</style>

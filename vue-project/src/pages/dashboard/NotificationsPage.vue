<template>
  <div class="dash-page">
    <PageHeader :title="t('sidebar.notifications')" :subtitle="t('notifications.subtitle')" />
    <div class="d-card d-card-pad placeholder">
      {{ t("notifications.placeholder") }}
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
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

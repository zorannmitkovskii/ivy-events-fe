<template>
  <div class="ov-header">
    <div>
      <h1 class="ov-title">{{ event.name }}</h1>

      <div class="ov-subline">
        <span>📅 {{ event.date }}</span>
        <span>•</span>
        <span>{{ event.daysLeft }} {{ t("overview.daysToGo") }}</span>
        <span class="pill-status">{{ event.status }}</span>
      </div>
    </div>

    <div class="ov-actions">
      <button class="btn-outline">✉ {{ t("overview.editInvitation") }}</button>
      <button class="btn-outline">👥 {{ t("overview.manageGuests") }}</button>
      <button class="btn btn-primary">➤ {{ t("overview.sendUpdate") }}</button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
defineProps({ event: Object });
const { t } = useI18n();
</script>

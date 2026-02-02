<template>
  <div class="row">
    <div>
      <h1 class="h1">{{ t("agenda.title") }}</h1>
      <div class="sub">{{ t("agenda.subtitle") }}</div>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <div class="card" style="padding:6px; border-radius:999px; box-shadow:none;">
        <button class="btn btn-ghost" style="border:none; padding:8px 12px;">{{ t("agenda.dayView") }}</button>
        <button class="btn btn-ghost" style="border:none; padding:8px 12px; opacity:.6;">{{ t("agenda.multiDay") }}</button>
      </div>

      <button class="btn btn-ghost">{{ t("agenda.templates") }}</button>
      <button class="btn btn-primary" @click="$emit('add')">{{ t("agenda.addItem") }}</button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
defineEmits(["add"]);
</script>

<template>
  <div class="row">
    <div>
      <h1 class="h1">{{ t("guests.title") }}</h1>
      <div class="sub">{{ t("guests.subtitle") }}</div>
    </div>

    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="btn btn-primary" @click="$emit('add')">{{ t("guests.addGuest") }}</button>
      <button class="btn btn-soft" @click="$emit('import')">{{ t("guests.importGuests") }}</button>
      <button class="btn btn-soft" @click="$emit('remind')">{{ t("guests.sendReminder") }}</button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
defineEmits(["add", "import", "remind"]);
</script>

<template>
  <div class="ov-banner">
    <div class="bicon">&#128276;</div>
    <div>
      <div style="font-weight:600; font-size:15px;">{{ t("overview.onTrackTitle") }}</div>
      <div style="color: rgba(255,255,255,0.7); margin-top:4px; font-size:13px;">
        {{ message }}
      </div>
    </div>
    <router-link :to="tasksLink" class="banner-btn">{{ t("overview.viewTimeline") }}</router-link>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();
const lang = computed(() => route.params.lang || "mk");
const tasksLink = computed(() => `/${lang.value}/dashboard/events/tasks`);

defineProps({ percent: Number, message: String });
</script>

<style scoped>
.banner-btn {
  background: linear-gradient(135deg, var(--dash-gold), #9a7a3e);
  border: none;
  color: #fff;
  border-radius: 9px;
  padding: 10px 18px;
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
  font-size: 12.5px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.18s;
}

.banner-btn:hover {
  box-shadow: 0 4px 16px rgba(184, 149, 78, 0.5);
  transform: translateY(-1px);
}
</style>

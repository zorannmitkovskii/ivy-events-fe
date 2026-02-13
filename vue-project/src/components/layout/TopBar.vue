<template>
  <header class="top">
    <div class="left">
      <div class="title">{{ title }}</div>
      <div class="sub">{{ subtitle }}</div>
    </div>

    <div class="right">
      <!-- slot later: invite/manage/upgrade buttons -->
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const title = computed(() => {
  const map: Record<string, string> = {
    "dashboard.overview": "Overview",
    "dashboard.guests": "Guests",
    "dashboard.tables": "Tables & Seating",
    "dashboard.agenda": "Event Agenda",
    "dashboard.gallery": "Gallery",
    "dashboard.notifications": "Notifications",
    "dashboard.team": "Team & Co-hosts",
    "dashboard.settings": "Event Settings",
  };
  return map[String(route.name)] ?? "Dashboard";
});
const subtitle = computed(() => "");
</script>

<style scoped>
.top {
  height: var(--header-height);
  background: var(--bg-white);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
}
.title {
  font-family: var(--font-family);
  font-size: 22px;
  color: var(--neutral-900);
}
.sub {
  font-size: 12px;
  color: var(--neutral-700);
  margin-top: 2px;
}
</style>

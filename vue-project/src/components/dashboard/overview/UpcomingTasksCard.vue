<template>
  <div class="card card-pad-lg">
    <div class="row" style="justify-content:space-between;">
      <div style="font-weight:900;">{{ t("overview.upcomingTasks") }}</div>
      <a class="kpi-sub" style="text-decoration:none; font-weight:800; cursor:pointer;">
        {{ t("overview.viewAllTasks") }} →
      </a>
    </div>

    <div style="margin-top:14px;">
      <TaskItem v-for="task in tasks" :key="task.id" :task="task" />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import TaskItem from "./TaskItem.vue";
defineProps({ tasks: Array });
const { t } = useI18n();
</script>

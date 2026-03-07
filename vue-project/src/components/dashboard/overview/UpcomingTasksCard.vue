<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">{{ t("overview.upcomingTasks") }}</div>
      <router-link :to="tasksLink" class="card-action">{{ t("overview.viewAllTasks") }} &rarr;</router-link>
    </div>

    <div style="margin-top:8px;">
      <div v-for="task in tasks" :key="task.id" class="task-item">
        <div class="task-checkbox" :class="{ done: task.done }">
          <span v-if="task.done">&#10003;</span>
        </div>
        <div class="task-body">
          <div class="task-name" :class="{ 'done-text': task.done }">{{ task.title }}</div>
          <div class="task-due">{{ task.due }}</div>
        </div>
        <span v-if="task.priority" class="task-priority" :class="priorityClass(task.priority)">
          {{ task.priority }}
        </span>
      </div>
    </div>

    <div style="margin-top:16px;">
      <router-link :to="tasksLink + '?action=add'" class="add-task-btn">
        + {{ t("sidebar.addTask") }}
      </router-link>
    </div>
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

defineProps({ tasks: Array });

function priorityClass(p) {
  const lower = (p || "").toLowerCase();
  if (lower === "high" || lower === "висок") return "pri-high";
  if (lower === "medium" || lower === "среден") return "pri-med";
  return "pri-low";
}
</script>

<style scoped>
.add-task-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 9px;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--dash-ink);
  text-decoration: none;
  transition: all 0.18s;
  background: transparent;
}

.add-task-btn:hover {
  border-color: var(--dash-sage-light);
  color: var(--dash-sage-dark);
}
</style>

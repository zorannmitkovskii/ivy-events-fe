<template>
  <div class="task-row">
    <input type="checkbox" class="chk" />

    <div>
      <div class="title">{{ task.title }}</div>
      <div class="note">{{ task.note }}</div>
    </div>

    <span class="due-pill" :class="dueClass">{{ task.due }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({ task: Object });

const dueClass = computed(() => {
  const d = String(props.task?.due || "").toLowerCase();
  if (d.includes("today") || d.includes("overdue")) return "due-today";
  if (d.includes("tomorrow")) return "due-tomorrow";
  return "due-soon";
});
</script>

<style scoped>
.chk {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: var(--dash-sage);
}

.title {
  font-weight: 500;
  color: var(--dash-ink);
  font-size: 13px;
}

.note {
  color: var(--dash-light);
  font-size: 11px;
  margin-top: 2px;
}
</style>

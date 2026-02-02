<template>
  <div class="task-row">
    <input type="checkbox" class="chk" />

    <div>
      <div class="title">{{ task.title }}</div>
      <div class="kpi-sub" style="margin-top:4px;">{{ task.note }}</div>
    </div>

    <span class="due-pill" :class="dueClass">{{ task.due }}</span>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({ task: Object });

const dueClass = computed(() => {
  const d = String(props.task?.due || "").toLowerCase();
  if (d.includes("today")) return "due-today";
  if (d.includes("tomorrow")) return "due-tomorrow";
  return "due-soon";
});
</script>

<style scoped>
.chk{
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: var(--brand-main);
}
.title{ font-weight: 900; color: var(--neutral-900); font-size: 14px; }
</style>

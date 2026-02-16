<template>
  <span class="pill" :class="cls">{{ label }}</span>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({
  status: { type: String, default: "pending" }, // confirmed|pending
  label: { type: String, default: "" }
});
const cls = computed(() => (props.status === "confirmed" ? "ok" : "wait"));
</script>

<style scoped>
.pill{
  display: inline-block;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.ok{ background: rgba(191,210,164,0.45); color: var(--brand-main); }
.wait{ background: #fef9c3; color: #854d0e; }
</style>

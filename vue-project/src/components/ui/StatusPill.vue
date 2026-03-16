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
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.ok{ background: var(--dash-sage-ghost, rgba(241,246,238,1)); color: var(--dash-sage, #5a7a52); }
.wait{ background: var(--dash-gold-pale, #f5ead4); color: #8a6a30; }
</style>

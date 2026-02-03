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
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 900;
  border: 1px solid rgba(0,0,0,0.06);
}
.ok{ background: rgba(191,210,164,0.42); color: #1f2a24; }
.wait{ background: rgba(200,162,77,0.22); color: #5a4410; }
</style>

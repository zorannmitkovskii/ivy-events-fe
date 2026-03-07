<template>
  <div class="stat-card">
    <div class="stat-card-accent" :class="accentClass"></div>
    <div class="stat-icon-wrap" :class="iconClass">{{ icon }}</div>
    <div class="stat-value">{{ formattedValue }}</div>
    <div class="stat-label">{{ title }}</div>
    <div class="stat-sub">
      <span v-if="meta?.length">
        {{ meta.map(m => `${m.value} ${m.label}`).join(' · ') }}
      </span>
      <span v-else-if="subtext">{{ subtext }}</span>
      <span v-if="badge" class="stat-badge" :class="badgeClass">{{ badge }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: String,
  value: [String, Number],
  icon: { type: String, default: "" },
  accent: { type: String, default: "sage" },
  meta: Array,
  subtext: String,
  badge: String,
  badgeType: { type: String, default: "up" }
});

const accentClass = computed(() => `accent-${props.accent}`);
const iconClass = computed(() => `ic-${props.accent}`);
const badgeClass = computed(() => `badge-${props.badgeType}`);

const formattedValue = computed(() => {
  const v = props.value;
  if (v == null) return "0";
  return String(v);
});
</script>

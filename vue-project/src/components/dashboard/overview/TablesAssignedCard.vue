<template>
  <div class="card">
    <div class="card-header">
      <div class="card-title">{{ t("overview.tablesAssigned") }}</div>
      <router-link :to="tablesLink" class="card-action">{{ t("overview.viewDetails") }} &rarr;</router-link>
    </div>

    <div class="seating-visual">
      <div v-for="(tbl, i) in displayTables" :key="i" class="table-visual-row">
        <div class="table-name">{{ tbl.name }}</div>
        <div class="table-capacity-bar">
          <div class="tcb-fill" :style="{ width: tbl.pct + '%', background: tbl.gradient }"></div>
        </div>
        <div class="table-count">{{ tbl.assigned }}/{{ tbl.max }}</div>
      </div>
    </div>

    <div class="mini-stats">
      <div class="mini-stat">
        <div class="mini-stat-num" style="color: var(--dash-sage);">{{ assignedGuests }}</div>
        <div class="mini-stat-lbl">{{ t("overview.seated") }}</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat-num" style="color: var(--dash-blush);">{{ unseated }}</div>
        <div class="mini-stat-lbl">{{ t("overview.unseated") }}</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat-num">{{ total }}</div>
        <div class="mini-stat-lbl">{{ t("overview.tables") }}</div>
      </div>
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
const tablesLink = computed(() => `/${lang.value}/dashboard/events/tables`);

const props = defineProps({
  assigned: Number,
  total: Number,
  assignedGuests: { type: Number, default: 0 },
  totalGuests: { type: Number, default: 0 },
  tables: { type: Array, default: () => [] }
});

const unseated = computed(() => Math.max((props.totalGuests || 0) - (props.assignedGuests || 0), 0));

const GRADIENTS = [
  "linear-gradient(90deg, var(--dash-sage-light), var(--dash-sage))",
  "linear-gradient(90deg, var(--dash-sage-light), var(--dash-sage))",
  "linear-gradient(90deg, var(--dash-gold-pale), var(--dash-gold))",
  "linear-gradient(90deg, var(--dash-gold-pale), var(--dash-gold))",
  "linear-gradient(90deg, #f5d0cc, var(--dash-blush))",
];

const displayTables = computed(() => {
  if (props.tables?.length) {
    return props.tables.slice(0, 6).map((tbl, i) => ({
      name: tbl.name || `Table ${i + 1}`,
      assigned: tbl.assignedGuests || 0,
      max: tbl.maxGuest || 10,
      pct: tbl.maxGuest ? Math.round((tbl.assignedGuests / tbl.maxGuest) * 100) : 0,
      gradient: GRADIENTS[i % GRADIENTS.length]
    }));
  }
  // Fallback display
  return [
    { name: t("overview.tableNum", { n: 1 }), assigned: 0, max: 10, pct: 0, gradient: GRADIENTS[0] },
    { name: t("overview.tableNum", { n: 2 }), assigned: 0, max: 10, pct: 0, gradient: GRADIENTS[1] },
  ];
});
</script>

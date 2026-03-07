<template>
  <div class="page">
    <!-- Hero Banner with countdown -->
    <OverviewHeader :event="event" :progress="overview.progress" />

    <!-- 4 Stat Cards -->
    <div class="stats-row">
      <StatCard
        :title="t('overview.totalGuests')"
        :value="overview.totalGuests"
        icon="&#128101;"
        accent="sage"
        :meta="overview.guestsMeta"
      />
      <StatCard
        :title="t('overview.budgetRemaining')"
        :value="budgetDisplay"
        icon="&euro;"
        accent="gold"
        :badge="budgetBadge"
        badge-type="warn"
      />
      <StatCard
        :title="t('overview.tablesSeated')"
        :value="tablesDisplay"
        icon="&#9638;"
        accent="blush"
        :badge="tablesBadge"
        badge-type="up"
      />
      <StatCard
        :title="t('overview.activeTasks')"
        :value="overview.tasks?.length || 0"
        icon="&#10003;"
        accent="sky"
        :subtext="tasksSub"
      />
    </div>

    <!-- Charts Row: Budget + RSVP donut -->
    <div class="charts-grid">
      <BudgetStatusCard :budget="overview.budget" />
      <RsvpSummaryCard :rsvp="overview.rsvp" />
    </div>

    <!-- Bottom Row: Tasks + Seating -->
    <div class="tasks-grid">
      <UpcomingTasksCard :tasks="overview.tasks" />
      <TablesAssignedCard
        :assigned="overview.tablesAssigned"
        :total="overview.tablesTotal"
        :assigned-guests="overview.assignedGuests"
        :total-guests="overview.totalGuests"
        :tables="overview.tablesRaw"
      />
    </div>

    <!-- Gallery preview -->
    <GalleryPreviewCard :images="overview.galleryImages" />

    <!-- Banner -->
    <OnTrackBanner
      :percent="overview.progress"
      :message="overview.progressMessage"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useOverview } from "@/composables/useOverview";

import OverviewHeader from "@/components/dashboard/overview/OverviewHeader.vue";
import StatCard from "@/components/dashboard/overview/StatCard.vue";
import BudgetStatusCard from "@/components/dashboard/overview/BudgetStatusCard.vue";
import RsvpSummaryCard from "@/components/dashboard/overview/RsvpSummaryCard.vue";
import UpcomingTasksCard from "@/components/dashboard/overview/UpcomingTasksCard.vue";
import TablesAssignedCard from "@/components/dashboard/overview/TablesAssignedCard.vue";
import GalleryPreviewCard from "@/components/dashboard/overview/GalleryPreviewCard.vue";
import OnTrackBanner from "@/components/dashboard/overview/OnTrackBanner.vue";

const { t } = useI18n();
const { event, overview } = useOverview();

const budgetDisplay = computed(() => {
  const b = overview.value.budget;
  if (!b) return "0";
  const currency = b.currency || "EUR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency, maximumFractionDigits: 0, minimumFractionDigits: 0,
      notation: b.remaining >= 1000 ? "compact" : "standard"
    }).format(b.remaining || 0);
  } catch { return `${b.remaining || 0}`; }
});

const budgetBadge = computed(() => {
  const b = overview.value.budget;
  if (!b || !b.total) return "";
  const pct = Math.round(((b.used || 0) / b.total) * 100);
  return `${pct}% ${t("overview.spent")}`;
});

const tablesDisplay = computed(() => {
  return `${overview.value.tablesAssigned || 0}/${overview.value.tablesTotal || 0}`;
});

const tablesBadge = computed(() => {
  const total = overview.value.tablesTotal || 0;
  const assigned = overview.value.tablesAssigned || 0;
  if (!total) return "";
  return `${Math.round((assigned / total) * 100)}% ${t("overview.seated")}`;
});

const tasksSub = computed(() => {
  const tasks = overview.value.tasks || [];
  const high = tasks.filter(t => (t.priority || "").toLowerCase() === "high").length;
  if (high > 0) return `${high} ${t("overview.highPriority")}`;
  return "";
});
</script>

<style src="@/assets/styles/dashboard.css"></style>

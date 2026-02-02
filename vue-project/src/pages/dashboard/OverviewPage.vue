<template>
  <div class="page">
    <OverviewHeader :event="event" />

    <div class="stats-grid">
      <StatCard
        :title="t('overview.totalGuests')"
        :value="overview.totalGuests"
        :meta="overview.guestsMeta"
      />

      <TablesAssignedCard
        :assigned="overview.tablesAssigned"
        :total="overview.tablesTotal"
      />

      <BudgetStatusCard :budget="overview.budget" />
    </div>

    <div class="bottom-grid">
      <RsvpSummaryCard :rsvp="overview.rsvp" />
      <UpcomingTasksCard :tasks="overview.tasks" />
    </div>

    <OnTrackBanner
      :percent="overview.progress"
      :message="overview.progressMessage"
    />
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { useOverview } from "@/composables/useOverview";

import OverviewHeader from "@/components/dashboard/overview/OverviewHeader.vue";
import StatCard from "@/components/dashboard/overview/StatCard.vue";
import TablesAssignedCard from "@/components/dashboard/overview/TablesAssignedCard.vue";
import BudgetStatusCard from "@/components/dashboard/overview/BudgetStatusCard.vue";
import RsvpSummaryCard from "@/components/dashboard/overview/RsvpSummaryCard.vue";
import UpcomingTasksCard from "@/components/dashboard/overview/UpcomingTasksCard.vue";
import OnTrackBanner from "@/components/dashboard/overview/OnTrackBanner.vue";
const { t } = useI18n();
const { event, overview } = useOverview();
</script>

<style src="@/assets/styles/dashboard.css"></style>

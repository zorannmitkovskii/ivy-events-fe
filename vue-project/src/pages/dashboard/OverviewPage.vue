<template>
  <div class="page">
    <OverviewHeader :event="event" />

    <!-- Hero Metrics -->
    <div class="hero-grid">
      <StatCard
        :title="t('overview.totalGuests')"
        :value="overview.totalGuests"
        :meta="overview.guestsMeta"
      />
      <BudgetStatusCard :budget="overview.budget" />
      <CountdownCard :target-date="event.rawDate" />
    </div>

    <!-- Details -->
    <div class="middle-grid">
      <RsvpSummaryCard :rsvp="overview.rsvp" />
      <TablesAssignedCard
        :assigned="overview.tablesAssigned"
        :total="overview.tablesTotal"
        :assigned-guests="overview.assignedGuests"
        :total-guests="overview.totalGuests"
      />
      <UpcomingTasksCard :tasks="overview.tasks" />
    </div>

    <!-- Gallery -->
    <GalleryPreviewCard :images="overview.galleryImages" />

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
import BudgetStatusCard from "@/components/dashboard/overview/BudgetStatusCard.vue";
import CountdownCard from "@/components/dashboard/overview/CountdownCard.vue";
import RsvpSummaryCard from "@/components/dashboard/overview/RsvpSummaryCard.vue";
import TablesAssignedCard from "@/components/dashboard/overview/TablesAssignedCard.vue";
import UpcomingTasksCard from "@/components/dashboard/overview/UpcomingTasksCard.vue";
import GalleryPreviewCard from "@/components/dashboard/overview/GalleryPreviewCard.vue";
import OnTrackBanner from "@/components/dashboard/overview/OnTrackBanner.vue";

const { t } = useI18n();
const { event, overview } = useOverview();
</script>

<style src="@/assets/styles/dashboard.css"></style>

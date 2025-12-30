<template>
  <AdminLayout v-model:page="activePage">
    <component :is="currentPageComponent" />
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from "vue";
import AdminLayout from "@/components/adminDashboard/AdminLayout.vue";
// import AdminLayout from "@/components/admin/AdminLayout.vue";

// Import all page components
// import DashboardPage from "@/components/admin/pages/DashboardPage.vue";
// import UsersPage from "@/components/admin/pages/UsersPage.vue";
// import VendorsPage from "@/components/admin/pages/VendorsPage.vue";
// import EventsPage from "@/components/admin/pages/EventsPage.vue";
// import BudgetsPage from "@/components/admin/pages/BudgetsPage.vue";
// import TasksPage from "@/components/admin/pages/TasksPage.vue";
// import ContentPage from "@/components/admin/pages/ContentPage.vue";
// import AnalyticsPage from "@/components/admin/pages/AnalyticsPage.vue";
// import NotificationsPage from "@/components/admin/pages/NotificationsPage.vue";
// import SettingsPage from "@/components/admin/pages/SettingsPage.vue";

const activePage = ref("Dashboard");

const pagesMap = {
  Dashboard: DashboardPage,
  Users: UsersPage,
  Vendors: VendorsPage,
  Events: EventsPage,
  "Budgets & Payments": BudgetsPage,
  "Tasks & Timeline": TasksPage,
  Content: ContentPage,
  Analytics: AnalyticsPage,
  Notifications: NotificationsPage,
  Settings: SettingsPage,
};

const currentPageComponent = computed(() => pagesMap[activePage.value]);
</script>

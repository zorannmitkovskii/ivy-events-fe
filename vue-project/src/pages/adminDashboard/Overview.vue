<template>
  <AdminLayout v-model:activePage="activePage">
    <component :is="currentPageComponent" />
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from "vue";
import AdminLayout from "@/components/adminDashboard/AdminLayout.vue";
import AdminDashboard from "@/components/adminDashboard/AdminDashboard.vue";

// Placeholder components for other pages
const UsersPage = { template: "<div><h3>Users Page</h3></div>" };
const VendorsPage = { template: "<div><h3>Vendors Page</h3></div>" };
const EventsPage = { template: "<div><h3>Events Page</h3></div>" };
const BudgetsPage = { template: "<div><h3>Budgets & Payments Page</h3></div>" };
const TasksPage = { template: "<div><h3>Tasks & Timeline Page</h3></div>" };
const ContentPage = { template: "<div><h3>Content Page</h3></div>" };
const AnalyticsPage = { template: "<div><h3>Analytics Page</h3></div>" };
const NotificationsPage = { template: "<div><h3>Notifications Page</h3></div>" };
const SettingsPage = { template: "<div><h3>Settings Page</h3></div>" };

const activePage = ref("Dashboard");

const pagesMap = {
  Dashboard: AdminDashboard,
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

<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <AdminSidebar :activePage="activePage" @update:page="updatePage"/>

    <!-- Main Content -->
    <div class="main-content">
      <AdminHeader :pageTitle="activePage"/>

      <!-- Container for page content -->
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import AdminSidebar from "./AdminSidebar.vue";
import AdminHeader from "./AdminHeader.vue";

const props = defineProps({
  activePage: String,
});

const emit = defineEmits(["update:page"]);

function updatePage(newPage) {
  emit("update:page", newPage);
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-color);
}

.main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.container {
  flex-grow: 1;
  padding: 20px 30px;
  background-color: #F5F7FA; /* light background for content */
  min-height: calc(100vh - 70px); /* adjust for header height */
  box-sizing: border-box;
}
</style>

<template>
  <aside class="sidebar">
    <SidebarBrand />

    <nav class="nav">
      <SidebarNavItem
        v-for="it in navItems"
        :key="it.key"
        :to="link(it.path)"
        :label="t(it.labelKey)"
        :icon="it.icon"
        :active="isActive(it.path)"
      />
    </nav>

    <SidebarAccount
      :name="userName"
      :role="'Admin'"
      :avatarUrl="''"
      @settings="noop"
      @sign-out="signOut"
    />
  </aside>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import SidebarBrand from "@/components/sidebar/SidebarBrand.vue";
import SidebarNavItem from "@/components/sidebar/SidebarNavItem.vue";
import SidebarAccount from "@/components/sidebar/SidebarAccount.vue";
import { Icons } from "@/utils/icons.js";
import { getFullName, logout } from "@/services/auth.service";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const lang = computed(() => route.params.lang || "mk");

const link = (section) => `/${lang.value}/admin/${section}`;

const isActive = (section) => {
  const p = `/admin/${section}`;
  return String(route.path || "").includes(p);
};

const navItems = [
  { key: "events", path: "events", labelKey: "admin.sidebar.events", icon: Icons.calendar },
  { key: "packages", path: "packages", labelKey: "admin.sidebar.packages", icon: Icons.package },
  { key: "users", path: "users", labelKey: "admin.sidebar.users", icon: Icons.users },
  { key: "reviews", path: "reviews", labelKey: "admin.sidebar.reviews", icon: Icons.star },
  { key: "contacts", path: "contacts", labelKey: "admin.sidebar.contacts", icon: Icons.mail },
];

const userName = computed(() => getFullName() || "Admin");

function noop() {}

function signOut() {
  logout();
  router.push(`/${lang.value}/auth/login`);
}
</script>

<style scoped>
.sidebar {
  background: var(--brand-main);
  color: var(--neutral-100);
  padding: 18px 14px;
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  overflow-y: auto;
}

.nav {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}
</style>

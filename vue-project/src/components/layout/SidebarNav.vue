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
        :badge="it.badge ? t(it.badge) : null"
        :active="isActive(it.path)"
      />
    </nav>

    <SidebarAccount
      :name="userName"
      :role="userRole"
      :avatarUrl="avatarUrl"
      @settings="goToSettings"
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
import { clearOnboarding } from "@/store/onboarding.store";


const { t } = useI18n();
const route = useRoute();

const lang = computed(() => route.params.lang || "mk");

const link = (section) =>
  `/${lang.value}/dashboard/events/${section}`;

const isActive = (section) => {
  const p = `/dashboard/events/${section}`;
  return String(route.path || "").includes(p);
};

// ✅ You can later load this from BE or feature flags
const navItems = computed(() => [
  { key: "overview", path: "overview", labelKey: "sidebar.overview", icon: Icons.grid },
  { key: "guests", path: "guests", labelKey: "sidebar.guests", icon: Icons.users },
  { key: "tasks", path: "tasks", labelKey: "sidebar.tasks", icon: Icons.check },     // add route later if needed
  { key: "budget", path: "budget", labelKey: "sidebar.budget", icon: Icons.card },  // add route later if needed
  { key: "tables", path: "tables", labelKey: "sidebar.seating", icon: Icons.grid2 },
  { key: "agenda", path: "agenda", labelKey: "sidebar.agenda", icon: Icons.calendar },
  { key: "gallery", path: "gallery", labelKey: "sidebar.gallery", icon: Icons.image },
  { key: "team", path: "team", labelKey: "sidebar.team", icon: Icons.userPlus, badge: "sidebar.premium" },
  { key: "settings", path: "settings", labelKey: "sidebar.settings", icon: Icons.settings }
]);

const router = useRouter();

const userName = computed(() => getFullName() || "User");
const userRole = computed(() => t("sidebar.eventPlanner"));
const avatarUrl = computed(() => "");

function goToSettings() {
  router.push(`/${lang.value}/dashboard/events/settings`);
}

function signOut() {
  logout();
  clearOnboarding();
  router.push(`/${lang.value}/auth/login`);
}
</script>

<style scoped>
/* Use exactly your design */
.sidebar {
  background: var(--brand-main);
  color: var(--neutral-100);
  padding: 18px 14px;
  display: grid;
  grid-template-rows: auto 1fr auto;
}
.brand { padding: 8px 10px 14px; }
.logo { font-family: var(--font-family), serif; font-size: 22px; letter-spacing: .4px; }

.nav {
  display: grid;
  gap: 6px;
  margin-top: 12px;
  max-height: 480px;
  overflow: auto;
}

/* item styles live in SidebarNavItem; keep here if you want global */
.badge {
  background: var(--brand-gold);
  color: #1b1b1b;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}
.footer { padding: 14px 10px 8px; }
.account { color: var(--neutral-100); text-decoration: none; opacity: .9; }
</style>

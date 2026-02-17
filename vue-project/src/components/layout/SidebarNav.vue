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

    <div class="sidebar-actions">
      <button class="sidebar-action-btn" @click="goToGuests">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        {{ t("sidebar.addGuest") }}
      </button>
      <button class="sidebar-action-btn" @click="goToTasks">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        {{ t("sidebar.addTask") }}
      </button>
    </div>

    <SidebarAccount
      :name="userName"
      :role="userRole"
      :avatarUrl="avatarUrl"
      @settings="goToSettings"
      @support="goToSupport"
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
import { onboardingStore, clearOnboarding } from "@/store/onboarding.store";


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
  { key: "our-story", path: "our-story", labelKey: "sidebar.ourStory", icon: Icons.heart },
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

function goToSupport() {
  router.push(`/${lang.value}/dashboard/events/support`);
}

function goToGuests() {
  router.push(`/${lang.value}/dashboard/events/guests?action=add`);
}

function goToTasks() {
  router.push(`/${lang.value}/dashboard/events/tasks?action=add`);
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
  grid-template-rows: auto 1fr auto auto;
  height: 100%;
  overflow-y: auto;
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

/* Sidebar action buttons */
.sidebar-actions {
  display: grid;
  gap: 8px;
  padding: 14px 0;
}

.sidebar-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--neutral-100);
  background: var(--brand-dark);
  color: var(--neutral-100);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.sidebar-action-btn:hover {
  background: var(--brand-light);
  color: var(--brand-main);
}
</style>

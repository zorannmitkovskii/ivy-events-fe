<template>
  <aside class="sidebar">
    <div class="sidebar-head">
      <SidebarBrand />
      <button class="close-btn" @click="$emit('close')" aria-label="Close menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

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

defineEmits(["close"]);

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
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--neutral-100);
  cursor: pointer;
  padding: 0;
}
.close-btn:hover { background: rgba(255,255,255,0.12); }

@media (max-width: 1024px) {
  .close-btn { display: inline-flex; }
}

.nav {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  flex: 1;
}
</style>

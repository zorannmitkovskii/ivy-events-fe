<template>
  <div class="vendor-shell">
    <header class="vendor-topbar">
      <div class="brand">
        <span class="ivy-logo ivy-logo--inverse brand-logo" role="img" aria-label="Ivy Events"></span>
        <span class="brand-name">{{ vendorName }}</span>
      </div>
      <button class="signout" @click="onLogout">{{ t('vendorPortal.logout') }}</button>
    </header>

    <!-- A photographer has no room to lay out and a caterer has no showreel.
         The tabs come from the backend's capability list, not from a copy of
         the vendor-type map kept here. -->
    <nav class="vendor-nav">
      <RouterLink v-for="tab in tabs" :key="tab.name" :to="{ name: tab.name }" class="nav-link">
        {{ t(tab.label) }}
      </RouterLink>
    </nav>

    <main class="vendor-content">
      <p v-if="notLinked" class="notice">{{ t('vendorPortal.notLinked') }}</p>
      <RouterView v-else />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useVendorProfile } from "@/composables/useVendorProfile";
import { VENDOR_TABS } from "@/router/vendorTabs";
import { logout } from "@/services/auth.service";

const { t } = useI18n();
const { profile, notLinked, load, reset } = useVendorProfile();

const vendorName = computed(() => profile.value?.name ?? "");

const tabs = computed(() => {
  const capabilities = profile.value?.capabilities ?? [];
  // A null capability means the tab is ungated — the inbox, the application
  // and the microsite belong to every vendor whatever their trade. Filtering
  // on `includes` alone dropped all three, because no capability list
  // contains null.
  return VENDOR_TABS.filter((tab) => tab.capability === null || capabilities.includes(tab.capability));
});

onMounted(load);

function onLogout() {
  reset();
  logout();
}
</script>

<style scoped>
.vendor-shell {
  min-height: 100vh;
  background: #fbfaf7;
}

.vendor-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  background: #1f3d2b;
  color: #fff;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.brand-logo {
  --logo-h: 26px;
}

.brand-name {
  font-weight: 600;
}

.signout {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 999px;
  color: #fff;
  padding: 0.375rem 0.875rem;
  min-height: 40px;
  cursor: pointer;
}

.vendor-nav {
  display: flex;
  gap: 1.25rem;
  padding: 0 1.25rem;
  background: #fff;
  border-bottom: 1px solid #e8e4dc;
}

.nav-link {
  padding: 0.875rem 0;
  color: #1d1b18;
  text-decoration: none;
}

.nav-link.router-link-active {
  color: #1f3d2b;
  font-weight: 600;
  box-shadow: inset 0 -2px 0 #1f3d2b;
}

.vendor-content {
  max-width: 68rem;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
}

.notice {
  color: #6b665e;
}
</style>

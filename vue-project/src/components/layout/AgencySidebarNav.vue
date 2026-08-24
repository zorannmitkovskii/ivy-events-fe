<template>
  <aside class="sidebar">
    <div class="sidebar-head">
      <SidebarBrand />
      <button class="close-btn" @click="$emit('close')" :aria-label="t('agencySidebar.closeMenu')">
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
        :to="it.to"
        :label="t(it.labelKey)"
        :icon="it.icon"
        :active="isActive(it.match)"
      />
    </nav>

    <SidebarAccount
      :name="userName"
      :role="t('agencySidebar.role')"
      :avatarUrl="''"
      @sign-out="signOut"
    />
  </aside>
</template>

<script setup>
/**
 * The agency console's own navigation (IVY-1401).
 *
 * <p>Until now the three agency screens sat outside every layout, so the only
 * way between them was a grid of tiles on the dashboard — navigation dressed
 * as content. An owner who opened the team screen had no way back except the
 * browser button.
 *
 * <p>Five destinations, and the pipeline among them: it lives under the
 * organizer routes but belongs to whoever runs the agency, which is why it is
 * reached from here rather than from an event.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SidebarBrand from '@/components/sidebar/SidebarBrand.vue'
import SidebarNavItem from '@/components/sidebar/SidebarNavItem.vue'
import SidebarAccount from '@/components/sidebar/SidebarAccount.vue'
import { Icons } from '@/utils/icons.js'
import { getFullName, logout } from '@/services/auth.service'

defineEmits(['close'])

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang || 'mk')
const at = (path) => `/${lang.value}/${path}`

const navItems = computed(() => [
  { key: 'dashboard', to: at('org/dashboard'), match: '/org/dashboard', labelKey: 'agencySidebar.dashboard', icon: Icons.grid },
  { key: 'events', to: at('organizer'), match: '/organizer', labelKey: 'agencySidebar.myEvents', icon: Icons.calendar },
  { key: 'pipeline', to: at('org/pipeline'), match: '/org/pipeline', labelKey: 'agencySidebar.pipeline', icon: Icons.clipboardList },
  { key: 'team', to: at('org/users'), match: '/org/users', labelKey: 'agencySidebar.team', icon: Icons.users },
  { key: 'settings', to: at('org/settings'), match: '/org/settings', labelKey: 'agencySidebar.settings', icon: Icons.settings },
])

const isActive = (match) => String(route.path || '').includes(match)

const userName = computed(() => getFullName() || t('agencySidebar.role'))

function signOut() {
  logout()
  router.push(at('login'))
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--brand);
  color: var(--bg-main);
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px 10px;
}

.close-btn {
  display: none;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 4px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  flex: 1;
  overflow-y: auto;
}

@media (max-width: 900px) {
  .close-btn { display: inline-flex; }
}
</style>

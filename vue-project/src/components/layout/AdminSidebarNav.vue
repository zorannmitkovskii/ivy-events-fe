<template>
  <DashSide
    :context-label="t('admin.sidebar.contextLabel')"
    :context-name="t('admin.sidebar.contextName')"
    :name="userName"
    role="Admin"
    @close="$emit('close')"
  >
    <!-- On a phone the top bar hides its tabs, so the menu carries them. -->
    <template #context>
      <nav class="side-tabs" :aria-label="t('dash.roleSwitchLabel')">
        <router-link
          v-for="tab in ADMIN_SECTIONS"
          :key="tab.key"
          :to="link(tab.items[0].path)"
          :aria-current="tab.key === section.key ? 'page' : null"
        >{{ t(`dash.workspaces.${tab.key}`) }}</router-link>
      </nav>
    </template>

    <template #nav>
      <DashNavItem
        v-for="item in visibleItems"
        :key="item.key"
        :to="link(item.path)"
        :label="t(item.labelKey)"
        :icon="item.icon"
        :active="isActive(item)"
      />
    </template>

    <template #account>
      <button class="side-signout" type="button" @click="signOut">{{ t('sidebar.signOut') }}</button>
    </template>
  </DashSide>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashSide from '@/components/dashboard/shell/DashSide.vue'
import DashNavItem from '@/components/dashboard/shell/DashNavItem.vue'
import { ADMIN_SECTIONS, adminSectionFor, adminSegment } from '@/components/layout/adminSections.js'
import { getFullName, logout } from '@/services/auth.service'
import { usePrivileges } from '@/composables/usePrivileges'

defineEmits(['close'])

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang || 'mk')

const link = (section) => `/${lang.value}/admin/${section}`

/** Only the screens of the tab being looked at (IVY-912). */
const { filterNav, load: loadPrivileges } = usePrivileges()
onMounted(loadPrivileges)

const section = computed(() => adminSectionFor(route.path))

/* Drawn from what this administrator may open, not from the role alone. */
const visibleItems = computed(() => filterNav(section.value.items))

// Exact segment, not a substring: `email-templates` must not light up on `email-send`.
const isActive = (item) => adminSegment(route.path) === item.path

const userName = computed(() => getFullName() || 'Admin')

function signOut() {
  logout()
  router.push(`/${lang.value}/auth/login`)
}
</script>

<style scoped>
.side-tabs {
  display: none;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.side-tabs a {
  padding: 5px 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  font-size: 12.5px;
  color: #c9d6ce;
}

.side-tabs a:hover {
  text-decoration: none;
  color: #fff;
}

.side-tabs a[aria-current='page'] {
  border-color: #fff;
  color: #fff;
  font-weight: 600;
}

/* The breakpoint at which `ivy/dash.css` hides the top bar's tabs. */
@media (max-width: 860px) {
  .side-tabs {
    display: flex;
  }
}

/* The admin sidebar's account row is a sign-out rather than a menu: every
   setting behind that menu is a row in the navigation above it. */
.side-signout {
  flex: none;
  margin-left: auto;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  font-size: 12.5px;
  white-space: nowrap;
  color: #c9d6ce;
}

.side-signout:hover {
  border-color: #fff;
  color: #fff;
}
</style>

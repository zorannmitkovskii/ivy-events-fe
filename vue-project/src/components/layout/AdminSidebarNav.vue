<template>
  <DashSide
    :context-label="t('admin.sidebar.contextLabel')"
    :context-name="t('admin.sidebar.contextName')"
    :name="userName"
    role="Admin"
    @close="$emit('close')"
  >
    <template #nav>
      <DashNavItem
        v-for="item in navItems"
        :key="item.key"
        :to="link(item.path)"
        :label="t(item.labelKey)"
        :icon="item.icon"
        :active="isActive(item.path)"
      />
    </template>

    <template #account>
      <button class="side-signout" type="button" @click="signOut">{{ t('sidebar.signOut') }}</button>
    </template>
  </DashSide>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashSide from '@/components/dashboard/shell/DashSide.vue'
import DashNavItem from '@/components/dashboard/shell/DashNavItem.vue'
import { DashIcons } from '@/utils/dashIcons.js'
import { getFullName, logout } from '@/services/auth.service'

defineEmits(['close'])

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang || 'mk')

const link = (section) => `/${lang.value}/admin/${section}`

const isActive = (section) => String(route.path || '').includes(`/admin/${section}`)

const navItems = [
  { key: 'dashboard', path: 'dashboard', labelKey: 'admin.sidebar.dashboard', icon: DashIcons.overview },
  { key: 'events', path: 'events', labelKey: 'admin.sidebar.events', icon: DashIcons.calendar },
  { key: 'users', path: 'users', labelKey: 'admin.sidebar.users', icon: DashIcons.guests },
  { key: 'organizers', path: 'organizers', labelKey: 'admin.sidebar.organizers', icon: DashIcons.team },
  // The queue was routed but missing from the sidebar, so the only admin
  // vendor screen was reachable by typing the URL (IVY-1103).
  { key: 'vendorQueue', path: 'vendor-queue', labelKey: 'admin.sidebar.vendorQueue', icon: DashIcons.vendors },
  { key: 'packages', path: 'packages', labelKey: 'admin.sidebar.packages', icon: DashIcons.packages },
  { key: 'payments', path: 'payments', labelKey: 'admin.sidebar.payments', icon: DashIcons.payments },
  { key: 'reviews', path: 'reviews', labelKey: 'admin.sidebar.reviews', icon: DashIcons.reviews },
  { key: 'contacts', path: 'contacts', labelKey: 'admin.sidebar.contacts', icon: DashIcons.messages },
  { key: 'faq', path: 'faq', labelKey: 'admin.sidebar.faq', icon: DashIcons.support },
  { key: 'invitationTemplates', path: 'invitation-templates', labelKey: 'admin.sidebar.invitationTemplates', icon: DashIcons.gallery },
  { key: 'emailTemplates', path: 'email-templates', labelKey: 'admin.sidebar.emailTemplates', icon: DashIcons.postEvent },
  { key: 'emailSend', path: 'email-send', labelKey: 'admin.sidebar.emailSend', icon: DashIcons.messages },
  // The editorial desk (EPIC-09). Content sits with admin rather than with an
  // event because an article belongs to the site, not to somebody's wedding.
  { key: 'content', path: 'content', labelKey: 'admin.sidebar.content', icon: DashIcons.quotes },
  { key: 'contentAnalytics', path: 'content-analytics', labelKey: 'admin.sidebar.contentAnalytics', icon: DashIcons.reports },
  { key: 'settings', path: 'settings', labelKey: 'admin.sidebar.settings', icon: DashIcons.settings },
]

const userName = computed(() => getFullName() || 'Admin')

function signOut() {
  logout()
  router.push(`/${lang.value}/auth/login`)
}
</script>

<style scoped>
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

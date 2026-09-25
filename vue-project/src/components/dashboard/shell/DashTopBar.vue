<template>
  <header class="top">
    <div class="mtop">
      <button class="icon-btn" type="button" :aria-label="$t('header.menu.openMenu')" @click="$emit('toggle')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke-linecap="round" />
        </svg>
      </button>
      <router-link class="brand" :to="`/${lang}`" :aria-label="$t('header.logo')">
        <span class="ivy-logo" role="img" :aria-label="$t('header.logo')"></span>
      </router-link>
    </div>

    <!--
      The role switch the design puts here, showing only the workspaces this
      person actually has. The mockup lists all four because it has no session;
      offering a couple planning their wedding a link to the admin console
      would be a 403 dressed as navigation.
    -->
    <nav v-if="showSwitch" class="roles" :aria-label="$t('dash.roleSwitchLabel')">
      <router-link
        v-for="space in workspaces"
        :key="space.key"
        :to="space.to"
        :aria-current="space.key === current ? 'page' : null"
      >{{ $t(`dash.workspaces.${space.key}`) }}</router-link>
    </nav>
    <span v-else></span>

    <div class="acts">
      <slot name="search">
        <div class="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <path d="m20 20-4.5-4.5" />
          </svg>{{ searchHint || $t('dash.searchHint') }}
        </div>
      </slot>

      <ThemeToggle variant="icon" />

      <template v-if="showNotifications">
        <WorkspaceNotificationBell v-if="workspaceNotifications" />
        <NotificationBell v-else />
      </template>

      <slot name="action" />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import NotificationBell from '@/components/dashboard/shell/NotificationBell.vue'
import WorkspaceNotificationBell from '@/components/dashboard/shell/WorkspaceNotificationBell.vue'
import { hasRole } from '@/services/auth.service'
import { ADMIN_SECTIONS } from '@/components/layout/adminSections.js'

/**
 * The dashboard's top bar, shared by every workspace.
 *
 * @param current which workspace is showing, so the switch can mark it
 */
const props = defineProps({
  current: { type: String, required: true },
  searchHint: { type: String, default: '' },
  /* The store behind the bell is per-event, so it has nothing to say on the
     admin console. Off there rather than showing a permanently empty one. */
  showNotifications: { type: Boolean, default: true },
  /* The agency and vendor consoles have no selected event; their bell reads
     what was addressed to the person, their agency or their vendor instead. */
  workspaceNotifications: { type: Boolean, default: false },
})

defineEmits(['toggle'])

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

/*
  The workspaces a person has, by role (IVY-908).

  An administrator's are the tabs of the admin console (IVY-912), and nothing else:
  their account also carries USER, and "My event" on the platform console is a
  door into somebody's wedding through a shell never meant for the platform.

  An agency owner's is the agency. They do edit their clients' events in the
  event screens, but they get there from the agency panel, not from a tab that
  suggests a second, personal workspace.

  "My event" belongs to the couple alone. Every account on the platform also
  carries USER — that is what the event routes check — so the role cannot be
  what decides this: asking for USER would show the tab to everybody. What
  separates the couple is that they hold no working role, so the absence of one
  is the test.

  Note this hides the tab, not the screens. An organiser opening a client's
  event still lands in exactly these routes; they simply arrive from their own
  panel rather than through a door labelled as if the wedding were theirs.
*/

/** Holding any of these means the event screens are somebody else's work. */
const WORKING_ROLES = ['ADMIN', 'AGENCY', 'AGENCY_MEMBER', 'VENDOR', 'VENDOR_MEMBER']
const workspaces = computed(() => {
  const l = lang.value

  if (hasRole('ADMIN')) {
    return ADMIN_SECTIONS.map((section) => ({ key: section.key, to: `/${l}/admin/${section.items[0].path}` }))
  }

  const vendor = { key: 'vendor', to: `/${l}/vendor/home`, show: hasRole('VENDOR') || hasRole('VENDOR_MEMBER') }

  // Owners and members share the agency workspace since 2026-09, each drawn
  // their own version of it — so one entry serves both.
  if (hasRole('AGENCY') || hasRole('AGENCY_MEMBER')) {
    return [{ key: 'agency', to: `/${l}/agency/dashboard`, show: true }, vendor].filter((space) => space.show)
  }

  return [
    { key: 'event', to: `/${l}/dashboard/events/overview`, show: !WORKING_ROLES.some((role) => hasRole(role)) },
    vendor,
  ].filter((space) => space.show)
})

/*
  One workspace is not a choice, so there is usually no switch. The exception
  is somebody standing in a screen that is not one of their workspaces — an
  agency owner inside a client's event — who needs the way back.
*/
const showSwitch = computed(() =>
  workspaces.value.length > 1 || !workspaces.value.some((space) => space.key === props.current))
</script>

<style scoped>
/* `.top`, `.roles`, `.acts`, `.search` and `.icon-btn` are the design's, in
   `ivy/dash.css`. Only the mark and the drawer button are local. */
.mtop .ivy-logo {
  --logo-h: 22px;
  color: var(--ink);
}

/* The design's `.mtop` is a brand alone, because it has no drawer to open. */
.mtop .icon-btn {
  flex: none;
}
</style>

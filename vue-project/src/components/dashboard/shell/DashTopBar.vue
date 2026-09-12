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
    <nav v-if="workspaces.length > 1" class="roles" :aria-label="$t('dash.roleSwitchLabel')">
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

      <NotificationBell v-if="showNotifications" />

      <slot name="action" />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import NotificationBell from '@/components/dashboard/shell/NotificationBell.vue'
import { hasRole } from '@/services/auth.service'

/**
 * The dashboard's top bar, shared by all four workspaces.
 *
 * @param current which workspace is showing, so the switch can mark it
 */
defineProps({
  current: { type: String, required: true },
  searchHint: { type: String, default: '' },
  /* The store behind the bell is per-event, so it has nothing to say on the
     admin console. Off there rather than showing a permanently empty one. */
  showNotifications: { type: Boolean, default: true },
})

defineEmits(['toggle'])

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

/*
  The four workspaces, filtered by role. `event` is everybody's — every account
  carries USER — so it is always in the list; the rest appear only when the
  person can actually open them. One entry left means no switch at all, which
  is the common case and the design's row of four would be misleading there.
*/
const workspaces = computed(() => {
  const l = lang.value
  const all = [
    { key: 'event', to: `/${l}/dashboard/events/overview`, show: true },
    { key: 'organizer', to: `/${l}/organizer`, show: hasRole('ORGANIZER') || hasRole('ORG_ADMIN') },
    { key: 'vendor', to: `/${l}/vendor/calendar`, show: hasRole('VENDOR') },
    { key: 'admin', to: `/${l}/admin/dashboard`, show: hasRole('ADMIN') },
  ]
  return all.filter((space) => space.show)
})
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

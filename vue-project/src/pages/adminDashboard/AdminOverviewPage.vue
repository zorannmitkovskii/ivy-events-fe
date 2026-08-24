<template>
  <DashboardOverview
    :title="t('adminOverview.title')"
    :subtitle="t('adminOverview.subtitle')"
    :loader="load"
    :event-link="eventLink"
    :events-link="eventsLink"
    :nav-items="navItems"
  />
</template>

<script setup>
/**
 * The platform administrator's dashboard (IVY-1101, IVY-1202).
 *
 * <p>All of it lives in {@code DashboardOverview}; this page decides which
 * endpoint fills it and where its links go. The screen it replaced rendered
 * four hardcoded numbers and was reachable by no route.
 *
 * <p><b>The quick-nav grid lists only routes that exist today.</b> Reports and
 * system settings are absent rather than present-and-broken — a tile leading
 * nowhere teaches the reader to distrust the whole grid. They arrive with
 * IVY-1103, which creates the pages they need.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import DashboardOverview from '@/components/dashboard/DashboardOverview.vue'
import { analyticsService } from '@/services/analytics.service'
import { Icons } from '@/utils/icons.js'

const { t } = useI18n()
const route = useRoute()

const lang = computed(() => route.params.lang || 'mk')

const load = (filters) => analyticsService.admin(filters)

const eventLink = (eventId) =>
  `/${lang.value}/admin/events?eventId=${encodeURIComponent(eventId)}`

const eventsLink = computed(() => `/${lang.value}/admin/events`)

const navItems = computed(() => [
  {
    key: 'events',
    icon: Icons.calendar,
    label: t('adminOverview.nav.events'),
    to: `/${lang.value}/admin/events`,
    badgeFrom: (data) => data?.statusBreakdown?.ACTIVATED ?? 0,
    badgeLabel: t('adminOverview.nav.activeEvents'),
  },
  // Organizers, not Users: the directory answers "who is running what", which
  // is the question an administrator opens this screen with. The full account
  // list is still one click further on, in the sidebar.
  //
  // No badge. The only source of "how many organizers" is Keycloak, and an
  // identity call inside the dashboard aggregate would make the whole screen
  // fail whenever that server is slow — for a number nobody is waiting on.
  {
    key: 'organizers',
    icon: Icons.userPlus,
    label: t('adminOverview.nav.organizers'),
    to: `/${lang.value}/admin/organizers`,
  },
  // The approval queue, because it is the only admin vendor screen that works.
  // A list of every vendor needs an endpoint that includes the ones not yet
  // approved, and none exists — recorded on IVY-1103 as follow-up work rather
  // than shipped as a card leading to a page that cannot render.
  {
    key: 'vendors',
    icon: Icons.package,
    label: t('adminOverview.nav.vendors'),
    to: `/${lang.value}/admin/vendor-queue`,
  },
  // The reports are this page. The card scrolls to them rather than pointing
  // at another screen that would have to recount everything.
  {
    key: 'reports',
    icon: Icons.grid,
    label: t('adminOverview.nav.reports'),
    to: { hash: '#charts' },
  },
  {
    key: 'settings',
    icon: Icons.settings,
    label: t('adminOverview.nav.settings'),
    to: `/${lang.value}/admin/settings`,
  },
])
</script>

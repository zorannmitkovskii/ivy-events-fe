<template>
  <DashboardOverview
    :title="t('agencyOverview.title')"
    :subtitle="t('agencyOverview.subtitle')"
    :loader="load"
    :event-link="eventLink"
    :events-link="eventsLink"
    :create-event-action="createEventLink"
    :settings-link="settingsLink"
    :nav-items="navItems"
  >
    <!-- Under the standard block: the agency's own numbers first, then who is
         carrying them (IVY-1202, item 5). -->
    <TeamWorkloadPanel />
  </DashboardOverview>
</template>

<script setup>
/**
 * The agency owner's dashboard (IVY-1201, IVY-1202).
 *
 * <p>The same block as the administrator's, filled by
 * {@code /v1/api/analytics/agency} instead — which takes no organization id and
 * reads it from the token, so an agency can only ever measure itself.
 *
 * <p>The at-risk window used to be edited here, in a form sitting under the
 * list it controls. It now lives on the settings page: an operational overview
 * and a configuration form are two different jobs, and mixing them made the
 * dashboard read like a preferences screen. The banner still states the window
 * it used, with a link to change it.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import DashboardOverview from '@/components/dashboard/DashboardOverview.vue'
import TeamWorkloadPanel from '@/components/dashboard/TeamWorkloadPanel.vue'
import { analyticsService } from '@/services/analytics.service'
import { Icons } from '@/utils/icons.js'

const { t } = useI18n()
const route = useRoute()

const lang = computed(() => route.params.lang || 'mk')

const load = (filters) => analyticsService.agency(filters)

const eventLink = (eventId) =>
  `/${lang.value}/dashboard/events/overview?eventId=${encodeURIComponent(eventId)}`

const eventsLink = computed(() => `/${lang.value}/organizer`)

/** Where a brand-new agency starts: the same flow every event begins with. */
const createEventLink = computed(() => `/${lang.value}/event-category`)
const settingsLink = computed(() => `/${lang.value}/agency/settings`)

/**
 * No tiles here any more (IVY-1401).
 *
 * <p>They were removed once before on the strength of a claim that the same
 * destinations sat in the sidebar — and that claim was false, because these
 * screens had no sidebar at all. The tiles were the navigation, so taking them
 * out left an owner with the browser's back button.
 *
 * <p>`AgencyLayout` now supplies a real one, which is what makes them
 * redundant. The admin dashboard keeps its grid: that shell's sidebar is
 * fifteen items long, and the five tiles there are a shortcut, not the map.
 */
const navItems = []
</script>

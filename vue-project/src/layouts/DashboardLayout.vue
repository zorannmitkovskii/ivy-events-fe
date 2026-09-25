<template>
  <DashShell>
    <template #side="{ close }">
      <SidebarNav @close="close" @navigate="close" />
    </template>

    <template #top="{ toggle }">
      <DashTopBar current="event" :search-hint="t('dash.searchEvent')" @toggle="toggle">
        <template #action>
          <router-link
            class="btn btn-primary btn-sm"
            :to="{ name: 'dashboard.invitations', params: { lang }, query: { from: 'dashboard' } }"
          >{{ t('overview.editInvitation') }}</router-link>
        </template>
      </DashTopBar>
    </template>

    <!--
      Keyed by the event so switching remounts the page under it. The routes
      carry no eventId — every page reads it from the store on mount — so
      without this the guest list of the event you just left stays on screen.
    -->
    <router-view :key="onboardingStore.eventId" />
  </DashShell>
</template>

<script setup>
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashShell from '@/components/dashboard/shell/DashShell.vue'
import DashTopBar from '@/components/dashboard/shell/DashTopBar.vue'
import SidebarNav from '@/components/layout/SidebarNav.vue'
import { onboardingStore } from '@/store/onboarding.store'
import { hasRole, isAuthenticated } from '@/services/auth.service'
import { resolveCurrentEvent } from '@/services/eventSelection.service'
import { EventCategoryEnum } from '@/enums/EventCategory.js'

/** The three sections a gallery-only event is still allowed to open. */
const GALLERY_ALLOWED = ['/events/gallery', '/events/settings', '/events/invitation-links']

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const lang = computed(() => route.params.lang || 'mk')

const isGallery = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY)

/** A gallery product has no guest list or seating plan to send anyone to. */
function redirectGalleryIfNeeded() {
  if (!isGallery.value) return
  if (GALLERY_ALLOWED.some((allowed) => route.path.includes(allowed))) return
  router.replace(`/${lang.value}/dashboard/events/gallery`)
}

onMounted(async () => {
  // Landing here with nothing selected — a bookmark, a reload after the pick
  // was cleared. Ask which events exist rather than reading the token: since
  // IVY-101 the token no longer carries them. Several to choose from means the
  // choice is the person's, so they go to the workspace.
  if (!onboardingStore.eventId && isAuthenticated()) {
    const { eventId, eventCount } = await resolveCurrentEvent()
    if (!eventId && eventCount > 1) {
      const agency = hasRole('AGENCY') || hasRole('AGENCY_MEMBER')
      router.replace(agency ? `/${lang.value}/agency/events` : `/${lang.value}/organizer`)
      return
    }
  }
  redirectGalleryIfNeeded()
})

watch(isGallery, redirectGalleryIfNeeded)
</script>

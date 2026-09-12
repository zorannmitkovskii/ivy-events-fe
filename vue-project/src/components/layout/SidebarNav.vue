<template>
  <DashSide
    :context-label="t('sidebar.eventContext')"
    :context-name="contextName"
    :plan="planLabel"
    :name="userName"
    :role="userRole"
    @close="$emit('close')"
  >
    <!-- The switcher lives inside the context card, which is what that card is
         about: it names the event, so the way to another one belongs on it. -->
    <template #context>
      <div v-if="hasMultipleEvents" class="ctx-switch">
        <button type="button" :aria-expanded="switcherOpen" @click="switcherOpen = !switcherOpen">
          {{ t('sidebar.switchEvent') }}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="m4 6 4 4 4-4" stroke-linecap="round" />
          </svg>
        </button>

        <div v-if="switcherOpen" class="switch-menu">
          <template v-if="pinnedEvents.length">
            <p class="switch-group">{{ t('sidebar.pinnedGroup') }}</p>
            <button
              v-for="ev in pinnedEvents"
              :key="ev.id"
              type="button"
              class="switch-item"
              :class="{ current: ev.id === onboardingStore.eventId }"
              @click="switchTo(ev)"
            >{{ ev.name || t('organizerOverview.untitled') }}</button>
          </template>

          <template v-if="recentEvents.length">
            <p v-if="pinnedEvents.length" class="switch-group">{{ t('sidebar.otherGroup') }}</p>
            <button
              v-for="ev in recentEvents"
              :key="ev.id"
              type="button"
              class="switch-item"
              :class="{ current: ev.id === onboardingStore.eventId }"
              @click="switchTo(ev)"
            >{{ ev.name || t('organizerOverview.untitled') }}</button>
          </template>

          <!-- The menu shows a short head of the list; this is the way to the rest. -->
          <button type="button" class="switch-all" @click="goToMyEvents">{{ t('sidebar.allEvents') }}</button>
        </div>
      </div>
    </template>

    <template #nav>
      <DashNavItem
        v-for="item in navItems"
        :key="item.key"
        :to="link(item.path)"
        :label="t(item.labelKey)"
        :icon="item.icon"
        :count="counts[item.key] || 0"
        :active="isActive(item.path)"
      />
    </template>

    <template #promo>
      <div v-if="showUpgrade" class="upgrade">
        <b>{{ t('sidebar.upgradeTitle') }}</b>
        <span>{{ t('sidebar.upgradeBody') }}</span>
        <router-link class="btn btn-gold" :to="{ name: 'dashboard.packages', params: { lang } }">
          {{ t('sidebar.upgradeCta') }}
        </router-link>
      </div>
    </template>

    <template #account>
      <SidebarAccount
        @settings="goToSettings"
        @invitation-links="goToInvitationLinks"
        @packages="goToPackages"
        @support="goToSupport"
        @sign-out="signOut"
      />
    </template>
  </DashSide>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import DashSide from '@/components/dashboard/shell/DashSide.vue'
import DashNavItem from '@/components/dashboard/shell/DashNavItem.vue'
import SidebarAccount from '@/components/sidebar/SidebarAccount.vue'
import { DashIcons } from '@/utils/dashIcons.js'
import { getFullName, logout, getPackages } from '@/services/auth.service'
import { onboardingStore, clearOnboarding } from '@/store/onboarding.store'
import { EventCategoryEnum } from '@/enums/EventCategory.js'
import { eventsService } from '@/services/events.service'
import { guestsService } from '@/services/guests.service'
import { selectEvent } from '@/services/eventSelection.service'
import useWorkspaceEvents from '@/composables/useWorkspaceEvents'

/** The switcher shows a short head of the list; the rest is one click away. */
const MAX_UNPINNED_IN_SWITCHER = 6

defineEmits(['close', 'navigate'])

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const lang = computed(() => route.params.lang || 'mk')

const link = (section) => `/${lang.value}/dashboard/events/${section}`

const isActive = (section) => String(route.path || '').includes(`/dashboard/events/${section}`)

const isGallery = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY)

const userPackages = computed(() => getPackages() || [])
const hasGalleryPackage = computed(() => userPackages.value.some((p) => p.startsWith('GALLERY_')))
const hasInvPremium = computed(() => userPackages.value.includes('INV_PREMIUM'))
const showUpgrade = computed(() => !hasInvPremium.value)

/** The plan on the context card — the highest one bought, or nothing. */
const planLabel = computed(() => {
  if (hasInvPremium.value) return 'Premium'
  if (userPackages.value.includes('INV_PRO')) return 'Pro'
  return ''
})

const allNavItems = [
  { key: 'overview', path: 'overview', labelKey: 'sidebar.overview', icon: DashIcons.overview },
  { key: 'guests', path: 'guests', labelKey: 'sidebar.guests', icon: DashIcons.guests },
  { key: 'tasks', path: 'tasks', labelKey: 'sidebar.tasks', icon: DashIcons.tasks },
  { key: 'budget', path: 'budget', labelKey: 'sidebar.budget', icon: DashIcons.budget },
  { key: 'tables', path: 'tables', labelKey: 'sidebar.seating', icon: DashIcons.seating },
  { key: 'quotes', path: 'quotes', labelKey: 'sidebar.vendors', icon: DashIcons.vendors },
  { key: 'agenda', path: 'agenda', labelKey: 'sidebar.agenda', icon: DashIcons.agenda },
  { key: 'catering', path: 'catering', labelKey: 'sidebar.catering', icon: DashIcons.catering },
  { key: 'check-in', path: 'check-in', labelKey: 'sidebar.checkIn', icon: DashIcons.checkIn },
  { key: 'announcements', path: 'announcements', labelKey: 'sidebar.announcements', icon: DashIcons.messages },
  { key: 'contributions', path: 'contributions', labelKey: 'sidebar.contributions', icon: DashIcons.gallery },
  // Per-event, unlike the pipeline and the agency settings: an approval belongs
  // to one wedding, so it belongs in the sidebar that is already scoped to one.
  { key: 'approvals', path: 'approvals', labelKey: 'sidebar.approvals', icon: DashIcons.tasks },
  { key: 'post-event', path: 'post-event', labelKey: 'sidebar.postEvent', icon: DashIcons.postEvent },
  { key: 'gallery', path: 'gallery', labelKey: 'sidebar.gallery', icon: DashIcons.gallery },
  { key: 'links', path: 'invitation-links', labelKey: 'sidebar.invitationLinks', icon: DashIcons.link },
]

const GALLERY_NAV_KEYS = ['gallery', 'links']

const navItems = computed(() => {
  if (isGallery.value) {
    return allNavItems.filter((it) => GALLERY_NAV_KEYS.includes(it.key))
  }
  return allNavItems.filter((it) => {
    if (it.key === 'gallery' && !hasGalleryPackage.value) return false
    if (GALLERY_NAV_KEYS.includes(it.key) && it.key !== 'gallery') return false
    return true
  })
})

const userName = computed(() => getFullName() || t('sidebar.defaultUser'))
const userRole = computed(() => t('sidebar.eventPlanner'))

/*
  The gold counter the design puts on a row.

  Only one number is worth carrying: how many invited guests have not answered.
  It is the thing the row is for — the design's own example is "Гости и
  одговори · 9" — and it is the only count on this sidebar that means something
  is waiting on the person rather than simply existing.
*/
const counts = ref({})

const eventName = ref('')
const eventDate = ref('')

/** The line the design puts on the context card: the event and its date. */
const contextName = computed(() => {
  if (!eventName.value) return ''
  return eventDate.value ? `${eventName.value} · ${eventDate.value}` : eventName.value
})

const { rows, pinnedEvents, load: loadWorkspace } = useWorkspaceEvents()
const switcherOpen = ref(false)
const hasMultipleEvents = computed(() => rows.value.length > 1)
const recentEvents = computed(() =>
  rows.value
    .filter((r) => !r.pinned)
    .slice(0, MAX_UNPINNED_IN_SWITCHER)
    .map((r) => r.event),
)

onMounted(async () => {
  await loadWorkspace()

  const id = onboardingStore.eventId
  if (!id || id === 'demo') return

  try {
    const ev = await eventsService.getById(id)
    eventName.value = ev.name || ev.title || ''
    if (ev.date || ev.eventDate) {
      const d = new Date(ev.date || ev.eventDate)
      eventDate.value = d.toLocaleDateString(locale.value === 'mk' ? 'mk-MK' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
  } catch {
    // The sidebar renders without the context card rather than not at all.
  }

  try {
    // The counts endpoint, not the guest list: the sidebar needs one number,
    // and pulling three hundred rows to compute it is three hundred rows.
    const status = await guestsService.getStatusCounts(id)
    counts.value = { guests: status?.awaitingReply || 0 }
  } catch {
    // A counter is an extra, never a reason for the navigation to fail.
  }
})

/**
 * Switching stays on the current section — someone looking at the guest list of
 * one event wants the guest list of the other, not to be sent back to an
 * overview. The layout is keyed by the event, so the page under us reloads.
 */
function switchTo(event) {
  switcherOpen.value = false
  selectEvent(event)
}

function goToMyEvents() {
  switcherOpen.value = false
  router.push({ name: 'dashboard.organizer', params: { lang: lang.value } })
}
function goToSettings() {
  router.push(`/${lang.value}/dashboard/events/settings`)
}
function goToInvitationLinks() {
  router.push(`/${lang.value}/dashboard/events/invitation-links`)
}
function goToPackages() {
  router.push({ name: 'dashboard.packages', params: { lang: lang.value } })
}
function goToSupport() {
  router.push(`/${lang.value}/dashboard/events/support`)
}
function signOut() {
  logout()
  clearOnboarding()
  router.push(`/${lang.value}/auth/login`)
}
</script>

<style scoped>
/* The sidebar's own shell is `DashSide`; everything here is the event switcher,
   which the mockup does not draw because it only ever has one event. */
.ctx-switch {
  position: relative;
  margin-top: 10px;
}

.ctx-switch > button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  font-size: 13px;
  color: #8fa398;
}

.ctx-switch > button:hover {
  color: #fff;
}

.ctx-switch svg {
  width: 14px;
  height: 14px;
}

.switch-menu {
  position: absolute;
  z-index: 20;
  top: calc(100% + 8px);
  left: -6px;
  right: -6px;
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  box-shadow: var(--shadow);
}

.switch-group {
  padding: 8px 10px 4px;
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.switch-item,
.switch-all {
  display: block;
  width: 100%;
  padding: 9px 10px;
  border-radius: 8px;
  text-align: left;
  font-size: 14px;
  color: var(--ink);
}

.switch-item:hover,
.switch-all:hover {
  background: var(--mist-2);
}

.switch-item.current {
  font-weight: 600;
  color: var(--ivy);
}

.switch-all {
  margin-top: 4px;
  border-top: 1px solid var(--line);
  border-radius: 0 0 8px 8px;
  color: var(--ink-2);
}
</style>

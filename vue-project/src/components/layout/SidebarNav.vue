<template>
  <aside class="sidebar">
    <div class="sidebar-head">
      <SidebarBrand />
      <button class="close-btn" @click="$emit('close')" aria-label="Close menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <nav class="nav">
      <SidebarNavItem
        v-for="it in navItems"
        :key="it.key"
        :to="link(it.path)"
        :label="t(it.labelKey)"
        :icon="it.icon"
        :badge="it.badge ? t(it.badge) : null"
        :active="isActive(it.path)"
      />
    </nav>

    <div v-if="hasMultipleEvents" class="sidebar-switch">
      <button class="switch-btn" :aria-expanded="switcherOpen" @click="switcherOpen = !switcherOpen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
        {{ t('sidebar.switchEvent') }}
      </button>

      <div v-if="switcherOpen" class="switch-menu">
        <template v-if="pinnedEvents.length">
          <p class="switch-group">{{ t('sidebar.pinnedGroup') }}</p>
          <button
            v-for="ev in pinnedEvents"
            :key="ev.id"
            class="switch-item"
            :class="{ 'switch-item--current': ev.id === onboardingStore.eventId }"
            @click="switchTo(ev)"
          >{{ ev.name || t('organizerOverview.untitled') }}</button>
        </template>

        <template v-if="recentEvents.length">
          <p v-if="pinnedEvents.length" class="switch-group">{{ t('sidebar.otherGroup') }}</p>
          <button
            v-for="ev in recentEvents"
            :key="ev.id"
            class="switch-item"
            :class="{ 'switch-item--current': ev.id === onboardingStore.eventId }"
            @click="switchTo(ev)"
          >{{ ev.name || t('organizerOverview.untitled') }}</button>
        </template>

        <!-- The menu shows a short head of the list; this is the way to the rest. -->
        <button class="switch-all" @click="goToMyEvents">{{ t('sidebar.allEvents') }}</button>
      </div>
    </div>

    <div v-if="!isGallery" class="sidebar-ctas">
      <button class="cta-btn cta-primary" @click="goToGuests">+ {{ t("sidebar.addGuest") }}</button>
      <button v-if="showUpgrade" class="cta-btn cta-upgrade" @click="goToPackages">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        {{ t("sidebar.upgrade") }}
      </button>
      <button v-else class="cta-btn cta-outline" @click="goToTasks">+ {{ t("sidebar.addTask") }}</button>
    </div>

    <SidebarAccount
      :name="userName"
      :role="userRole"
      :avatarUrl="avatarUrl"
      @settings="goToSettings"
      @invitation-links="goToInvitationLinks"
      @packages="goToPackages"
      @support="goToSupport"
      @sign-out="signOut"
    />
  </aside>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import SidebarBrand from "@/components/sidebar/SidebarBrand.vue";
import SidebarNavItem from "@/components/sidebar/SidebarNavItem.vue";
import SidebarAccount from "@/components/sidebar/SidebarAccount.vue";
import { Icons } from "@/utils/icons.js";
import { getFullName, logout, getPackages } from "@/services/auth.service";
import { onboardingStore, clearOnboarding } from "@/store/onboarding.store";
import { EventCategoryEnum } from "@/enums/EventCategory.js";
import { eventsService } from "@/services/events.service";
import { selectEvent } from "@/services/eventSelection.service";
import useWorkspaceEvents from "@/composables/useWorkspaceEvents";

defineEmits(["close", "navigate"]);

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const lang = computed(() => route.params.lang || "mk");

const link = (section) => `/${lang.value}/dashboard/events/${section}`;

const isActive = (section) => {
  const p = `/dashboard/events/${section}`;
  return String(route.path || "").includes(p);
};

const isGallery = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY);

const userPackages = computed(() => getPackages() || []);

const hasGalleryPackage = computed(() => userPackages.value.some(p => p.startsWith("GALLERY_")));
const hasInvPremium = computed(() => userPackages.value.includes("INV_PREMIUM"));
const hasInvPro = computed(() => userPackages.value.includes("INV_PRO"));
const showUpgrade = computed(() => !hasInvPremium.value);

const allNavItems = [
  { key: "overview", path: "overview", labelKey: "sidebar.overview", icon: Icons.grid },
  { key: "guests", path: "guests", labelKey: "sidebar.guests", icon: Icons.users },
  { key: "tasks", path: "tasks", labelKey: "sidebar.tasks", icon: Icons.check },
  { key: "budget", path: "budget", labelKey: "sidebar.budget", icon: Icons.card },
  { key: "tables", path: "tables", labelKey: "sidebar.seating", icon: Icons.grid2 },
  { key: "catering", path: "catering", labelKey: "sidebar.catering", icon: Icons.package },
  { key: "check-in", path: "check-in", labelKey: "sidebar.checkIn", icon: Icons.check },
  { key: "announcements", path: "announcements", labelKey: "sidebar.announcements", icon: Icons.mail },
  { key: "contributions", path: "contributions", labelKey: "sidebar.contributions", icon: Icons.image },
  { key: "post-event", path: "post-event", labelKey: "sidebar.postEvent", icon: Icons.mail },
  { key: "gallery", path: "gallery", labelKey: "sidebar.gallery", icon: Icons.image },
  { key: "links", path: "invitation-links", labelKey: "sidebar.invitationLinks", icon: Icons.mail }
];

const GALLERY_NAV_KEYS = ['gallery', 'links'];

const navItems = computed(() => {
  if (isGallery.value) {
    return allNavItems.filter(it => GALLERY_NAV_KEYS.includes(it.key));
  }
  // Hide gallery if user has no GALLERY_ package
  return allNavItems.filter(it => {
    if (it.key === 'gallery' && !hasGalleryPackage.value) return false;
    if (GALLERY_NAV_KEYS.includes(it.key) && it.key !== 'gallery') return false;
    return true;
  });
});

const userName = computed(() => getFullName() || "User");
const userRole = computed(() => t("sidebar.eventPlanner"));
const avatarUrl = computed(() => "");

// Event info
const eventName = ref("");
const eventDate = ref("");

// The switcher: same list the workspace page shows, so pinned events lead here
// too. Capped at a short head — the full list is one click away rather than an
// unbounded menu inside a sidebar.
const MAX_UNPINNED_IN_SWITCHER = 6;

const { rows, pinnedEvents, load: loadWorkspace } = useWorkspaceEvents();
const switcherOpen = ref(false);
const hasMultipleEvents = computed(() => rows.value.length > 1);
const recentEvents = computed(() =>
  rows.value.filter(r => !r.pinned).slice(0, MAX_UNPINNED_IN_SWITCHER).map(r => r.event)
);

const eventStatusLabel = computed(() => {
  const s = onboardingStore.eventStatus;
  if (!s || s === "ACTIVE") return "";
  return s === "DRAFT" ? "Draft" : s;
});

onMounted(async () => {
  await loadWorkspace();

  try {
    const id = onboardingStore.eventId;
    if (!id || id === "demo") return;

    const ev = await eventsService.getById(id);
    eventName.value = ev.name || ev.title || "";
    if (ev.date || ev.eventDate) {
      const d = new Date(ev.date || ev.eventDate);
      eventDate.value = d.toLocaleDateString(locale.value === "mk" ? "mk-MK" : "en-US", {
        day: "numeric", month: "short", year: "numeric"
      });
    }
  } catch {
    // keep empty
  }
});

/**
 * Switching stays on the current section — someone looking at the guest list of
 * one event wants the guest list of the other, not to be sent back to an
 * overview. The layout is keyed by the event, so the page under us reloads.
 */
function switchTo(event) {
  switcherOpen.value = false;
  selectEvent(event);
}

function goToMyEvents() {
  switcherOpen.value = false;
  router.push({ name: 'dashboard.organizer', params: { lang: lang.value } });
}
function goToSettings() { router.push(`/${lang.value}/dashboard/events/settings`); }
function goToInvitationLinks() { router.push(`/${lang.value}/dashboard/events/invitation-links`); }
function goToPackages() { router.push({ name: "dashboard.packages", params: { lang: lang.value } }); }
function goToSupport() { router.push(`/${lang.value}/dashboard/events/support`); }
function goToGuests() { router.push(`/${lang.value}/dashboard/events/guests?action=add`); }
function goToTasks() { router.push(`/${lang.value}/dashboard/events/tasks?action=add`); }
function signOut() { logout(); clearOnboarding(); router.push(`/${lang.value}/auth/login`); }
</script>

<style scoped>
.sidebar {
  height: 100vh;
  background: var(--dash-charcoal);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar::before {
  content: '';
  position: absolute;
  bottom: -80px;
  right: -80px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(90, 122, 82, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0;
  margin-right: 14px;
}

.close-btn:hover { background: rgba(255, 255, 255, 0.08); }

@media (max-width: 1024px) {
  .close-btn { display: inline-flex; }
}

/* Event info card */
.event-info {
  margin: 16px 14px 0;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 14px 16px;
  position: relative;
  overflow: hidden;
}

.event-info::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--dash-gold), var(--dash-gold-light));
  border-radius: 0 2px 2px 0;
}

.ei-names {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.92);
  font-style: italic;
}

.ei-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.38);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pill-draft {
  background: rgba(184, 149, 78, 0.2);
  border: 1px solid rgba(184, 149, 78, 0.35);
  color: var(--dash-gold-light);
  font-size: 8.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 20px;
}

/* Nav */
.nav {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  flex: 1;
  min-height: 0;
}

.nav-label {
  font-size: 8.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.22);
  padding: 0 24px;
  margin-bottom: 4px;
  font-weight: 600;
}

/* Switch event */
.sidebar-switch {
  padding: 6px 14px;
}

.switch-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
  border: 1.5px dashed rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.02em;
}

.switch-btn:hover {
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.04);
}

.switch-menu {
  margin-top: 6px;
  padding: 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.switch-group {
  margin: 6px 8px 2px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.35);
}

.switch-item,
.switch-all {
  width: 100%;
  padding: 7px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Outfit', sans-serif;
  font-size: 12.5px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.switch-item:hover,
.switch-all:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.switch-item--current {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.switch-all {
  margin-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 0 6px 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

/* Sidebar CTAs */
.sidebar-ctas {
  padding: 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
  border: none;
  letter-spacing: 0.02em;
}

.cta-primary {
  background: var(--dash-sage);
  color: #fff;
}

.cta-primary:hover {
  background: var(--dash-sage-dark);
}

.cta-outline {
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
}

.cta-outline:hover {
  border-color: rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.75);
}

.cta-upgrade {
  background: linear-gradient(135deg, var(--dash-gold), var(--dash-gold-light));
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.cta-upgrade:hover {
  filter: brightness(1.1);
}
</style>

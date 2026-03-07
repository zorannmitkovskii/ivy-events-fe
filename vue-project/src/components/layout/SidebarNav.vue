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

    <!-- Event info card -->
    <div v-if="eventName" class="event-info">
      <div class="ei-names">{{ eventName }}</div>
      <div class="ei-date">
        <span v-if="eventDate">{{ eventDate }}</span>
        <span v-if="eventStatusLabel" class="pill-draft">{{ eventStatusLabel }}</span>
      </div>
    </div>

    <nav class="nav">
      <div class="nav-label">{{ t("sidebar.navigation") }}</div>
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

    <div v-if="!isGallery" class="sidebar-ctas">
      <button class="cta-btn cta-primary" @click="goToGuests">+ {{ t("sidebar.addGuest") }}</button>
      <button class="cta-btn cta-outline" @click="goToTasks">+ {{ t("sidebar.addTask") }}</button>
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
import { getFullName, logout } from "@/services/auth.service";
import { onboardingStore, clearOnboarding } from "@/store/onboarding.store";
import { EventCategoryEnum } from "@/enums/EventCategory.js";
import { eventsService } from "@/services/events.service";

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

const allNavItems = [
  { key: "overview", path: "overview", labelKey: "sidebar.overview", icon: Icons.grid },
  { key: "guests", path: "guests", labelKey: "sidebar.guests", icon: Icons.users },
  { key: "tasks", path: "tasks", labelKey: "sidebar.tasks", icon: Icons.check },
  { key: "budget", path: "budget", labelKey: "sidebar.budget", icon: Icons.card },
  { key: "tables", path: "tables", labelKey: "sidebar.seating", icon: Icons.grid2 },
  { key: "gallery", path: "gallery", labelKey: "sidebar.gallery", icon: Icons.image },
  { key: "links", path: "invitation-links", labelKey: "sidebar.invitationLinks", icon: Icons.mail }
];

const GALLERY_NAV_KEYS = ['gallery', 'links'];

const navItems = computed(() => {
  if (isGallery.value) {
    return allNavItems.filter(it => GALLERY_NAV_KEYS.includes(it.key));
  }
  return allNavItems.filter(it => !GALLERY_NAV_KEYS.includes(it.key) || it.key === 'gallery');
});

const userName = computed(() => getFullName() || "User");
const userRole = computed(() => t("sidebar.eventPlanner"));
const avatarUrl = computed(() => "");

// Event info
const eventName = ref("");
const eventDate = ref("");
const eventStatusLabel = computed(() => {
  const s = onboardingStore.eventStatus;
  if (!s || s === "ACTIVE") return "";
  return s === "DRAFT" ? "Draft" : s;
});

onMounted(async () => {
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
  overflow: hidden;
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
  padding: 20px 0;
  flex: 1;
  overflow-y: auto;
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

/* Sidebar CTAs */
.sidebar-ctas {
  padding: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  padding: 10px;
  border-radius: 9px;
  font-family: 'Outfit', sans-serif;
  font-size: 12.5px;
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
</style>

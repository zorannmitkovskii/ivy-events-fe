<template>
  <header class="topbar">
    <div class="topbar-left">
      <button v-if="showHamburger" class="menu-toggle" @click="$emit('toggle-menu')" aria-label="Menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <span class="topbar-page">{{ title }}</span>
      <span class="live-dot" :title="t('overview.live')"></span>
    </div>

    <div class="topbar-right">
      <router-link
        :to="{ name: 'EventInvitationsPage', params: { lang }, query: { from: 'dashboard' } }"
        class="tb-btn tb-btn-ghost"
      >
        &#9993; {{ t("overview.editInvitation") }}
      </router-link>
      <router-link
        v-if="showUpgrade"
        :to="{ name: 'dashboard.packages', params: { lang } }"
        class="tb-btn tb-btn-gold"
      >
        &#9733; {{ t('cpay.upgrade') }}
      </router-link>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { onboardingStore } from "@/store/onboarding.store";

const { t } = useI18n();

defineProps({
  showHamburger: { type: Boolean, default: false }
});

defineEmits(["toggle-menu"]);

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");

const showUpgrade = computed(() => {
  const s = onboardingStore.eventStatus;
  return s && s !== "ACTIVE";
});

const title = computed(() => {
  const map = {
    "dashboard.overview": t("sidebar.overview"),
    "dashboard.guests": t("sidebar.guests"),
    "dashboard.tasks": t("sidebar.tasks"),
    "dashboard.budget": t("sidebar.budget"),
    "dashboard.tables": t("sidebar.seating"),
    "dashboard.agenda": t("sidebar.agenda"),
    "dashboard.gallery": t("sidebar.gallery"),
    "dashboard.our-story": t("sidebar.ourStory"),
    "dashboard.wedding-details": t("sidebar.weddingDetails"),
    "dashboard.notifications": t("sidebar.notifications"),
    "dashboard.team": t("sidebar.team"),
    "dashboard.settings": t("sidebar.eventSettings"),
    "dashboard.packages": t("sidebar.packages"),
    "dashboard.invitation-links": t("sidebar.invitationLinks"),
    "dashboard.support": t("sidebar.support"),
    "admin.events": "Events",
    "admin.packages": "Packages",
    "admin.users": "Users",
    "admin.reviews": "Reviews",
    "admin.contacts": "Contacts",
    "admin.faq": "FAQ",
    "admin.invitationTemplates": "Invitation Templates",
  };
  return map[String(route.name)] ?? "Dashboard";
});
</script>

<style scoped>
.topbar {
  background: rgba(250, 246, 239, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--dash-cream-border);
  padding: 0 40px;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breadcrumb {
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dash-light);
  font-weight: 600;
}

.topbar-divider {
  color: var(--dash-cream-border);
  font-size: 16px;
}

.topbar-page {
  font-size: 13px;
  color: var(--dash-ink);
  font-weight: 500;
}

.live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dash-sage-mid);
  display: inline-block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.topbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 9px;
  font-family: 'Outfit', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s;
  letter-spacing: 0.01em;
  text-decoration: none;
  border: none;
}

.tb-btn-ghost {
  background: transparent;
  color: var(--dash-ink);
  border: 1.5px solid var(--dash-cream-border);
}

.tb-btn-ghost:hover {
  border-color: var(--dash-sage-light);
  color: var(--dash-sage-dark);
}

.tb-btn-gold {
  background: linear-gradient(135deg, var(--dash-gold), #9a7a3e);
  color: #fff;
  box-shadow: 0 2px 10px rgba(184, 149, 78, 0.35);
}

.tb-btn-gold:hover {
  box-shadow: 0 4px 16px rgba(184, 149, 78, 0.5);
  transform: translateY(-1px);
}

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--dash-cream-border);
  border-radius: 9px;
  background: transparent;
  color: var(--dash-ink);
  cursor: pointer;
  padding: 0;
}

.menu-toggle:hover {
  border-color: var(--dash-sage-light);
}

@media (max-width: 1024px) {
  .topbar {
    padding: 0 16px;
  }
  .menu-toggle {
    display: inline-flex;
  }
  .topbar-right {
    display: none;
  }
}
</style>

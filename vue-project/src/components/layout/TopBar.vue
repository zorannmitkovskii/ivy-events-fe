<template>
  <header class="top">
    <div class="left">
      <button v-if="showHamburger" class="menu-toggle" @click="$emit('toggle-menu')" aria-label="Menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div class="title">{{ title }}</div>
    </div>

    <div class="right">
      <!-- slot later: invite/manage/upgrade buttons -->
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

defineProps({
  showHamburger: { type: Boolean, default: false }
});

defineEmits(["toggle-menu"]);

const route = useRoute();

const title = computed(() => {
  const map = {
    "dashboard.overview": "Overview",
    "dashboard.guests": "Guests",
    "dashboard.tasks": "Tasks",
    "dashboard.budget": "Budget",
    "dashboard.tables": "Tables & Seating",
    "dashboard.agenda": "Event Agenda",
    "dashboard.gallery": "Gallery",
    "dashboard.notifications": "Notifications",
    "dashboard.team": "Team & Co-hosts",
    "dashboard.settings": "Event Settings",
    "dashboard.packages": "Packages",
    "dashboard.wedding-details": "Wedding Details",
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
.top {
  height: var(--header-height);
  background: var(--bg-white);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
}

@media (max-width: 1024px) {
  .top {
    position: sticky;
    top: 0;
    z-index: 100;
  }
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-family: var(--font-family);
  font-size: 22px;
  color: var(--neutral-900);
}

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: transparent;
  color: var(--neutral-700);
  cursor: pointer;
  padding: 0;
}

.menu-toggle:hover {
  background: rgba(0, 0, 0, 0.04);
}

@media (max-width: 1024px) {
  .menu-toggle {
    display: inline-flex;
  }
}
</style>

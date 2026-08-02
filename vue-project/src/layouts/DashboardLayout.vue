<template>
  <div class="dashboard-layout">
    <aside class="dash-sidebar" :class="{ open: drawerOpen }">
      <SidebarNav @navigate="drawerOpen = false" @close="drawerOpen = false" />
    </aside>

    <div v-if="drawerOpen" class="backdrop" @click="drawerOpen = false"></div>

    <div class="main">
      <TopBar @toggle-menu="drawerOpen = !drawerOpen" :show-hamburger="true" />
      <main class="content">
        <!--
          Keyed by the event so switching remounts the page under it. The routes
          carry no eventId — every page reads it from the store on mount — so
          without this the guest list of the event you just left stays on screen.
        -->
        <router-view :key="onboardingStore.eventId" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import SidebarNav from "@/components/layout/SidebarNav.vue";
import TopBar from "@/components/layout/TopBar.vue";
import { onboardingStore } from "@/store/onboarding.store";
import { isAuthenticated } from "@/services/auth.service";
import { resolveCurrentEvent } from "@/services/eventSelection.service";
import { EventCategoryEnum } from "@/enums/EventCategory.js";

const drawerOpen = ref(false);
const route = useRoute();
const router = useRouter();

const isGallery = computed(() => onboardingStore.selectedCategory === EventCategoryEnum.GALLERY);

// Close drawer on route change
watch(() => route.path, () => {
  drawerOpen.value = false;
});

// Redirect Gallery events to gallery page
function redirectGalleryIfNeeded() {
  if (isGallery.value && !route.path.includes("/events/gallery") && !route.path.includes("/events/settings") && !route.path.includes("/events/invitation-links")) {
    const lang = route.params.lang || "mk";
    router.replace(`/${lang}/dashboard/events/gallery`);
  }
}

onMounted(async () => {
  // Landing here with nothing selected — a bookmark, a reload after the pick
  // was cleared. Ask which events exist rather than reading the token: since
  // IVY-101 the token no longer carries them. Several to choose from means the
  // choice is the person's, so they go to the workspace.
  if (!onboardingStore.eventId && isAuthenticated()) {
    const { eventId, eventCount } = await resolveCurrentEvent();
    if (!eventId && eventCount > 1) {
      router.replace(`/${route.params.lang || "mk"}/organizer`);
      return;
    }
  }
  redirectGalleryIfNeeded();
});
watch(isGallery, redirectGalleryIfNeeded);
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--dash-sidebar-w) 1fr;
  background: var(--dash-cream);
}

.dash-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 100;
}

.main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content {
  padding: 36px 40px;
  flex: 1;
}

.backdrop {
  display: none;
}

@media (max-width: 1024px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .dash-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: var(--dash-sidebar-w);
    z-index: 1000;
    transform: translateX(-100%);
    display: flex;
    flex-direction: column;
  }

  .dash-sidebar.open {
    transform: translateX(0);
    transition: transform 0.25s ease;
  }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 999;
  }

  .content {
    padding: 24px 16px;
  }
}
</style>

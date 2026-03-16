<template>
  <div class="sidebar-user-wrap">
    <button class="sidebar-user" @click="menuOpen = !menuOpen">
      <div class="av">{{ initials }}</div>
      <div class="av-meta">
        <div class="av-name">{{ name }}</div>
        <div class="av-role">{{ role }}</div>
      </div>
      <svg class="chevron" :class="{ open: menuOpen }" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Transition name="menu">
      <div v-if="menuOpen" class="popup">
        <button class="popup-item" @click="onSettings">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {{ t("sidebar.eventSettings") }}
        </button>
        <button class="popup-item" @click="onInvitationLinks">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          {{ t("sidebar.invitationLinks") }}
        </button>
        <button class="popup-item" @click="onPackages">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
          {{ t("sidebar.packages") }}
        </button>
        <button class="popup-item" @click="onSupport">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
          </svg>
          {{ t("sidebar.support") }}
        </button>
        <button class="popup-item popup-danger" @click="onSignOut">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {{ t("sidebar.signOut") }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  name: { type: String, required: true },
  role: { type: String, default: "" },
  avatarUrl: { type: String, default: "" },
});

const emit = defineEmits(["settings", "invitation-links", "packages", "support", "signOut"]);

const menuOpen = ref(false);

const initials = computed(() => {
  const parts = String(props.name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join("") || "U";
});

function onSettings() { menuOpen.value = false; emit("settings"); }
function onInvitationLinks() { menuOpen.value = false; emit("invitation-links"); }
function onPackages() { menuOpen.value = false; emit("packages"); }
function onSupport() { menuOpen.value = false; emit("support"); }
function onSignOut() { menuOpen.value = false; emit("signOut"); }
</script>

<style scoped>
.sidebar-user-wrap {
  padding: 14px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
}

.sidebar-user {
  width: 100%;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
  text-align: left;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.av {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--dash-sage);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.av-meta {
  flex: 1;
  min-width: 0;
}

.av-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.av-role {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.chevron {
  flex-shrink: 0;
  opacity: 0.5;
  transition: transform 0.2s;
}

.chevron.open {
  transform: rotate(180deg);
}

/* Popup */
.popup {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 14px;
  right: 14px;
  background: var(--dash-cream-card);
  border: 1px solid var(--dash-cream-border);
  border-radius: 12px;
  box-shadow: var(--dash-shadow-lg);
  padding: 6px;
  z-index: 200;
}

.popup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-family: 'Outfit', sans-serif;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--dash-ink);
  cursor: pointer;
  transition: background 0.15s;
}

.popup-item:hover {
  background: var(--dash-sage-ghost);
}

.popup-danger {
  color: #b42318;
}

.popup-danger:hover {
  background: rgba(180, 35, 24, 0.06);
}

.menu-enter-active, .menu-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.menu-enter-from, .menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

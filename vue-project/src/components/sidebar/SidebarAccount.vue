<template>
  <div class="footer">
    <button class="account" @click="menuOpen = !menuOpen">
      <div class="acc-row">
        <div class="avatar">
          <img v-if="avatarUrl" :src="avatarUrl" alt="" />
          <span v-else class="initials">{{ initials }}</span>
        </div>
        <div class="meta">
          <div class="name">{{ name }}</div>
          <div class="role">{{ role }}</div>
        </div>
        <svg class="chevron" :class="{ open: menuOpen }" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </button>

    <Transition name="menu">
      <div v-if="menuOpen" class="popup">
        <button class="popup-item" @click="onSettings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          {{ t("sidebar.eventSettings") }}
        </button>
        <button class="popup-item popup-danger" @click="onSignOut">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

const emit = defineEmits(["settings", "signOut"]);

const menuOpen = ref(false);

const initials = computed(() => {
  const parts = String(props.name || "").trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase()).join("") || "U";
});

function onSettings() {
  menuOpen.value = false;
  emit("settings");
}

function onSignOut() {
  menuOpen.value = false;
  emit("signOut");
}
</script>

<style scoped>
.footer {
  padding: 14px 10px 8px;
  position: relative;
}

.account {
  width: 100%;
  background: none;
  border: none;
  color: var(--neutral-100);
  cursor: pointer;
  text-align: left;
  padding: 0;
}

.acc-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  background: rgba(0,0,0,0.18);
  transition: background 0.15s ease;
}
.acc-row:hover {
  background: rgba(0,0,0,0.28);
}

.avatar {
  width: 34px; height: 34px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,0.10);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.initials { font-weight: 900; font-size: 12px; color: var(--neutral-100); }

.meta { min-width: 0; flex: 1; }
.name { font-weight: 800; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.role { font-size: 11px; opacity: .9; }

.chevron {
  flex-shrink: 0;
  opacity: 0.7;
  transition: transform 0.2s ease;
}
.chevron.open {
  transform: rotate(180deg);
}

/* Popup menu */
.popup {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 10px;
  right: 10px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  padding: 6px;
  z-index: 200;
}

.popup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700, #374151);
  cursor: pointer;
  transition: background 0.15s ease;
}
.popup-item:hover {
  background: var(--bg-main, #f9fafb);
}
.popup-danger {
  color: #b42318;
}
.popup-danger:hover {
  background: rgba(180, 35, 24, 0.06);
}

/* Transition */
.menu-enter-active, .menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-enter-from, .menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

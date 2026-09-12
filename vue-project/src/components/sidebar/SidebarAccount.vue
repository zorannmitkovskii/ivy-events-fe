<template>
  <div ref="root" class="account">
    <button
      class="account-trigger"
      type="button"
      :aria-expanded="menuOpen"
      :aria-label="t('sidebar.accountMenu')"
      @click="menuOpen = !menuOpen"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="5" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="12" cy="19" r="1.7" />
      </svg>
    </button>

    <div v-if="menuOpen" class="popup">
      <button v-for="item in items" :key="item.event" type="button" class="popup-item" :class="item.tone" @click="choose(item.event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" v-html="item.icon"></svg>
        {{ t(item.labelKey) }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DashIcons } from '@/utils/dashIcons.js'

/**
 * The account menu, as the redesign has it: a small trigger on the sidebar's
 * account row rather than the row itself.
 *
 * The name, the role and the avatar moved out — `DashSide` renders `.me`, and
 * having this component draw them again meant two components owning the same
 * three lines and only one of them getting the new design.
 */
const emit = defineEmits(['settings', 'invitation-links', 'packages', 'support', 'sign-out'])

const { t } = useI18n()

const items = [
  { event: 'settings', labelKey: 'sidebar.eventSettings', icon: DashIcons.settings },
  { event: 'invitation-links', labelKey: 'sidebar.invitationLinks', icon: DashIcons.link },
  { event: 'packages', labelKey: 'sidebar.packages', icon: DashIcons.packages },
  { event: 'support', labelKey: 'sidebar.support', icon: DashIcons.support },
  {
    event: 'sign-out',
    labelKey: 'sidebar.signOut',
    tone: 'danger',
    icon: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  },
]

const root = ref(null)
const menuOpen = ref(false)

function choose(event) {
  menuOpen.value = false
  emit(event)
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) menuOpen.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') menuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.account {
  position: relative;
  margin-left: auto;
}

.account-trigger {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: #8fa398;
}

.account-trigger:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.account-trigger svg {
  width: 18px;
  height: 18px;
}

/* Opens upward: the row it hangs off is the last thing in the sidebar. */
.popup {
  position: absolute;
  z-index: 30;
  right: 0;
  bottom: calc(100% + 8px);
  min-width: 220px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  box-shadow: var(--shadow);
}

.popup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: 8px;
  text-align: left;
  font-size: 14.5px;
  color: var(--ink);
}

.popup-item:hover {
  background: var(--mist-2);
}

.popup-item svg {
  width: 17px;
  height: 17px;
  flex: none;
  color: var(--ink-3);
}

.popup-item.danger,
.popup-item.danger svg {
  color: var(--error);
}
</style>

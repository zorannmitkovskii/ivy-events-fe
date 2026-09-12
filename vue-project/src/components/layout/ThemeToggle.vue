<template>
  <button
    v-if="variant === 'icon'"
    class="icon-btn"
    type="button"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <svg v-if="dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" stroke-linecap="round" />
    </svg>
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
      <path d="M20 13.5A8.5 8.5 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5Z" stroke-linejoin="round" />
    </svg>
  </button>

  <button v-else class="theme-link" type="button" @click="toggleTheme">{{ label }}</button>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolvedTheme, toggleTheme } from '@/composables/useTheme'

/**
 * Two shapes of the same control: a text link for the footer's bottom row,
 * which is where the mockup puts it, and an icon button for the dashboard top
 * bar, which the mockup does not draw but which needs one all the same.
 */
defineProps({
  variant: { type: String, default: 'link' },
})

const { t } = useI18n()

const dark = computed(() => resolvedTheme() === 'dark')

// The label names the destination, not the current state: a viewer on a dark
// page is looking for the way back to light.
const label = computed(() => (dark.value ? t('header.theme.toLight') : t('header.theme.toDark')))
</script>

<style scoped>
/* A text link that has to sit in a row of anchors and match them exactly. */
.theme-link {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
}

.theme-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>

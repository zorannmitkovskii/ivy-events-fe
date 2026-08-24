<template>
  <nav class="quick-nav" :aria-label="t('adminOverview.quickNav')">
    <RouterLink
      v-for="item in items"
      :key="item.key"
      :to="item.to"
      class="nav-card"
      @keydown.space.prevent="activate"
    >
      <!--
        v-html because the icons are inline SVG from `utils/icons.js` — a fixed
        set of local constants, never anything a user typed. Rendering them as
        text is what the emoji version did, and it left the grid looking unlike
        every other navigation surface in the product.
      -->
      <span class="icon" aria-hidden="true" v-html="item.icon" />
      <span class="label">{{ item.label }}</span>
      <span v-if="item.badge !== null && item.badge !== undefined && item.badge > 0" class="badge">
        {{ item.badge }}
        <span class="sr-only">{{ item.badgeLabel }}</span>
      </span>
    </RouterLink>
  </nav>
</template>

<script setup>
/**
 * Shortcuts to the modules the dashboard summarises (IVY-1202).
 *
 * <p><b>Every card here goes somewhere real.</b> The caller passes only
 * destinations that exist; a tile that leads to a blank screen is worse than an
 * absent tile, because the reader learns the whole grid is unreliable.
 *
 * <p>Real links, not click handlers on divs — so middle-click, open-in-new-tab
 * and keyboard activation all work without a line of code.
 *
 * <p>A badge showing zero is removed rather than displayed: "Vendors 0" reads
 * as a problem, while no badge simply reads as no news.
 */
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineProps({
  /** `[{ key, icon, label, to, badge, badgeLabel }]` */
  items: { type: Array, required: true },
})

const { t } = useI18n()

/**
 * Space activates the card.
 *
 * <p>A link is activated by Enter and a button by either, and readers who
 * navigate by keyboard do not sort tiles into links and buttons before
 * pressing a key — on a grid that looks like buttons, Space silently scrolling
 * the page reads as a broken tile. The default is prevented for the same
 * reason.
 */
function activate(event) {
  event.currentTarget.click()
}
</script>

<style scoped>
.quick-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.nav-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border-color, #e6e5e1);
  border-radius: 12px;
  background: var(--cards-color, #fff);
  color: var(--text-color, #0b0b0b);
  text-decoration: none;
  transition: border-color 120ms ease, transform 120ms ease;
}

.nav-card:hover {
  border-color: var(--brand-main, #0b0b0b);
  transform: translateY(-1px);
}

.nav-card:active {
  transform: translateY(0);
}

.nav-card:focus-visible {
  outline: 2px solid var(--brand-main, #0b0b0b);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .nav-card {
    transition: none;
  }
  .nav-card:hover {
    transform: none;
  }
}

.icon {
  display: inline-flex;
  line-height: 1;
  color: var(--brand-main, #0b0b0b);
}

/*
  The icons in `utils/icons.js` carry no paint of their own — they are bare
  paths, and every consumer states how they are drawn. Without these four
  lines an SVG defaults to a black fill, which turned the calendar's outer
  rect into a solid square and the gear into a blob. Same rules as
  `SidebarNavItem`, where the same icons already looked right.
*/
.icon :deep(svg) {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.label {
  font-size: 0.92rem;
  font-weight: 600;
}

.badge {
  position: absolute;
  top: 10px;
  right: 12px;
  min-width: 22px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--brand-main, #0b0b0b);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>

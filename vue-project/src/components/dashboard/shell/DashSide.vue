<template>
  <router-link class="brand" :to="`/${lang}`" :aria-label="$t('header.logo')">
    <span class="ivy-logo" role="img" :aria-label="$t('header.logo')"></span>
  </router-link>

  <button class="side-close" type="button" :aria-label="$t('header.menu.closeMenu')" @click="$emit('close')">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke-linecap="round" />
    </svg>
  </button>

  <!-- What this sidebar is scoped to: the event, the organization, the vendor.
       Skipped entirely when there is nothing to name — the design's card with
       an empty line in it reads as a screen that failed to load. -->
  <div v-if="contextName" class="ctx">
    <small>{{ contextLabel }}</small>
    <b>{{ contextName }}</b>
    <span v-if="plan" class="badge-gold">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="m12 2 2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3l-6.1 3.3 1.4-6.8L2.2 9.1l6.9-.8Z" />
      </svg>{{ plan }}
    </span>
    <slot name="context" />
  </div>

  <nav class="snav" :aria-label="$t('dash.sectionsLabel')">
    <slot name="nav" />
  </nav>

  <slot name="promo" />

  <div class="me">
    <span class="av">{{ initials }}</span>
    <div>
      <b>{{ name }}</b>
      <small>{{ role }}</small>
    </div>
    <slot name="account" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * The dark sidebar, shared by all four workspaces.
 *
 * Renders straight into the `.side` element the shell supplies — it has no root
 * of its own, because `.side` is a flex column and `.upgrade`'s `margin-top:
 * auto` is what pushes the account footer down. A wrapper element here would
 * break that, silently, by making every child one row of one flex item.
 */
const props = defineProps({
  contextLabel: { type: String, default: '' },
  contextName: { type: String, default: '' },
  plan: { type: String, default: '' },
  name: { type: String, required: true },
  role: { type: String, default: '' },
})

defineEmits(['close'])

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')

const initials = computed(() =>
  (props.name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0].toUpperCase())
    .slice(0, 2)
    .join(''),
)
</script>

<style scoped>
/* `.side`, `.ctx`, `.snav`, `.upgrade` and `.me` are the design's, in
   `ivy/dash.css`. Local: the real mark, a close button for the drawer the
   design has no version of, and a nav that scrolls. */

/*
  The mockup's longest sidebar has eight rows. The event workspace has
  fourteen, and `.side` is a fixed-height flex column — so without this the nav
  simply overflows: the last rows paint straight over the upgrade card and the
  account footer, both of which are pinned to the bottom by `margin-top: auto`.

  `min-height: 0` is the half that is easy to miss. A flex item will not shrink
  below its content without it, so `overflow-y` alone changes nothing.
*/
.snav {
  min-height: 0;
  overflow-y: auto;
  /* The scrollbar is a light grey line on a very dark ground; toned to the
     sidebar rather than left as the browser's. */
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
}

.brand .ivy-logo {
  --logo-h: 22px;
  color: #fff;
}

/*
  The account row is a flex row and the mockup's names are short. A real one
  is not — "Марко Корисник" beside a sign-out pill wrapped onto three lines and
  pushed the row out of the sidebar. The name column shrinks and ellipsises
  instead; the pill beside it keeps its size.
*/
.me > div {
  min-width: 0;
}

.me b,
.me small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-close {
  display: none;
  position: absolute;
  top: 22px;
  right: 14px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  color: #c9d6ce;
}

.side-close svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 860px) {
  .side-close {
    display: grid;
    place-items: center;
  }
}
</style>

<template>
  <!--
    The scope the whole dashboard stylesheet is written under.

    `.ivy-dash` is a wrapper around `.dash`, not the same element: the design
    styles `.dash` itself, so the sheet's selectors are descendant ones. A
    dashboard page rendered outside this wrapper gets none of it — and since
    `site.css` is fenced under the same two classes, none of the buttons or
    pills either.
  -->
  <div class="ivy-dash">
    <div class="dash">
      <aside class="side" :class="{ open: drawerOpen }">
        <slot name="side" :close="close" />
      </aside>

      <!-- The design hides the sidebar outright below 860px. A drawer is kept
           instead: this dashboard has fifteen sections, and a phone with no way
           to reach fourteen of them is not a smaller version of it. -->
      <div v-if="drawerOpen" class="dash-backdrop" @click="close"></div>

      <div class="dash-body">
        <slot name="top" :toggle="toggle" />
        <main class="main">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const drawerOpen = ref(false)

function toggle() {
  drawerOpen.value = !drawerOpen.value
}

function close() {
  drawerOpen.value = false
}

watch(() => route.path, close)
</script>

<style scoped>
/* `.dash`, `.side` and `.main` are the design's, in `ivy/dash.css`. What is
   here is the drawer the design has no version of, and the column the design
   leaves as a bare `<div>`. */
.dash-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dash-backdrop {
  display: none;
}

@media (max-width: 860px) {
  .side {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1000;
    width: 248px;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
  }

  .side.open {
    display: flex;
    transform: translateX(0);
  }

  .dash-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(7, 18, 13, 0.55);
  }
}
</style>

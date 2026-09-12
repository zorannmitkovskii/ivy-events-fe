<template>
  <!--
    The shell every public page sits in.

    `.ivy-site` is not decoration — it is the scope the whole 2026 stylesheet
    is written under (`assets/styles/ivy/site.css`). The design's class names
    collide head-on with the app's own (`.btn`, `.card`, `.row`, `.link`,
    `.title`), so the sheet is scoped rather than global, and a page that
    renders the header outside this wrapper gets an unstyled list of links.

    Hence one component rather than the class repeated on a dozen pages: the
    one that forgets it is the one that breaks, and it breaks silently.
  -->
  <div class="ivy-site">
    <a class="skip" href="#main">{{ $t('a11y.skipToContent') }}</a>
    <Header />
    <main id="main">
      <slot />
    </main>
    <Footer />

    <!-- The design's phone-only bar. Shown by `.sticky-cta` in `site.css` below
         760px and nowhere else, so it costs nothing on desktop. -->
    <div v-if="!loggedIn" class="sticky-cta">
      <router-link class="btn btn-primary" :to="{ name: 'signup', params: { lang } }">
        {{ $t('header.actions.createInvitation') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/header/Header.vue'
import Footer from '@/components/layout/Footer.vue'
import { isAuthenticated } from '@/services/auth.service'
import { useReveal } from '@/composables/useReveal'

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
const loggedIn = computed(() => isAuthenticated())

// Sections marked `.reveal` fade in as they scroll into view. Done here so a
// page only has to add the class.
useReveal()
</script>

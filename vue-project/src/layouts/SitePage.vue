<template>
  <!--
    The shell every public page sits in.

    `.ivy-site` is not decoration — it is the scope the whole 2026 stylesheet
    is written under (`assets/styles/ivy/site.css`). The design's class names
    collide head-on with Bootstrap's (`.btn`, `.card`, `.link`, `.title`), so
    the sheet is scoped rather than global, and a page that renders the header
    outside this wrapper gets an unstyled list of links instead of a header.

    Hence one component rather than the class repeated on nine pages: the one
    that forgets it is the one that breaks, and it breaks silently.
  -->
  <div class="ivy-site">
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from "@/components/header/Header.vue";
import Footer from "@/components/layout/Footer.vue";
import { useReveal } from "@/composables/useReveal";

// Sections marked `.reveal` fade in as they scroll into view. Done here so a
// page only has to add the class.
useReveal();
</script>

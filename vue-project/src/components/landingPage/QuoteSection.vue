<template>
  <!--
    The redesign's testimonial band — one quotation, centred, on paper. New to
    the app: the old landing page had no social proof between the product
    sections and the closing call to action, which is exactly where the design
    puts one.
  -->
  <section class="quote reveal">
    <b aria-hidden="true">“</b>
    <blockquote>{{ $t('home.quote.text') }}</blockquote>
    <p>— {{ $t('home.quote.attribution') }}</p>
  </section>
</template>

<script setup>
import { useReveal } from "@/composables/useReveal";

useReveal();
</script>

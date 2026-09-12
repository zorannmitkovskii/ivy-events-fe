<template>
  <svg :viewBox="glyph.viewBox" fill="none" :stroke="glyph.stroke" stroke-width="1.6" aria-hidden="true" v-html="glyph.paths"></svg>
</template>

<script setup>
import { computed } from 'vue'

/*
  A drawing for a post that has no cover image.

  Every article in the mockup has a hand-drawn line illustration on a tinted
  ground. Real posts arrive from the API with a title and a category and no
  artwork, and a grid of empty tinted rectangles reads as a page that failed to
  load. So each cover gets one of five figures, picked by position — the same
  post keeps the same drawing on every visit, which a random pick would not.

  These are the design's own paths, and the stroke is the ink of the tint they
  sit on, so figure and ground stay one pair.
*/
const props = defineProps({
  seed: { type: Number, required: true },
})

const GLYPHS = [
  {
    // Globe — the diaspora piece the mockup features.
    viewBox: '0 0 120 120',
    stroke: '#1E3D30',
    paths:
      '<circle cx="60" cy="60" r="44"/><path d="M16 60h88M60 16c-16 14-16 74 0 88M60 16c16 14 16 74 0 88M24 38c20 10 52 10 72 0M24 82c20-10 52-10 72 0"/><circle cx="84" cy="34" r="6" fill="#5E7F58" stroke="none"/>',
  },
  {
    // A round table with its seats — seating plans.
    viewBox: '0 0 60 60',
    stroke: '#1E3D30',
    paths:
      '<circle cx="30" cy="30" r="12"/><circle cx="30" cy="8" r="4"/><circle cx="30" cy="52" r="4"/><circle cx="8" cy="30" r="4"/><circle cx="52" cy="30" r="4"/>',
  },
  {
    // Two cards, one behind the other — printed against digital.
    viewBox: '0 0 60 60',
    stroke: '#6F2730',
    paths:
      '<rect x="12" y="8" width="28" height="40" rx="3"/><rect x="20" y="16" width="28" height="40" rx="3" fill="#F3D7D2"/><path d="M27 32h14M27 40h10"/>',
  },
  {
    // A checklist — the week-by-week planning pieces.
    viewBox: '0 0 60 60',
    stroke: '#21474B',
    paths:
      '<rect x="10" y="10" width="40" height="42" rx="4"/><path d="m18 26 5 5 9-9M18 40l5 5 9-9M36 26h8M36 42h8"/>',
  },
  {
    // A QR code — check-in and registration.
    viewBox: '0 0 60 60',
    stroke: '#F1EADC',
    paths:
      '<rect x="10" y="10" width="16" height="16"/><rect x="34" y="10" width="16" height="16"/><rect x="10" y="34" width="16" height="16"/><path d="M34 34h6v6h-6zM44 34h6M44 44h6v6M34 44h6v6"/>',
  },
]

const glyph = computed(() => GLYPHS[props.seed % GLYPHS.length])
</script>

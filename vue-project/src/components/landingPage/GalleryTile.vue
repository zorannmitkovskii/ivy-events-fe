<template>
  <div class="tile" :class="motif.tint">
    <img v-if="src" :src="src" :alt="alt" />
    <svg v-else viewBox="0 0 80 80" fill="none" :stroke="motif.ink" stroke-width="1.5" aria-hidden="true" v-html="motif.paths"></svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

/*
  A photograph in the gallery, or a drawing where there is not one yet.

  Drawn rather than stock-photographed, deliberately. A gallery of a wedding
  wants photographs of that wedding, and the alternative — free stock — is
  worse than nothing here: the usable free catalogues are full of identifiable
  people, and putting a real person's face on a commercial page to suggest they
  were a guest at an event on this platform is not something a licence covers.
  What is left of those catalogues once faces are excluded is coffee cups and
  street corners, which read as somebody else's holiday.

  So these are line drawings on the design's own tints — the same treatment the
  mockup gives its blog covers and this repo already gives its invitation
  thumbnails in `public/thumbnails`. They look chosen instead of borrowed.

  `src` overrides all of it. Drop real photographs in and the drawing steps
  aside, which is the point: this is a placeholder that knows it is one.
*/
const props = defineProps({
  /** A real photograph, when there is one. */
  src: { type: String, default: '' },
  alt: { type: String, default: '' },
  /** Which drawing to fall back to; wraps, so any number is valid. */
  index: { type: Number, default: 0 },
})

const MOTIFS = [
  {
    // A laid place setting, from above.
    tint: 't-sage',
    ink: '#1E3D30',
    paths:
      '<circle cx="40" cy="40" r="20"/><circle cx="40" cy="40" r="13"/><path d="M17 30v20M17 30c-2 0-3 2-3 5s1 5 3 5M63 30v20M60 30v8a3 3 0 0 0 6 0v-8" stroke-linecap="round"/>',
  },
  {
    // Candles.
    tint: 't-sand',
    ink: '#4A3A20',
    paths:
      '<rect x="22" y="34" width="10" height="30" rx="2"/><rect x="38" y="26" width="10" height="38" rx="2"/><rect x="54" y="38" width="10" height="26" rx="2"/><path d="M27 34c0-4 0-6-2-8 3 0 4 3 4 5M43 26c0-5 0-7-2-9 3 0 4 4 4 6M59 38c0-4 0-5-2-7 3 0 4 3 4 5" stroke-linecap="round"/>',
  },
  {
    // A bouquet: three blooms with centres, stems gathered into a tie.
    tint: 't-rose',
    ink: '#6F2730',
    paths:
      '<circle cx="40" cy="22" r="8"/><circle cx="40" cy="22" r="2.5"/>' +
      '<circle cx="25" cy="33" r="7"/><circle cx="25" cy="33" r="2.5"/>' +
      '<circle cx="55" cy="33" r="7"/><circle cx="55" cy="33" r="2.5"/>' +
      '<path d="M40 30v26M28 39l10 12M52 39l-10 12" stroke-linecap="round"/>' +
      '<path d="M32 56h16l-3 10H35z"/>',
  },
  {
    // A tiered cake.
    tint: 't-sky',
    ink: '#21474B',
    paths:
      '<rect x="24" y="40" width="32" height="20" rx="3"/><rect x="30" y="26" width="20" height="14" rx="3"/><path d="M40 26v-7M40 19c0-3 3-3 3-5" stroke-linecap="round"/><path d="M24 50h32M30 33h20"/>',
  },
  {
    // String lights: one symmetric swag, four bulbs hung evenly off it.
    tint: 't-night',
    ink: '#F1EADC',
    paths:
      '<path d="M8 24q32 26 64 0" stroke-linecap="round"/>' +
      '<path d="M21 33v6M33 39v6M47 39v6M59 33v6" stroke-linecap="round"/>' +
      '<circle cx="21" cy="44" r="5"/><circle cx="33" cy="50" r="5"/>' +
      '<circle cx="47" cy="50" r="5"/><circle cx="59" cy="44" r="5"/>',
  },
  {
    // A toast.
    tint: 't-sand',
    ink: '#4A3A20',
    paths:
      '<path d="M22 20h16l-3 14a5 5 0 0 1-10 0zM58 20H42l3 14a5 5 0 0 0 10 0z"/><path d="M30 48v12M50 48v12M24 62h12M44 62h12" stroke-linecap="round"/>',
  },
  {
    // Confetti.
    tint: 't-lav',
    ink: '#2A2145',
    paths:
      '<path d="M20 18l4 8M36 14l2 9M54 20l-3 8M64 32l-8 3M18 36l8 3M30 34l3 7M46 38l4 6M24 52l5 5M40 50l6 4M56 48l4 6M34 64l6 3M52 62l6 2" stroke-linecap="round"/>',
  },
]

const motif = computed(() => MOTIFS[props.index % MOTIFS.length])
</script>

<style scoped>
/*
  `.gallery div` in `site.css` gives these their square, their radius and a
  gradient, and paints a highlight over them with `::after`. The tints below
  replace that gradient with the design's category palette, so the grid reads
  as seven different photographs rather than seven shades of one.

  Every selector goes through `.gallery` on purpose. The sheet writes the
  overrides it wants to keep as `.gallery div:nth-child(2)`, which scores
  (0,3,1); a plain scoped `.t-sand` scores (0,2,0) and loses, so tiles two,
  three and five would quietly keep the stock gradient while the rest changed.
*/
.gallery .tile {
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
}

/* The sheet lays a radial sheen over each tile to suggest a photograph. Over a
   line drawing it just fogs the drawing. */
.gallery .tile::after {
  display: none;
}

.gallery .tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery .tile svg {
  width: 56%;
  max-width: 74px;
  opacity: 0.85;
}

.gallery .tile.t-sage {
  background: #dce8dc;
}
.gallery .tile.t-sand {
  background: #eadfcb;
}
.gallery .tile.t-rose {
  background: #f3d7d2;
}
.gallery .tile.t-sky {
  background: #daecea;
}
.gallery .tile.t-night {
  background: #182f27;
}
.gallery .tile.t-lav {
  background: #ded8f1;
}
</style>

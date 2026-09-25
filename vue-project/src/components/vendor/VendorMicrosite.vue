<template>
  <!--
    Four models, four layouts (the 2026 "four models" microsite design).

    Not one layout with four skins any more: each model tells the vendor's
    story in its own order — services first, pictures first, a story in
    chapters, or words first. What they share is below the story: the topics,
    the inquiry form and the footer, drawn the same in all four.
  -->
  <component :is="modelComponent" v-bind="$props" />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import MicrositeClassic from '@/components/vendor/microsite/MicrositeClassic.vue'
import MicrositeGallery from '@/components/vendor/microsite/MicrositeGallery.vue'
import MicrositeScene from '@/components/vendor/microsite/MicrositeScene.vue'
import MicrositeTextual from '@/components/vendor/microsite/MicrositeTextual.vue'
import { MICROSITE_PROPS, MODEL_OF_THEME } from '@/components/vendor/microsite/useMicrosite'

const props = defineProps(MICROSITE_PROPS)

const COMPONENTS = {
  classic: MicrositeClassic,
  gallery: MicrositeGallery,
  scene: MicrositeScene,
  textual: MicrositeTextual,
}

const modelComponent = computed(() => COMPONENTS[MODEL_OF_THEME[props.theme]] ?? MicrositeClassic)

/*
  The designs are set in Playfair Display, DM Sans and Manrope — the vendor's
  page, not ivyevents.mk, so not the site's own faces. Loaded here, once, so
  only a visitor who opens a microsite downloads them.
*/
const FONTS_ID = 'ivy-microsite-fonts'
const FONTS_HREF = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700'
  + '&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700;800&display=swap'

onMounted(() => {
  if (typeof document === 'undefined' || document.getElementById(FONTS_ID)) return
  const link = document.createElement('link')
  link.id = FONTS_ID
  link.rel = 'stylesheet'
  link.href = FONTS_HREF
  document.head.appendChild(link)
})
</script>

<style src="./microsite/microsite.css"></style>

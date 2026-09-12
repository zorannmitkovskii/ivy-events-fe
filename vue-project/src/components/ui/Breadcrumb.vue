<template>
  <nav class="breadcrumb" :aria-label="$t('a11y.breadcrumb')">
    <router-link :to="`/${lang}`">{{ $t('header.menu.home') }}</router-link>
    <span aria-hidden="true">/</span>
    <span aria-current="page">{{ current }}</span>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * The two-step trail the redesign puts above a page heading.
 *
 * Two steps is all it ever is — every public page hangs directly off the home
 * page — so this takes the current page's name rather than a list of ancestors
 * it would never have more than one of.
 */
defineProps({
  current: { type: String, required: true },
})

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
</script>

<template>
  <JsonLd :schema="schema" id="category-baby" />
  <!--  <ComingSoon />-->
  <Header />
  <router-view />
</template>

<script setup>
import ComingSoon from '@/components/ComingSoon.vue'
import Header from '@/components/header/Header.vue'
import JsonLd from '@/components/seo/JsonLd.vue'
import { categoryServiceSchema } from '@/utils/jsonLdSchemas'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const schema = computed(() => categoryServiceSchema('baby', { lang: route.params.lang || 'mk' }))
</script>

<style scoped>
</style>

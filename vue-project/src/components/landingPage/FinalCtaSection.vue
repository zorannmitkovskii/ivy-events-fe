<template>
  <section class="final section">
    <div class="wrap">
      <div>
        <h2>{{ $t('home.finalCta.title') }}</h2>
        <p>{{ $t('home.finalCta.subtitle') }}</p>
      </div>
      <router-link :to="{ name: 'signup', params: { lang } }" class="btn btn-primary">
        {{ $t('home.finalCta.primaryCta') }}
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const lang = computed(() => route.params.lang || 'mk')
</script>

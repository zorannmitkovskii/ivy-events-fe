<template>
  <section class="final" id="packages">
    <p class="tag">{{ $t('home.finalCta.eyebrow') }}</p>
    <h2>
      {{ $t('home.finalCta.titleLine1') }}
      <em>{{ $t('home.finalCta.titleAccent') }}</em>
      {{ $t('home.finalCta.titleLine2') }}
    </h2>
    <p>{{ $t('home.finalCta.subtitle') }}</p>
    <div>
      <router-link :to="{ name: 'signup', params: { lang } }" class="btn gold">
        {{ $t('home.finalCta.primaryCta') }} ↗
      </router-link>
      <!-- The mock's second link goes to packages; the label here says "view
           designs" in all three locales, so it keeps its own destination. -->
      <router-link :to="{ name: 'EventInvitationsPage', params: { lang } }" class="link">
        {{ $t('home.finalCta.secondaryCta') }} →
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const lang = computed(() => route.params.lang || "mk");
</script>

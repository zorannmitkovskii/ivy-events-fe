<template>
  <RouteLoader />
  <router-view />
  <AppToast />
  <!-- Not inside the design catalogue's preview frame (INV-202): the page around it already asks. -->
  <CookieConsent v-if="!embedded" />
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import RouteLoader from "@/components/ui/RouteLoader.vue";
import AppToast from "@/components/generic/AppToast.vue";
import CookieConsent from "@/components/ui/CookieConsent.vue";
import { useSeo } from "@/composables/useSeo";

useSeo();

const route = useRoute();
const embedded = computed(() => route.query.embed === "1");
</script>

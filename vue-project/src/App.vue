<template>
  <RouteLoader />
  <router-view />
  <AppToast />
  <CookieConsent />
</template>

<script setup>
import RouteLoader from "@/components/ui/RouteLoader.vue";
import AppToast from "@/components/generic/AppToast.vue";
import CookieConsent from "@/components/ui/CookieConsent.vue";
import { useSeo } from "@/composables/useSeo";

useSeo();
</script>

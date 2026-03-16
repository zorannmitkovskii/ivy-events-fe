<template>
  <RouteLoader />
  <router-view />
  <AppToast />
</template>

<script setup>
import RouteLoader from "@/components/ui/RouteLoader.vue";
import AppToast from "@/components/generic/AppToast.vue";
</script>

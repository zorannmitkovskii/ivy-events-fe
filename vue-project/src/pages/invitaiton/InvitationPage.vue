<template>
  <InvitationHero  image="sad"/>
  <Intro />
  <Location />
  <RSVP />
  <router-view />
</template>

<script setup>
import InvitationHero from "@/components/invitation/InvitationHero.vue";
import Location from "@/components/invitation/Location.vue";
import Intro from "@/components/invitation/Intro.vue";
import RSVP from "@/components/invitation/RSVP.vue";
</script>

<style scoped>
</style>

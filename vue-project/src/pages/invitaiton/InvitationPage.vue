<template>
  <InvitationHero  image="sad"/>
  <Intro />
  <Location />
  <RSVP />
  <router-view />
</template>

<script setup>
import InvitationHero from "@/components/invitations/InvitationHero.vue";
import Location from "@/components/invitations/Location.vue";
import Intro from "@/components/invitations/Intro.vue";
import RSVP from "@/components/invitations/RSVP.vue";
</script>

<style scoped>
</style>

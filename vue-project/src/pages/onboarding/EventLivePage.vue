<template>
  <EventLiveCard
    :event="{
    image: '/img/templates/corporate.jpg',
    title: 'Annual Tech Innovators Summit 2024',
    dateText: 'Oct 24 - Oct 26, 2024',
    statusText: 'Active & Registration Open'
  }"
    shareTo="/event/123/share"
    rsvpTo="/event/123/rsvp"
    overviewTo="/event/123"
    editTo="/event/123/edit"
  />

</template>
<script setup lang="ts">

import EventLiveCard from "@/components/cards/EventLiveCard.vue";
</script>
<style scoped>

</style>

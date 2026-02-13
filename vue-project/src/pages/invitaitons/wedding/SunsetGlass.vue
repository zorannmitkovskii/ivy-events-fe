<template>
  <div class="font-body">
    <InvitationHero
      :image-url="data.heroImage"
      :couple-name="data.coupleName"
      :date-label="data.dateLabel"
      :location-html="data.locationHtml"
      @rsvp-click="scrollToRsvp"
    />

    <WeddingDetails
      :countdown-target-iso="data.countdownTargetIso"
      :ceremony-html="data.ceremonyHtml"
      :ceremony-map-url="data.mapUrl"
      :reception-html="data.receptionHtml"
      :reception-map-url="data.mapUrl"
      :venue-html="data.venueHtml"
      :venue-map-url="data.mapUrl"
    />

    <TimelineSection :items="data.timeline" />

    <OurStorySection :left-cards="data.storyCards" :images="data.storyImages" />

    <RSVPSection v-model="rsvp" :respond-by-label="data.respondByLabel" @submit="onSubmitRsvp" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import InvitationHero from "@/components/invitations/wedding/sunsetGlass/InvitationHero.vue";
import WeddingDetails from "@/components/invitations/wedding/sunsetGlass/WeddingDetails.vue";
import TimelineSection from "@/components/invitations/wedding/sunsetGlass/TimelineSection.vue";
import OurStorySection from "@/components/invitations/wedding/sunsetGlass/OurStorySection.vue";
import RSVPSection from "@/components/invitations/wedding/sunsetGlass/RSVPSection.vue";
import '@/styles/sunsetGlass.css';

const data = {
  coupleName: "Emily & James",
  dateLabel: "June 15, 2024",
  respondByLabel: "May 1, 2024",
  locationHtml: "Sunset Garden Estate<br>Santa Barbara, California",
  heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop",

  // For countdown use an ISO datetime (adjust to your real event time/timezone)
  countdownTargetIso: "2026-06-15T16:00:00",

  mapUrl: "https://maps.google.com",

  ceremonyHtml: "June 15, 2024<br>4:00 PM",
  receptionHtml: "June 15, 2024<br>6:00 PM",
  venueHtml: "Sunset Garden Estate<br>Santa Barbara, CA",

  timeline: [
    { time: "3:30 PM", title: "Guest Arrival", description: "Guests arrive and are seated in the garden ceremony area.", badgeClass: "bg-pink-300" },
    { time: "4:00 PM", title: "Ceremony Begins", description: "The wedding ceremony starts with the processional.", badgeClass: "bg-purple-300" },
    { time: "4:45 PM", title: "Cocktail Hour", description: "Enjoy drinks and hors d'oeuvres on the terrace.", badgeClass: "bg-teal-300" },
    { time: "6:00 PM", title: "Reception & Dinner", description: "Dinner service begins with toasts and speeches.", badgeClass: "bg-pink-300" },
    { time: "8:00 PM", title: "First Dance", description: "The newlyweds share their first dance.", badgeClass: "bg-purple-300" },
    { time: "8:30 PM", title: "Dancing & Celebration", description: "Dance the night away with live music and DJ.", badgeClass: "bg-teal-300" },
  ],

  storyCards: [
    {
      title: "How We Met",
      text: "We met at a coffee shop in downtown Santa Barbara on a rainy afternoon in 2019. James accidentally spilled his latte on Emily's laptop, and the rest is history.",
    },
    {
      title: "The Proposal",
      text: "On a sunset hike at our favorite trail, James got down on one knee overlooking the ocean. She said yes before he could even finish the question!",
    },
  ],

  storyImages: [
    { src: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop", alt: "Our Story 1", className: "" },
    { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop", alt: "Our Story 2", className: "mt-8" },
    { src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=500&fit=crop", alt: "Our Story 3", className: "-mt-8" },
    { src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=500&fit=crop", alt: "Our Story 4", className: "" },
  ],
};

const route = useRoute();
const router = useRouter();
const eventId = route.query.eventId;

const rsvp = ref({
  fullNames: [""],
  notificationType: "",
  email: "",
  phone: "",
  attendance: "",
  dietary: "",
  message: "",
});

function scrollToRsvp() {
  document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function onSubmitRsvp(payload) {
  if (!eventId) return;
  try {
    await rsvpService.submitRsvp(eventId, payload);
    const names = payload.fullNames || [];
    router.push({
      name: 'RsvpSuccessSubmitPage',
      params: { lang: route.params.lang || 'mk' },
      query: { names: JSON.stringify(names) },
    });
  } catch (e) {
    console.error('RSVP submit failed:', e);
  }
}
</script>

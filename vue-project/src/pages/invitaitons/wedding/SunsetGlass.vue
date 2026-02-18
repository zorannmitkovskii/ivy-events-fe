<template>
  <div class="font-body">
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;min-height:100vh;">
      <div style="width:40px;height:40px;border:3px solid rgba(0,0,0,0.1);border-top-color:#a78bfa;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
    </div>
    <div v-show="!loading">
    <InvitationHero
      :image-url="data.heroImage"
      :couple-name="data.coupleName"
      :date-label="data.dateLabel"
      :location-html="data.locationHtml"
      :map-url="data.heroMapUrl"
      @rsvp-click="scrollToRsvp"
    />

    <WeddingDetails
      :countdown-target-iso="data.countdownTargetIso"
      :ceremony-html="data.ceremonyHtml"
      :ceremony-map-url="data.ceremonyMapUrl || data.mapUrl"
      :reception-html="data.receptionHtml"
      :reception-map-url="data.receptionMapUrl || data.mapUrl"
      :venue-html="data.venueHtml"
      :venue-map-url="data.venueMapUrl || data.mapUrl"
    />

    <TimelineSection :items="data.timeline" />

    <OurStorySection :left-cards="data.storyCards" :images="data.storyImages" />

    <RSVPSection v-model="rsvp" :respond-by-label="data.respondByLabel" @submit="onSubmitRsvp" />
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import { useInvitationData } from '@/composables/useInvitationData';
import InvitationHero from "@/components/invitations/wedding/sunsetGlass/InvitationHero.vue";
import WeddingDetails from "@/components/invitations/wedding/sunsetGlass/WeddingDetails.vue";
import TimelineSection from "@/components/invitations/wedding/sunsetGlass/TimelineSection.vue";
import OurStorySection from "@/components/invitations/wedding/sunsetGlass/OurStorySection.vue";
import RSVPSection from "@/components/invitations/wedding/sunsetGlass/RSVPSection.vue";
import '@/styles/sunsetGlass.css';

const { eventId: invEventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();

const data = reactive({
  coupleName: "Emily & James",
  dateLabel: "June 15, 2024",
  respondByLabel: "May 1, 2024",
  locationHtml: "Sunset Garden Estate<br>Santa Barbara, California",
  heroImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop",

  // For countdown use an ISO datetime (adjust to your real event time/timezone)
  countdownTargetIso: "2026-06-15T16:00:00",

  heroMapUrl: "",
  mapUrl: "https://maps.google.com",
  ceremonyMapUrl: "",
  receptionMapUrl: "",
  venueMapUrl: "",

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
});

const route = useRoute();
const router = useRouter();
const eventId = invEventId;

const rsvp = ref({
  fullNames: [""],
  notificationType: "",
  email: "",
  phone: "",
  attendance: "",
  dietary: "",
  message: "",
});

function applyBackendData(raw) {
  const ev = raw.event;
  if (!ev) return;

  if (ev.coupleNames?.bride && ev.coupleNames?.groom) {
    data.coupleName = `${ev.coupleNames.bride} & ${ev.coupleNames.groom}`;
  }
  if (ev.heroImageUrl) data.heroImage = ev.heroImageUrl;
  if (ev.date) {
    data.dateLabel = formatDate(ev.date);
    data.countdownTargetIso = ev.date;
  }
  if (ev.rsvpDeadline) data.respondByLabel = formatDate(ev.rsvpDeadline);

  const subtitle = localized(ev.messageI18n, ev.message);
  if (subtitle) data.locationHtml = subtitle;

  if (raw.location) {
    const loc = raw.location;
    const addressParts = [loc.city, loc.country].filter(Boolean).join(', ') || loc.address || '';
    const parts = [loc.venueName, addressParts].filter(Boolean);
    data.locationHtml = parts.join('<br>');

    const mapUrl = loc.mapUrl
      || (loc.latitude != null && loc.longitude != null
        ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`
        : '');
    if (mapUrl) {
      data.mapUrl = mapUrl;
      data.heroMapUrl = mapUrl;
    }
  }

  // Wedding details → ceremony/reception/venue HTML
  if (Array.isArray(raw.weddingDetails) && raw.weddingDetails.length) {
    const sorted = [...raw.weddingDetails].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    sorted.forEach((d) => {
      const title = localized(d.titleI18n, d.title);
      const desc = localized(d.descriptionI18n, d.description);
      const line = [title, desc].filter(Boolean).join('<br>');
      if (d.icon === 'church' || title?.toLowerCase().includes('ceremon')) {
        data.ceremonyHtml = line;
        data.ceremonyMapUrl = d.location?.mapUrl || data.mapUrl;
      } else if (d.icon === 'party' || title?.toLowerCase().includes('recept')) {
        data.receptionHtml = line;
        data.receptionMapUrl = d.location?.mapUrl || data.mapUrl;
      } else if (d.icon === 'hotel' || title?.toLowerCase().includes('venue')) {
        data.venueHtml = line;
        data.venueMapUrl = d.location?.mapUrl || data.mapUrl;
      }
    });
  }

  // Agenda → timeline
  if (Array.isArray(raw.agenda) && raw.agenda.length) {
    const badgeClasses = ['bg-pink-300', 'bg-purple-300', 'bg-teal-300'];
    data.timeline = [...raw.agenda]
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((a, i) => ({
        time: a.startTime || '',
        title: localized(a.titleI18n, a.title),
        description: localized(a.descriptionI18n, a.description),
        badgeClass: badgeClasses[i % 3],
      }));
  }

  // Our Story
  if (Array.isArray(raw.ourStory) && raw.ourStory.length) {
    data.storyCards = raw.ourStory.map((s) => ({
      title: localized(s.titleI18n, s.title),
      text: localized(s.descriptionI18n, s.description),
    }));
    const imgSources = Array.isArray(raw.ourStoryImages) && raw.ourStoryImages.length
      ? raw.ourStoryImages
      : raw.ourStory.filter((s) => s.imageUrl).map((s) => s.imageUrl);
    if (imgSources.length) {
      data.storyImages = imgSources.map((src, i) => ({
        src,
        alt: 'Our Story ' + (i + 1),
        className: i % 2 === 1 ? 'mt-8' : '',
      }));
    }
  }
}

onMounted(async () => {
  const result = await fetchData();
  if (result) applyBackendData(result);
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

<template>
  <div class="wedding-invitation-two">
    <div class="invitation-wrapper">
      <!-- Hero Banner -->
      <HeroBanner
        :bride-name="config.brideName"
        :groom-name="config.groomName"
        :wedding-date="config.weddingDate"
        :couple-photo-url="config.couplePhotoUrl"
      />

      <div class="invitation-container">
        <!-- Wedding Details Cards -->
        <WeddingDetailsCards
          :date="config.weddingDate"
          :time="config.ceremonyTime"
          :venue="config.venueName"
          :address="config.venueAddress"
          :ceremony-map-url="config.ceremonyMapUrl"
          :reception-map-url="config.receptionMapUrl"
          :wedding-date-time="config.weddingDateTime"
        />

        <!-- Agenda Timeline -->
        <AgendaTimeline :events="config.timelineEvents" />

        <!-- Our Story -->
        <OurStory :stories="config.stories" />

        <!-- RSVP Section -->
        <RsvpSection
          :max-responses="999"
          @submit="handleRsvpSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import HeroBanner from '@/components/invitations/wedding/InvitationTwo/HeroBanner.vue';
import WeddingDetailsCards from '@/components/invitations/wedding/InvitationTwo/WeddingDetailsCards.vue';
import AgendaTimeline from '@/components/invitations/wedding/InvitationTwo/AgendaTimeline.vue';
import OurStory from '@/components/invitations/wedding/InvitationTwo/OurStory.vue';
import RsvpSection from '@/components/invitations/wedding/InvitationTwo/RsvpSection.vue';

const route = useRoute();

const config = reactive({
  brideName: 'Olivia',
  groomName: 'James',
  couplePhotoUrl: null,
  weddingDate: 'Saturday, September 20, 2025',
  weddingDateTime: '2025-09-20T15:00:00',
  ceremonyTime: '3:00 PM',
  venueName: 'Willow Creek Gardens',
  venueAddress: '456 Botanical Lane, Greenfield',
  ceremonyMapUrl: 'https://maps.google.com/?q=Willow+Creek+Gardens',
  receptionMapUrl: 'https://maps.google.com/?q=Willow+Creek+Gardens',
  timelineEvents: [
    { time: '3:00 PM', title: 'Ceremony', description: 'Exchange of vows in the garden pavilion' },
    { time: '4:00 PM', title: 'Cocktail Hour', description: 'Drinks and canapes on the terrace' },
    { time: '5:30 PM', title: 'Dinner', description: 'Seated dinner in the grand hall' },
    { time: '7:30 PM', title: 'First Dance', description: 'The couple takes the floor' },
    { time: '8:00 PM', title: 'Dancing & Celebration', description: 'Party the night away' }
  ],
  stories: [
    {
      title: 'How We Met',
      text: 'It all started on a rainy afternoon at a small bookshop downtown. We reached for the same book at the same time, and that moment changed everything.',
      imageUrl: null
    },
    {
      title: 'The First Date',
      text: 'A walk through the botanical gardens turned into hours of conversation. We lost track of time completely, talking until the park closed.',
      imageUrl: null
    },
    {
      title: 'The Proposal',
      text: 'Under a canopy of twinkling lights in our favorite garden, surrounded by the scent of jasmine and roses, the question was asked — and the answer was yes.',
      imageUrl: null
    }
  ]
});

async function handleRsvpSubmit(rsvpData) {
  console.log('RSVP submitted:', rsvpData);
  return true;
}

onMounted(async () => {
  const invitationId = route.params.invitationId;
  if (invitationId) {
    // TODO: Load wedding data from API
  }
});
</script>

<style scoped>
.wedding-invitation-two {
  min-height: 100vh;
  background-color: #FAF8F5;
  position: relative;
}

/* Paper texture background */
.wedding-invitation-two::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23C8A870' fill-opacity='0.03'%3E%3Cpath d='M5 0h1L0 5V4zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

.invitation-wrapper {
  width: 100%;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

.invitation-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px 80px;
}
</style>

<template>
  <div class="persian-wedding">
    <!-- Hero -->
    <HeroSection
      :bride-name="config.brideName"
      :groom-name="config.groomName"
      :wedding-date="config.weddingDate"
      :subtitle="config.subtitle"
      :venue="config.venue"
      :location="config.location"
      :photo-url="config.heroPhotoUrl"
      :cta-label="config.ctaLabel"
      :accent-color="palette.pink"
      :gradient-start="palette.gradientStart"
      :gradient-mid="palette.gradientMid"
      :gradient-end="palette.gradientEnd"
    />

    <!-- Details Section -->
    <section class="section section--white">
      <div class="section-inner">
        <h2 class="section-title">Wedding Details</h2>

        <!-- Countdown -->
        <div class="countdown-wrapper">
          <CountdownTimer
            :target-date="config.weddingDateTime"
            label="Countdown to Our Special Day"
            :show-seconds="true"
            :colors="[palette.pink, palette.purple, palette.teal, palette.pinkLight]"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            label-color="#555"
            unit-label-color="#666"
          />
        </div>

        <!-- Detail Cards -->
        <div class="details-grid">
          <DetailCard
            title="Ceremony"
            :accent-color="palette.pink"
            :bg-color="palette.pinkBg"
            :icon-bg="palette.pinkIcon"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            border-width="0"
            border-radius="16px"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </template>
            <p class="bold">{{ config.ceremonyDate }}</p>
            <p>{{ config.ceremonyTime }}</p>
            <template #footer>
              <a v-if="config.ceremonyMapUrl" :href="config.ceremonyMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: palette.pink }">View Map</a>
            </template>
          </DetailCard>

          <DetailCard
            title="Reception"
            :accent-color="palette.purple"
            :bg-color="palette.purpleBg"
            :icon-bg="palette.purpleIcon"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            border-width="0"
            border-radius="16px"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </template>
            <p class="bold">{{ config.receptionDate }}</p>
            <p>{{ config.receptionTime }}</p>
            <template #footer>
              <a v-if="config.receptionMapUrl" :href="config.receptionMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: palette.purple }">View Map</a>
            </template>
          </DetailCard>

          <DetailCard
            title="Venue"
            :accent-color="palette.teal"
            :bg-color="palette.tealBg"
            :icon-bg="palette.tealIcon"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            :shadow="shadows.card"
            :hover-shadow="shadows.cardHover"
            border-width="0"
            border-radius="16px"
          >
            <template #icon>
              <svg class="card-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </template>
            <p class="bold">{{ config.venueName }}</p>
            <p>{{ config.venueAddress }}</p>
            <template #footer>
              <a v-if="config.venueMapUrl" :href="config.venueMapUrl" target="_blank" rel="noopener" class="map-btn" :style="{ background: palette.teal }">View Map</a>
            </template>
          </DetailCard>
        </div>
      </div>
    </section>

    <!-- Agenda Timeline -->
    <section class="section section--gradient">
      <div class="section-inner section-inner--narrow">
        <VerticalTimeline
          title="Wedding Day Timeline"
          :events="config.agendaEvents"
          :pill-colors="[palette.pink, palette.purple, palette.teal]"
          :card-shadow="shadows.card"
          card-radius="16px"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- Our Story -->
    <section class="section section--white">
      <div class="section-inner">
        <OurStorySection
          :title="config.storyTitle"
          :stories="config.stories"
          :photos="config.storyPhotos"
          :card-colors="[palette.pinkBg, palette.purpleBg]"
          :card-shadow="shadows.card"
          card-radius="16px"
          :heading-font="fonts.heading"
          :body-font="fonts.body"
        />
      </div>
    </section>

    <!-- RSVP -->
    <section id="rsvp-section" class="section section--gradient">
      <div class="section-inner section-inner--narrow">
        <h2 class="section-title">RSVP</h2>
        <p class="section-sub">Please respond by {{ config.rsvpDeadline }}</p>

        <div class="rsvp-wrapper">
          <RsvpForm
            title=""
            :accent-color="palette.pink"
            :accept-color="palette.teal"
            :decline-color="palette.pinkLight"
            :button-bg="palette.pink"
            button-text="#fff"
            :heading-font="fonts.heading"
            :body-font="fonts.body"
            border-radius="8px"
            name-label="Full Name"
            name-placeholder="Enter your full name"
            add-guest-label="Add Guest"
            accept-label="Joyfully Accept"
            decline-label="Regretfully Decline"
            message-label="Special Message (Optional)"
            message-placeholder="Dietary restrictions, song requests, or well wishes..."
            submit-label="Submit RSVP"
            @submit="onRsvpSubmit"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
import HeroSection from '@/components/invitations/wedding/PersianWedding/HeroSection.vue';
import OurStorySection from '@/components/invitations/wedding/PersianWedding/OurStorySection.vue';
import DetailCard from '@/components/invitations/shared/DetailCard.vue';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import VerticalTimeline from '@/components/invitations/shared/VerticalTimeline.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';

const route = useRoute();
const router = useRouter();
const eventId = route.query.eventId;

const palette = {
  pink: '#F9A8D4',
  pinkLight: '#FBCFE8',
  pinkBg: '#FFF1F2',
  pinkIcon: '#FBCFE8',
  purple: '#C4B5FD',
  purpleBg: '#F5F3FF',
  purpleIcon: '#DDD6FE',
  teal: '#6EE7B7',
  tealBg: '#F0FDFA',
  tealIcon: '#A7F3D0',
  gradientStart: '#FFE5EC',
  gradientMid: '#E5D4ED',
  gradientEnd: '#D4F1E8',
};

const fonts = {
  heading: "'Playfair Display', serif",
  body: "'Lato', sans-serif",
};

const shadows = {
  card: '0px 4px 20px rgba(200, 180, 220, 0.15)',
  cardHover: '0px 6px 24px rgba(200, 180, 220, 0.25)',
};

const config = reactive({
  brideName: 'Emily',
  groomName: 'James',
  weddingDate: 'June 15, 2024',
  weddingDateTime: '2024-06-15T16:00:00',
  subtitle: 'are getting married',
  venue: 'Sunset Garden Estate',
  location: 'Santa Barbara, California',
  ctaLabel: 'RSVP Now',
  heroPhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=1000&fit=crop',

  ceremonyDate: 'June 15, 2024',
  ceremonyTime: '4:00 PM',
  ceremonyMapUrl: '#',
  receptionDate: 'June 15, 2024',
  receptionTime: '6:00 PM',
  receptionMapUrl: '#',
  venueName: 'Sunset Garden Estate',
  venueAddress: 'Santa Barbara, CA',
  venueMapUrl: '#',

  agendaEvents: [
    { time: '3:30 PM', title: 'Guest Arrival', subtitle: 'Guests arrive and are seated in the garden ceremony area.' },
    { time: '4:00 PM', title: 'Ceremony Begins', subtitle: 'The wedding ceremony starts with the processional.' },
    { time: '4:45 PM', title: 'Cocktail Hour', subtitle: "Enjoy drinks and hors d'oeuvres on the terrace." },
    { time: '6:00 PM', title: 'Reception & Dinner', subtitle: 'Dinner service begins with toasts and speeches.' },
    { time: '8:00 PM', title: 'First Dance', subtitle: 'The newlyweds share their first dance.' },
    { time: '8:30 PM', title: 'Dancing & Celebration', subtitle: 'Dance the night away with live music and DJ.' },
  ],

  storyTitle: 'Our Love Story',
  stories: [
    {
      title: 'How We Met',
      text: "We met at a coffee shop in downtown Santa Barbara on a rainy afternoon in 2019. James accidentally spilled his latte on Emily's laptop, and the rest is history. What started as an awkward apology turned into hours of conversation.",
    },
    {
      title: 'The Proposal',
      text: 'On a sunset hike at our favorite trail, James got down on one knee overlooking the ocean. With tears in his eyes, he asked Emily to spend forever with him. She said yes before he could even finish the question!',
    },
  ],
  storyPhotos: [
    { url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop', alt: 'Our Story 1' },
    { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=500&fit=crop', alt: 'Our Story 2' },
    { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=500&fit=crop', alt: 'Our Story 3' },
    { url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=400&h=500&fit=crop', alt: 'Our Story 4' },
  ],

  rsvpDeadline: 'May 1, 2024',
});

onMounted(() => {
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Lato:wght@400;500;600;700&display=swap',
  ];
  fontLinks.forEach(href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });
});

async function onRsvpSubmit(payload) {
  if (!eventId) return;
  try {
    await rsvpService.submitRsvp(eventId, payload);
    const names = payload.guests ? payload.guests.map(g => g.fullName) : [];
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

<style scoped>
.persian-wedding {
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Lato', sans-serif;

  font-family: var(--font-body);
  background: #fff;
  color: #555;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

/* Sections */
.section {
  padding: 80px 24px;
}

.section--white {
  background: #fff;
}

.section--gradient {
  background: linear-gradient(135deg, #FFE5EC 0%, #E5D4ED 50%, #D4F1E8 100%);
}

.section-inner {
  max-width: 1100px;
  margin: 0 auto;
}

.section-inner--narrow {
  max-width: 800px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: 40px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin: 0 0 12px;
}

.section-sub {
  font-family: var(--font-body);
  font-size: 16px;
  color: #666;
  text-align: center;
  margin: 0 0 48px;
}

/* Countdown wrapper */
.countdown-wrapper {
  background: linear-gradient(135deg, #FFE5EC 0%, #E5D4ED 50%, #D4F1E8 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 16px;
  box-shadow: 0px 4px 20px rgba(200, 180, 220, 0.15);
  padding: 40px;
  margin-bottom: 48px;
}

/* Details grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* SVG icons in detail cards */
:deep(.card-svg) {
  width: 32px;
  height: 32px;
}

/* Map buttons in detail card footers */
:deep(.map-btn) {
  display: inline-block;
  color: #fff;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
}

:deep(.map-btn:hover) {
  opacity: 0.85;
  transform: translateY(-1px);
}

/* RSVP wrapper */
.rsvp-wrapper {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0px 4px 20px rgba(200, 180, 220, 0.15);
  padding: 40px 48px;
}

/* Responsive */
@media (max-width: 768px) {
  .section {
    padding: 56px 16px;
  }

  .details-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }

  .section-title {
    font-size: 32px;
  }

  .countdown-wrapper {
    padding: 24px;
  }

  .rsvp-wrapper {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .rsvp-wrapper {
    padding: 20px 16px;
  }
}
</style>

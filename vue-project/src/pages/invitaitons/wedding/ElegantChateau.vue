<template>
  <div ref="rootRef" class="elegant-chateau">
    <!-- Loading overlay -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>

    <div v-show="!loading">

      <!-- COVER SCREEN -->
      <div v-if="showCover" class="cover-screen" :class="{ 'cover-hidden': coverFading }">
        <div class="polaroid-stack" :class="{ expanding: polaroidExpanding }" @click="revealSite">
          <div class="polaroid polaroid-1">
            <img :src="config.collagePhotos[0].url" :alt="config.collagePhotos[0].alt" />
          </div>
          <div class="polaroid polaroid-2">
            <img :src="config.collagePhotos[1].url" :alt="config.collagePhotos[1].alt" />
          </div>
          <div class="polaroid polaroid-3">
            <img :src="config.collagePhotos[2].url" :alt="config.collagePhotos[2].alt" />
            <div class="polaroid-label">{{ config.brideName }} & {{ config.groomName }}</div>
          </div>
        </div>

        <div class="cover-hint">
          <p class="cover-est">Est. {{ new Date().getFullYear() }}</p>
          <p class="cover-tap">{{ t('invitation.tapToOpen') }}</p>
        </div>
      </div>

      <!-- HERO SECTION -->
      <header v-show="mainVisible" class="ec-hero" :class="{ 'ec-hero-visible': mainVisible }">
        <div class="ec-hero-content">
          <p class="ec-hero-label">{{ config.inviteText }}</p>
          <h1 class="ec-hero-names">
            {{ config.brideName }} <span class="ec-hero-amp">&amp;</span><br>{{ config.groomName }}
          </h1>
          <div class="ec-hero-meta">
            <span>{{ config.weddingDate }}</span>
            <span class="ec-hero-dot"></span>
            <span>{{ config.location }}</span>
          </div>
        </div>

        <!-- Hero Image Grid -->
        <div class="ec-hero-grid">
          <div class="ec-hero-main">
            <img :src="config.heroPhotoUrl" alt="Couple" />
          </div>
          <div class="ec-hero-side">
            <div class="ec-hero-side-img">
              <img :src="config.collagePhotos[0].url" :alt="config.collagePhotos[0].alt" />
            </div>
            <div class="ec-hero-side-quote">
              <p class="ec-quote-text">"{{ config.heroQuote }}"</p>
            </div>
          </div>
        </div>
      </header>

      <!-- OUR STORY SLIDER -->
      <section v-show="mainVisible" id="story-section" class="ec-section ec-section--white" data-reveal>
        <div class="ec-section-inner">
          <div class="ec-story-header">
            <div>
              <h2 class="ec-section-title">{{ config.storyTitle }}</h2>
              <p class="ec-section-subtitle">{{ t('invitation.storySubtitle') }}</p>
            </div>
            <div class="ec-slider-arrows">
              <button class="ec-arrow-btn" @click="scrollSlider('left')" aria-label="Previous">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </button>
              <button class="ec-arrow-btn" @click="scrollSlider('right')" aria-label="Next">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div ref="sliderRef" class="ec-slider">
          <div v-for="(story, i) in config.stories" :key="i" class="ec-slide">
            <div class="ec-slide-card">
              <div class="ec-slide-image">
                <img v-if="story.imageUrl" :src="story.imageUrl" :alt="story.title" />
                <div v-if="story.date" class="ec-slide-date">{{ story.date }}</div>
              </div>
              <div class="ec-slide-body">
                <h3 class="ec-slide-title">{{ story.title }}</h3>
                <p class="ec-slide-text">{{ story.text }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- DETAILS SECTION -->
      <section v-show="mainVisible" id="details-section" class="ec-section ec-section--warm" data-reveal>
        <div class="ec-section-inner">
          <div class="ec-section-header-center">
            <h2 class="ec-section-title">{{ t('invitation.theWeddingWeekend') }}</h2>
            <p class="ec-section-subtitle">{{ t('invitation.celebrateWithUs') }}</p>
          </div>

          <!-- Countdown -->
          <div class="ec-countdown-wrap">
            <CountdownTimer
              :target-date="config.weddingDateTime"
              :show-seconds="false"
              :colors="[palette.primary600, palette.primary600]"
              :heading-font="fonts.heading"
              :body-font="fonts.body"
              unit-label-color="#666666"
            />
          </div>

          <div class="ec-details-grid">
            <div
              v-for="(detail, i) in config.weddingDetails"
              :key="i"
              class="ec-detail-card"
              :class="{ 'ec-detail-card--highlight': detail.highlight }"
            >
              <div class="ec-detail-icon">
                <svg v-if="detail.icon === 'drinks'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8h14z"/></svg>
                <svg v-else-if="detail.icon === 'heart'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <svg v-else-if="detail.icon === 'coffee'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 class="ec-detail-title">{{ detail.title }}</h3>
              <p class="ec-detail-time">{{ detail.time }}</p>
              <p class="ec-detail-desc">{{ detail.description }}</p>
              <a v-if="detail.mapUrl" :href="detail.mapUrl" target="_blank" rel="noopener" class="ec-detail-map">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {{ t('invitation.viewLocation') }}
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- RSVP SECTION -->
      <section v-show="mainVisible" id="rsvp-section" class="ec-section ec-section--white ec-section--rsvp" data-reveal>
        <div class="ec-rsvp-bg"></div>
        <div class="ec-section-inner ec-section-inner--narrow ec-rsvp-content">
          <div class="ec-section-header-center">
            <h2 class="ec-section-title ec-section-title--large">{{ t('invitation.willYouJoinUs') }}</h2>
          </div>

          <div class="ec-rsvp-form-wrap">
            <RsvpForm
              title=""
              :subtitle="t('invitation.rsvpKindlyRespond', { date: config.rsvpDeadline })"
              :name-label="t('invitation.fullName')"
              :name-placeholder="t('invitation.namePlaceholder')"
              :add-guest-label="t('invitation.addGuest')"
              :accept-label="t('invitation.joyfullyAccepts')"
              :decline-label="t('invitation.regretfullyDeclines')"
              :message-label="t('invitation.yourMessage')"
              :message-placeholder="t('invitation.messagePlaceholder')"
              :submit-label="t('invitation.sendRsvp')"
              :accent-color="palette.primary500"
              :accept-color="palette.primary200"
              :decline-color="palette.neutral200"
              :button-bg="palette.neutral900"
              button-text="#fff"
              :heading-font="fonts.heading"
              :body-font="fonts.body"
              border-radius="4px"
              @submit="onRsvpSubmit"
            />
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { rsvpService } from '@/services/rsvp.service';
 import { mediaService } from '@/services/media.service';
import { useInvitationData } from '@/composables/useInvitationData';
import { useScrollReveal } from '@/composables/useScrollReveal';
import { buildLocationAddress, buildMapUrl, formatTimeRange } from '@/utils/invitation';
import CountdownTimer from '@/components/invitations/shared/CountdownTimer.vue';
import RsvpForm from '@/components/invitations/shared/RsvpForm.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { eventId, loading, localized, formatDate, formatTime, fetchData } = useInvitationData();

const rootRef = ref(null);
const showCover = ref(true);
const coverFading = ref(false);
const polaroidExpanding = ref(false);
const mainVisible = ref(false);
const sliderRef = ref(null);

useScrollReveal(rootRef);

const palette = {
  primary200: '#eaddd7',
  primary500: '#9f8274',
  primary600: '#8a6b5d',
  neutral200: '#c8c8c8',
  neutral900: '#1a1a1a',
  bg50: '#f9f8f6',
  bg100: '#f2efe9',
};

const fonts = {
  heading: "'Playfair Display', serif",
  body: "'Lato', sans-serif",
};

const config = reactive({
  brideName: 'Sophie',
  groomName: 'Alexander',
  weddingDate: 'September 14, 2024',
  weddingDateTime: '2024-09-14T16:00:00',
  inviteText: 'We are getting married',
  location: 'Chateau de Santeny, France',
  heroMapUrl: '',
  ctaLabel: 'RSVP',
  heroPhotoUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1600&q=80',
  heroQuote: 'Forever begins now.',

  collagePhotos: [
    { url: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1000&q=80', alt: 'Wedding detail' },
    { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1000&q=80', alt: 'Couple laughing' },
    { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1000&q=80', alt: 'Main photo' },
  ],

  weddingDetails: [
    {
      icon: 'drinks',
      title: 'Welcome Drinks',
      time: 'Friday, Sept 13 \u2022 6:00 PM',
      description: 'Join us for cocktails and hors d\'oeuvres to kick off the festivities at the Hotel Courtyard.',
      mapUrl: '#',
      highlight: false,
    },
    {
      icon: 'heart',
      title: 'The Ceremony',
      time: 'Saturday, Sept 14 \u2022 4:00 PM',
      description: 'The main event. Garden attire requested. Dinner and dancing to follow immediately after.',
      mapUrl: '#',
      highlight: true,
    },
    {
      icon: 'coffee',
      title: 'Farewell Brunch',
      time: 'Sunday, Sept 15 \u2022 10:00 AM',
      description: 'Stop by for coffee and croissants before you head home. We\'d love to say goodbye!',
      mapUrl: '#',
      highlight: false,
    },
  ],

  storyTitle: 'Our Story',
  stories: [
    {
      date: '2019',
      title: 'The First Encounter',
      text: 'It started with a spilled latte in a crowded Parisian cafe. Alexander offered his napkin, Sophie offered a laugh, and three hours later, neither wanted to leave.',
      imageUrl: 'https://images.unsplash.com/photo-1522673607200-1645062cd958?w=1000&q=80',
    },
    {
      date: '2022',
      title: 'The Yes',
      text: 'On a quiet hike through the Swiss Alps, surrounded by nothing but snow and silence, Alexander got down on one knee. It was the easiest question Sophie ever answered.',
      imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1000&q=80',
    },
    {
      date: '2023',
      title: 'Building a Life',
      text: 'From adopting our golden retriever, Barnaby, to renovating our first apartment, every day has been an adventure we\'re grateful to share together.',
      imageUrl: 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?w=1000&q=80',
    },
  ],

  rsvpDeadline: 'August 1st, 2024',
});

function revealSite() {
  polaroidExpanding.value = true;
  setTimeout(() => {
    coverFading.value = true;
    mainVisible.value = true;
    setTimeout(() => {
      showCover.value = false;
    }, 800);
  }, 600);
}

function scrollSlider(direction) {
  if (!sliderRef.value) return;
  const amount = direction === 'left' ? -420 : 420;
  sliderRef.value.scrollBy({ left: amount, behavior: 'smooth' });
}

function applyBackendData(data) {
  const ev = data.event;
  if (!ev) return;

  if (ev.coupleNames?.bride) config.brideName = ev.coupleNames.bride;
  if (ev.coupleNames?.groom) config.groomName = ev.coupleNames.groom;
  if (ev.heroImageUrl) config.heroPhotoUrl = ev.heroImageUrl;

  if (ev.date) {
    config.weddingDateTime = ev.date;
    config.weddingDate = formatDate(ev.date);
  }

  const subtitle = localized(ev.messageI18n, ev.message);
  if (subtitle) config.inviteText = subtitle;

  if (data.location) {
    const loc = data.location;
    const locationStr = [loc.city, loc.country].filter(Boolean).join(', ')
      || loc.venueName || loc.address || '';
    if (locationStr) config.location = locationStr;
    const mapUrl = buildMapUrl(loc);
    if (mapUrl) config.heroMapUrl = mapUrl;
  }

  // Agenda → detail cards with highlight on ceremony-type items
  const ceremonyTypes = ['CEREMONY', 'CHURCH'];
  if (Array.isArray(data.agenda) && data.agenda.length) {
    const sorted = [...data.agenda].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    // Icon mapping from agenda type
    const typeToIcon = {
      CEREMONY: 'heart', CHURCH: 'heart', RECEPTION: 'drinks',
      COCKTAIL: 'drinks', DINNER: 'coffee', DANCE: 'heart',
      BRUNCH: 'coffee', WELCOME: 'drinks',
    };

    config.weddingDetails = sorted.map((a) => ({
      icon: a.icon || typeToIcon[a.type] || 'heart',
      title: a.title || '',
      time: formatTimeRange(a.startTime, a.endTime),
      description: [
        buildLocationAddress(a.location),
        a.description || '',
      ].filter(Boolean).join(' — ') || '',
      mapUrl: buildMapUrl(a.location),
      highlight: ceremonyTypes.includes(a.type),
    }));
  }

  // Our Story (NOT from agenda — that was a bug)
  if (Array.isArray(data.ourStory) && data.ourStory.length) {
    const ourStoryImages = Array.isArray(data.ourStoryImages) ? data.ourStoryImages : [];
    config.stories = data.ourStory.map((s, i) => ({
      date: s.date || '',
      title: localized(s.titleI18n, s.title),
      text: localized(s.descriptionI18n, s.description),
      imageUrl: ourStoryImages[i] || s.imageUrl || '',
    }));
    const allImages = config.stories.map(s => s.imageUrl).filter(Boolean);
    if (allImages.length) {
      config.collagePhotos = allImages.slice(0, 3).map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    }
  }

  if (ev.rsvpDeadline) config.rsvpDeadline = formatDate(ev.rsvpDeadline);
}

async function loadGalleryImages() {
  if (!eventId) return;
  try {
    const raw = await mediaService.list(eventId, { page: 0, size: 30 });
    const items = Array.isArray(raw?.content) ? raw.content : Array.isArray(raw) ? raw : [];
    const imageUrls = items
      .filter((m) => m.fileType?.startsWith('image'))
      .map((m) => m.fileUrl || m.url)
      .filter(Boolean);
    if (!imageUrls.length) return;

    if (!config.heroPhotoUrl) {
      config.heroPhotoUrl = imageUrls[0];
    }

    if (!config.collagePhotos.length) {
      config.collagePhotos = imageUrls.slice(0, 3).map((url, i) => ({ url, alt: `Photo ${i + 1}` }));
    }
  } catch (e) {
    console.error('Gallery fetch failed:', e);
  }
}

onMounted(async () => {
  const fontLinks = [
    'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap',
    'https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap',
  ];
  fontLinks.forEach(href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });

  const data = await fetchData();
  if (data) {
    const defaultHero = config.heroPhotoUrl;
    const defaultCollage = [...config.collagePhotos];
    config.heroPhotoUrl = '';
    config.collagePhotos = [];
    applyBackendData(data);
    await loadGalleryImages();
    if (!config.heroPhotoUrl) config.heroPhotoUrl = defaultHero;
    if (!config.collagePhotos.length) config.collagePhotos = defaultCollage;
  }
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
.elegant-chateau {
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Lato', sans-serif;
  --bg-warm: #f9f8f6;
  --bg-warm-100: #f2efe9;
  --primary-500: #9f8274;
  --primary-600: #8a6b5d;

  font-family: var(--font-body);
  background: var(--bg-warm);
  color: #1a1a1a;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* Loading */
.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-warm);
}
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ========== COVER SCREEN ========== */
.cover-screen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-warm);
  transition: opacity 0.8s ease, visibility 0.8s;
}
.cover-screen.cover-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Polaroid Stack */
.polaroid-stack {
  position: relative;
  width: 280px;
  height: 370px;
  cursor: pointer;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.polaroid-stack:hover {
  transform: scale(1.02);
}
.polaroid {
  position: absolute;
  inset: 0;
  background: #fff;
  padding: 14px 14px 56px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center;
}
.polaroid img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: sepia(10%);
  display: block;
}
.polaroid-1 { transform: rotate(-6deg) translate(-10px, 5px); z-index: 1; }
.polaroid-2 { transform: rotate(4deg) translate(10px, -5px); z-index: 2; }
.polaroid-3 { transform: rotate(-2deg); z-index: 3; }
.polaroid-label {
  position: absolute;
  bottom: 16px;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: var(--font-heading);
  font-size: 18px;
  font-style: italic;
  color: #1a1a1a;
}

/* Expanding animation */
.expanding .polaroid-1 { transform: translate(-150vw, -50vh) rotate(-45deg); opacity: 0; }
.expanding .polaroid-2 { transform: translate(150vw, -50vh) rotate(45deg); opacity: 0; }
.expanding .polaroid-3 { transform: scale(5); opacity: 0; z-index: 50; }

.cover-hint {
  margin-top: 48px;
  text-align: center;
  pointer-events: none;
  animation: float-hint 6s ease-in-out infinite;
}
.cover-est {
  font-size: 13px;
  color: #666;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 0 0 8px;
}
.cover-tap {
  font-family: var(--font-heading);
  font-size: 22px;
  font-style: italic;
  color: #1a1a1a;
  margin: 0;
}
@keyframes float-hint {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (min-width: 640px) {
  .polaroid-stack { width: 320px; height: 420px; }
}

/* ========== HERO ========== */
.ec-hero {
  padding: 80px 24px 80px;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 1s ease-out 0.5s, transform 1s ease-out 0.5s;
}
.ec-hero-visible {
  opacity: 1;
  transform: translateY(0);
}
.ec-hero-content {
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
}
.ec-hero-label {
  font-size: 13px;
  color: var(--primary-600);
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0 0 24px;
}
.ec-hero-names {
  font-family: var(--font-heading);
  font-size: 64px;
  color: #1a1a1a;
  margin: 0 0 32px;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.ec-hero-amp {
  font-style: italic;
  color: #a4a4a4;
}
.ec-hero-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: #434343;
}
.ec-hero-dot {
  display: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c8c8c8;
}
@media (min-width: 768px) {
  .ec-hero-names { font-size: 96px; }
  .ec-hero-meta { flex-direction: row; gap: 48px; }
  .ec-hero-dot { display: block; }
  .ec-hero { padding-top: 128px; padding-bottom: 128px; }
}
@media (min-width: 1024px) {
  .ec-hero-names { font-size: 120px; }
}

/* Hero Image Grid */
.ec-hero-grid {
  max-width: 1280px;
  margin: 64px auto 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  padding: 0 16px;
}
.ec-hero-main {
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
}
.ec-hero-main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
}
.ec-hero-main:hover img { transform: scale(1.05); }
.ec-hero-side { display: none; }
@media (min-width: 768px) {
  .ec-hero-grid { grid-template-columns: 8fr 4fr; }
  .ec-hero-main { height: 600px; }
  .ec-hero-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
.ec-hero-side-img {
  height: 290px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
}
.ec-hero-side-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
}
.ec-hero-side-img:hover img { transform: scale(1.05); }
.ec-hero-side-quote {
  height: 290px;
  border-radius: 16px;
  background: #f5f5f4;
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
}
.ec-quote-text {
  font-family: var(--font-heading);
  font-size: 28px;
  font-style: italic;
  color: #1a1a1a;
  text-align: center;
  margin: 0;
}

/* ========== SECTIONS ========== */
.ec-section { padding: 96px 24px; }
.ec-section--white { background: #fff; }
.ec-section--warm { background: var(--bg-warm-100); }
.ec-section-inner { max-width: 1280px; margin: 0 auto; }
.ec-section-inner--narrow { max-width: 750px; }
.ec-section-header-center { text-align: center; margin-bottom: 48px; }
.ec-section-title {
  font-family: var(--font-heading);
  font-size: 36px;
  font-weight: 400;
  color: #1a1a1a;
  margin: 0 0 16px;
}
.ec-section-title--large { font-size: 42px; }
.ec-section-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  max-width: 500px;
}
@media (min-width: 768px) {
  .ec-section-title { font-size: 48px; }
  .ec-section-title--large { font-size: 56px; }
}

/* ========== STORY SLIDER ========== */
.ec-story-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 48px;
  padding: 0 24px;
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
}
@media (min-width: 768px) {
  .ec-story-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-end;
  }
}
.ec-slider-arrows {
  display: flex;
  gap: 8px;
}
.ec-arrow-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid #e3e3e3;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: background 0.2s;
}
.ec-arrow-btn:hover { background: #f7f7f7; }

.ec-slider {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 24px;
  padding: 0 24px 48px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.ec-slider::-webkit-scrollbar { display: none; }

.ec-slide {
  min-width: 85vw;
  scroll-snap-align: center;
  flex-shrink: 0;
}
@media (min-width: 768px) {
  .ec-slide { min-width: 600px; }
}
.ec-slide-card {
  background: var(--bg-warm);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
}
.ec-slide-image {
  height: 400px;
  overflow: hidden;
  position: relative;
}
.ec-slide-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
}
.ec-slide-card:hover .ec-slide-image img { transform: scale(1.05); }
.ec-slide-date {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #1a1a1a;
}
.ec-slide-body { padding: 32px; }
.ec-slide-title {
  font-family: var(--font-heading);
  font-size: 24px;
  color: #1a1a1a;
  margin: 0 0 12px;
}
.ec-slide-text {
  font-size: 15px;
  color: #666;
  line-height: 1.7;
  margin: 0;
}

/* ========== COUNTDOWN ========== */
.ec-countdown-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 48px;
}

/* ========== DETAILS ========== */
.ec-details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
}
@media (min-width: 768px) {
  .ec-details-grid { grid-template-columns: repeat(3, 1fr); }
}
.ec-detail-card {
  background: #fff;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.ec-detail-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px -5px rgba(40, 40, 40, 0.15);
}
.ec-detail-card--highlight {
  border-top: 4px solid var(--primary-500);
}
.ec-detail-icon {
  width: 48px;
  height: 48px;
  background: var(--bg-warm-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: var(--primary-600);
}
.ec-detail-icon svg { width: 24px; height: 24px; }
.ec-detail-title {
  font-family: var(--font-heading);
  font-size: 24px;
  color: #1a1a1a;
  margin: 0 0 8px;
}
.ec-detail-time {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-600);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 16px;
}
.ec-detail-desc {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  margin: 0 0 20px;
}
.ec-detail-map {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-600);
  text-decoration: none;
  padding: 8px 16px;
  border: 1px solid #eaddd7;
  border-radius: 999px;
  transition: all 0.2s;
}
.ec-detail-map:hover {
  background: var(--bg-warm);
  border-color: var(--primary-500);
}

/* ========== RSVP ========== */
.ec-section--rsvp { position: relative; overflow: hidden; }
.ec-rsvp-bg {
  position: absolute;
  inset: 0;
  opacity: 0.04;
  pointer-events: none;
  background-image: url('https://images.unsplash.com/photo-1519741497674-611481863552?w=2000&q=40');
  background-size: cover;
  background-position: center;
}
.ec-rsvp-content { position: relative; z-index: 10; }
.ec-rsvp-form-wrap {
  background: var(--bg-warm);
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 10px 30px -5px rgba(40, 40, 40, 0.1);
}
@media (min-width: 768px) {
  .ec-rsvp-form-wrap { padding: 48px; }
}

/* ========== SCROLL REVEAL ========== */
[data-reveal] {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
}
[data-reveal].revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ========== RESPONSIVE ========== */
@media (max-width: 767px) {
  .ec-section { padding: 64px 16px; }
  .ec-hero-names { font-size: 48px; }
}
</style>

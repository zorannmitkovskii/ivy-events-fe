<template>
  <div id="app">
    <HeroSection
      :brideName="brideName"
      :groomName="groomName"
      :date="date"
    />
    <WeddingDetails
      :date="date"
      :time="time"
      :ceremonyMapLink="ceremonyMapLink"
      :receptionMapLink="receptionMapLink"
      :dateTime="dateTime"
    />
    <Agenda />
    <RSVP />
  </div>
</template>

<script>

import HeroSection from "@/components/invitations/wedding/invitationThree/HeroSection.vue";
import Agenda from "@/components/invitations/wedding/invitationThree/Agenda.vue";
import WeddingDetails from "@/components/invitations/wedding/invitationThree/WeddingDetails.vue";
import RsvpFormThree from "@/components/invitations/wedding/invitationThree/RsvpFormThree.vue";

export default {
  name: 'App',
  components: {
    RsvpFormThree,
    HeroSection,
    WeddingDetails,
    Agenda,
  },
  data() {
    return {
      brideName: '{{BRIDE_NAME}}',
      groomName: '{{GROOM_NAME}}',
      date: '{{DATE}}',
      time: '{{TIME}}',
      dateTime: '{{DATE_TIME}}',
      ceremonyMapLink: '{{CEREMONY_MAP_LINK}}',
      receptionMapLink: '{{RECEPTION_MAP_LINK}}'
    }
  },
  mounted() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault()
        const target = document.querySelector(this.getAttribute('href'))
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      })
    })
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Lora:wght@400;500;600&family=Crimson+Text:wght@400;600&display=swap');

:root {
  --ivory: #FDFBF7;
  --warm-ivory: #F8F6F1;
  --blush: #F4E4E0;
  --dusty-rose: #E8C5C1;
  --rose-accent: #D4A5A5;
  --muted-sage: #C8D5C7;
  --sage-dark: #A8B8A7;
  --warm-gray: #9B9186;
  --charcoal: #4A4A48;
  --divider: #E8DFD8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Lora', serif;
  color: var(--charcoal);
  background: var(--ivory);
  line-height: 1.7;
  overflow-x: hidden;
}

#app {
  width: 100%;
}

/* SECTION COMMON STYLES */
section {
  padding: clamp(4rem, 10vw, 8rem) clamp(1.5rem, 5vw, 3rem);
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 300;
  text-align: center;
  color: var(--charcoal);
  margin-bottom: 1rem;
  letter-spacing: 0.03em;
}

.section-subtitle {
  text-align: center;
  font-size: 1rem;
  color: var(--warm-gray);
  margin-bottom: 4rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-weight: 400;
}

/* ANIMATIONS */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>

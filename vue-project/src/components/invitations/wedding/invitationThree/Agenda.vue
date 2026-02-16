<template>
  <section id="agenda">
    <h2 class="section-title">Timeline</h2>
    <p class="section-subtitle">Order of events</p>

    <div class="timeline">
      <div
        v-for="(item, index) in timelineItems"
        :key="index"
        class="timeline-item"
      >
        <div class="time-chip">{{ item.time }}</div>
        <h4>{{ item.title }}</h4>
        <p>{{ item.description }}</p>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AgendaSection',
  data() {
    return {
      timelineItems: [
        {
          time: '3:30 PM',
          title: 'Guest Arrival',
          description: 'Please arrive and find your seats as we prepare for the ceremony.'
        },
        {
          time: '4:00 PM',
          title: 'Ceremony',
          description: 'Join us as we exchange our vows and begin our journey together.'
        },
        {
          time: '5:00 PM',
          title: 'Cocktail Hour',
          description: 'Enjoy drinks and hors d\'oeuvres during our photo session.'
        },
        {
          time: '6:30 PM',
          title: 'Reception',
          description: 'Dinner, toasts, and celebration with dancing to follow.'
        },
        {
          time: '10:00 PM',
          title: 'Last Dance',
          description: 'One final dance before we say goodnight.'
        }
      ]
    }
  }
}
</script>

<style scoped>
.timeline {
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  padding-left: 3rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--divider);
}

.timeline-item {
  position: relative;
  margin-bottom: 3rem;
  padding-left: 2rem;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -3rem;
  top: 0.5rem;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--dusty-rose);
  border: 3px solid var(--ivory);
  box-shadow: 0 0 0 1px var(--divider);
}

.time-chip {
  display: inline-block;
  padding: 0.4rem 1.2rem;
  background: var(--warm-ivory);
  border: 1px solid var(--divider);
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--warm-gray);
  margin-bottom: 0.8rem;
  letter-spacing: 0.05em;
}

.timeline-item h4 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--charcoal);
  margin-bottom: 0.5rem;
}

.timeline-item p {
  color: var(--warm-gray);
  font-size: 0.95rem;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .timeline {
    padding-left: 2rem;
  }

  .timeline-item {
    padding-left: 1.5rem;
  }

  .timeline-item::before {
    left: -2rem;
  }
}
</style>

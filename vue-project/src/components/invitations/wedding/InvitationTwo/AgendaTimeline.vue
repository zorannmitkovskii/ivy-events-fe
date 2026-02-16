<template>
  <section class="agenda-section">
    <div class="section-header">
      <h2 class="section-title">Wedding Day Timeline</h2>
      <div class="title-underline"></div>
    </div>

    <div class="timeline">
      <div class="timeline-line"></div>

      <div
        v-for="(event, index) in events"
        :key="index"
        class="timeline-item"
        :class="index % 2 === 0 ? 'item-left' : 'item-right'"
      >
        <div class="timeline-node">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="#FAF8F5" stroke="#8B9E7E" stroke-width="1.5"/>
            <path d="M16 8C16 8 12 14 10 16C12 16 16 12 16 8Z" fill="#8B9E7E"/>
            <path d="M16 8C16 8 20 14 22 16C20 16 16 12 16 8Z" fill="#A8B89C"/>
          </svg>
        </div>

        <div class="timeline-card">
          <span class="time-badge">{{ event.time }}</span>
          <h3 class="event-title">{{ event.title }}</h3>
          <p v-if="event.description" class="event-desc">{{ event.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  events: {
    type: Array,
    required: true,
    default: () => []
  }
});
</script>

<style scoped>
.agenda-section {
  padding: 80px 20px;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 40px;
  font-weight: 700;
  color: #3D4A3A;
  margin: 0 0 12px;
}

.title-underline {
  width: 80px;
  height: 2px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, #C8A870, transparent);
}

.timeline {
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px 0;
}

.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, transparent, #A8B89C 10%, #A8B89C 90%, transparent);
}

.timeline-line::before,
.timeline-line::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #A8B89C;
}

.timeline-line::before { top: 0; }
.timeline-line::after { bottom: 0; }

.timeline-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 50px;
  position: relative;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.item-left {
  flex-direction: row;
}

.item-right {
  flex-direction: row-reverse;
}

.timeline-node {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.item-left .timeline-card {
  width: calc(50% - 40px);
  margin-right: auto;
  text-align: right;
  padding-right: 30px;
}

.item-right .timeline-card {
  width: calc(50% - 40px);
  margin-left: auto;
  text-align: left;
  padding-left: 30px;
}

.timeline-card {
  background: #F5F0EB;
  padding: 24px 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.timeline-card:hover {
  box-shadow: 0 4px 20px rgba(232, 196, 192, 0.3);
  transform: translateY(-2px);
}

.time-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #C8A870, #D4B896);
  color: #FAF8F5;
  font-family: 'Lato', sans-serif;
  font-size: 12px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.event-title {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 600;
  color: #3D4A3A;
  margin: 0 0 6px;
}

.event-desc {
  font-family: 'Crimson Text', serif;
  font-size: 16px;
  color: #5C6858;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .timeline-line {
    left: 16px;
  }

  .timeline-node {
    left: 16px;
  }

  .timeline-item {
    flex-direction: row !important;
  }

  .item-left .timeline-card,
  .item-right .timeline-card {
    width: calc(100% - 56px);
    margin-left: auto;
    margin-right: 0;
    text-align: left;
    padding-left: 24px;
    padding-right: 24px;
  }

  .section-title {
    font-size: 32px;
  }
}
</style>

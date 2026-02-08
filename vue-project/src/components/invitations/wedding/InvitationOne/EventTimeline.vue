<template>
  <div class="timeline-card">
    <h2 class="card-heading">Timeline of Events</h2>

    <div class="timeline-list">
      <div
        v-for="(event, index) in events"
        :key="index"
        class="timeline-entry"
      >
        <div class="timeline-dot"></div>
        <div class="timeline-box">
          <div class="timeline-content">
            {{ event.time }} - {{ event.title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  events: { type: Array, required: true }
});
</script>

<style scoped>
.timeline-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 254, 0.95) 100%);
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin: 40px 0;
}

.card-heading {
  font-family: 'Playfair Display', serif;
  font-size: 42px;
  font-weight: 700;
  color: #2d4a5a;
  margin-bottom: 40px;
  text-align: center;
  position: relative;
  display: inline-block;
  width: 100%;
}

.card-heading::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 70px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #6ba5c8, transparent);
}

.timeline-list {
  max-width: 700px;
  margin: 40px auto 0;
  position: relative;
}

.timeline-list::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #6ba5c8 0%, #4a8ab0 100%);
  transform: translateX(-50%);
}

.timeline-entry {
  display: flex;
  margin: 40px 0;
  position: relative;
}

.timeline-entry:nth-child(odd) {
  flex-direction: row;
}

.timeline-entry:nth-child(even) {
  flex-direction: row-reverse;
}

.timeline-box {
  flex: 1;
  padding: 25px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.06);
}

.timeline-entry:nth-child(odd) .timeline-box {
  margin-right: calc(50% + 25px);
  text-align: right;
}

.timeline-entry:nth-child(even) .timeline-box {
  margin-left: calc(50% + 25px);
  text-align: left;
}

.timeline-dot {
  position: absolute;
  left: 50%;
  top: 30px;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  background: #6ba5c8;
  border: 4px solid #e8f4f8;
  border-radius: 50%;
  z-index: 2;
}

.timeline-content {
  font-family: 'Crimson Text', serif;
  font-size: 24px;
  color: #2d4a5a;
  font-weight: 600;
}

@media (max-width: 768px) {
  .timeline-list::before {
    left: 20px;
  }

  .timeline-entry:nth-child(odd) .timeline-box,
  .timeline-entry:nth-child(even) .timeline-box {
    margin-left: 50px;
    margin-right: 0;
    text-align: left;
  }

  .timeline-dot {
    left: 20px;
  }

  .card-heading {
    font-size: 34px;
  }
}
</style>

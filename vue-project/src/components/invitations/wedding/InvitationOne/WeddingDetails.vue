<template>
  <div class="details-card">
    <h2 class="card-heading">Wedding Details</h2>

    <div class="info-row">
      <div class="info-label">Date</div>
      <div class="info-content">{{ date }}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Time</div>
      <div class="info-content">{{ time }}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Venue</div>
      <div class="info-content">{{ venue }}</div>
    </div>

    <div class="info-row">
      <div class="info-label">Address</div>
      <div class="info-content">{{ address }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  date: { type: String, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  address: { type: String, required: true }
});
</script>

<style scoped>
.details-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 254, 0.95) 100%);
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin: 40px 0;
}

.card-heading {
  font-family: 'Playfair Display', serif;
  font-size: 42px;
  font-weight: 700;
  color: #2d4a5a;
  margin-bottom: 40px;
  position: relative;
  display: inline-block;
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

.info-row {
  margin: 30px 0;
}

.info-label {
  font-size: 13px;
  color: #4a7a95;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.info-content {
  font-family: 'Crimson Text', serif;
  font-size: 28px;
  color: #2d4a5a;
  font-weight: 400;
}

@media (max-width: 768px) {
  .card-heading {
    font-size: 34px;
  }
}
</style>

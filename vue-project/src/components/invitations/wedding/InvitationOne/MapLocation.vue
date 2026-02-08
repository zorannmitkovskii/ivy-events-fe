<template>
  <div class="map-card">
    <div v-if="hasCoordinates" ref="mapContainer" class="map-container"></div>
    <div v-else class="map-placeholder">
      <div class="map-icon-large">🗺️</div>
      <div class="map-label">{{ venue }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  venue: { type: String, required: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null }
});

const mapContainer = ref(null);

const hasCoordinates = computed(() =>
  props.latitude !== null && props.longitude !== null
);

onMounted(() => {
  // TODO: Initialize Google Maps if coordinates are available
  if (hasCoordinates.value && window.google && mapContainer.value) {
    const map = new window.google.maps.Map(mapContainer.value, {
      center: { lat: props.latitude, lng: props.longitude },
      zoom: 15
    });

    new window.google.maps.Marker({
      position: { lat: props.latitude, lng: props.longitude },
      map: map,
      title: props.venue
    });
  }
});
</script>

<style scoped>
.map-card {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin: 40px 0;
  height: 400px;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #d4e8f0 0%, #b8d4e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 15px;
}

.map-icon-large {
  font-size: 70px;
  opacity: 0.5;
}

.map-label {
  font-family: 'Crimson Text', serif;
  font-size: 26px;
  color: #2d4a5a;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .map-card {
    height: 300px;
  }
}
</style>

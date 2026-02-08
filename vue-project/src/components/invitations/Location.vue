<template>
  <div class="container py-5">
    <div class="row g-4">
      <div
        class="col-12 col-md-6 col-lg-4 d-flex flex-column align-items-center text-center"
        v-for="(loc, index) in locations"
        :key="index"
      >
        <h2 class="fw-bold fs-2 text-brand-dark">{{ loc.title }}</h2>
        <p class="fs-5 text-brand-dark opacity-75">{{ loc.subtitle }}</p>


<!--        <img-->
<!--          :src="loc.imageUrl"-->
<!--          class="img-fluid rounded-4 shadow mb-3"-->
<!--          style="max-height: 300px; object-fit: cover;"-->
<!--        />-->


        <p class="fw-semibold text-brand-dark">{{ loc.address }}</p>


        <button
          @click="openLocation(loc.mapUrl)"
          class="btn btn-brand px-4 py-2 mt-2"
        >
          LOCATION
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const locations = ref([])

onMounted(async () => {
  // const res = await axios.get('/api/wedding/locations')
  locations.value = [
    {
      "title": "Ceremony",
      "subtitle": "Civil ceremony in Central Park at 09:30 h",
      "imageUrl": "https://your-image-here",
      "address": "1 Central Park W, New York, NY 10023, USA",
      "mapUrl": "https://maps.google.com/?q=Central+Park"
    },
    {
      "title": "Celebration",
      "subtitle": "Restaurant Bryant Park Grill at 12:15 h",
      "imageUrl": "https://your-image-here",
      "address": "25 W 40th St, New York, NY 10018, USA",
      "mapUrl": "https://maps.google.com/?q=Bryant+Park+Grill"
    },
    {
      "title": "Celebration",
      "subtitle": "Restaurant Bryant Park Grill at 12:15 h",
      "imageUrl": "https://your-image-here",
      "address": "25 W 40th St, New York, NY 10018, USA",
      "mapUrl": "https://maps.google.com/?q=Bryant+Park+Grill"
    },
    {
      "title": "Celebration",
      "subtitle": "Restaurant Bryant Park Grill at 12:15 h",
      "imageUrl": "https://your-image-here",
      "address": "25 W 40th St, New York, NY 10018, USA",
      "mapUrl": "https://maps.google.com/?q=Bryant+Park+Grill"
    }
  ]

})

function openLocation(url) {
  window.open(url, '_blank')
}
</script>


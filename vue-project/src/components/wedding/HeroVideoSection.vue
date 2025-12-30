<template>
  <section class="position-relative">
    <!-- Background Video -->
    <video autoplay muted loop playsinline class="w-100" style="height: 80vh; object-fit: cover;">
      <source :src="videoUrl" type="video/mp4"/>
    </video>

    <!-- Overlay text -->
    <div class="position-absolute top-50 start-50 translate-middle text-center text-brand-light">
      <h1 class="fw-bold display-4">{{ title }}</h1>
      <p class="fs-5 mt-3">{{ subtitle }}</p>
    </div>
  </section>
</template>


<script setup>
import {ref} from 'vue'

const videoUrl = "your-video-url"
const title = "The online invitation collection"
const subtitle = "Elevate any event with beautiful designs and track RSVP."
</script>

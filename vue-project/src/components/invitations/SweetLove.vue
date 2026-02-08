<template>
  <div class="container text-center my-5">

    <!-- Title -->
    <h3 class="fw-bold text-success">Our sweet love</h3>
    <p class="mt-3">
      There are moments that time cannot erase. We are delighted to share some
      of those unforgettable memories with you.
    </p>

    <!-- Exactly 3 images (static grid layout) -->
    <div v-if="images.length === 3" class="row mt-4 g-3">
      <div class="col-md-4" v-for="(img, i) in images" :key="i">
<!--        <img :src="img.url" class="img-fluid rounded shadow" />-->
      </div>
    </div>

    <!-- More than 3 images (slider) -->
    <div v-else-if="images.length > 3" class="mt-4">
      <div id="loveCarousel" class="carousel slide" data-bs-ride="carousel">

        <div class="carousel-inner">
          <div
            v-for="(img, i) in images"
            :key="i"
            class="carousel-item"
            :class="{ active: i === 0 }"
          >
            <img
              :src="img.url"
              class="d-block w-100 rounded"
              style="max-height: 500px; object-fit: cover"
            />
          </div>
        </div>

        <!-- Controls -->
        <button class="carousel-control-prev" type="button" data-bs-target="#loveCarousel" data-bs-slide="prev">
          <span class="carousel-control-prev-icon"></span>
        </button>

        <button class="carousel-control-next" type="button" data-bs-target="#loveCarousel" data-bs-slide="next">
          <span class="carousel-control-next-icon"></span>
        </button>
      </div>
    </div>

    <!-- Less than 3 images (just show them normally) -->
    <div v-else class="row mt-4 g-3">
      <div class="col-md-4" v-for="(img, i) in images" :key="i">
<!--        <img :src="img.url" class="img-fluid rounded shadow" />-->
      </div>
    </div>

  </div>
</template>

<script>
import axios from "axios";
import { baseUrl } from "@/services/baseUrl";

export default {
  name: "SweetLoveSection",

  data() {
    return {
      images: []
    };
  },

  async mounted() {
    try {
      const response = await axios.get(`${baseUrl}/gallery/images`);

      // Expecting [{ id: 1, url: "..." }, ...]
      this.images = response.data;
    } catch (error) {
      console.error("Failed to load images:", error);
    }
  }
};
</script>

<style scoped>
img {
  border-radius: 10px;
}
</style>

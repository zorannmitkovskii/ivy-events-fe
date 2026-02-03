<template>
  <DashboardLayout>
    <div class="container py-4">
      <h1 class="text-brand-dark mb-4">Gallery</h1>

      <!-- Gallery Grid -->
      <div class="row g-3">
        <div
          class="col-md-3"
          v-for="image in displayedImages"
          :key="image.id"
        >
          <div class="gallery-card position-relative" @click="openPreview(image)">
            <img :src="image.thumbnail" class="img-fluid rounded" />
            <div class="overlay">
              <i class="bi bi-arrows-fullscreen fs-4 text-white"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Sentinel for Intersection Observer -->
      <div ref="loadMoreSentinel" class="text-center my-3">
        <div v-if="loading" class="spinner-border text-brand-dark" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Preview Modal -->
      <div class="modal fade" id="previewModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ currentImage.name }}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body text-center">
              <img :src="currentImage.url" class="img-fluid" />
            </div>
            <div class="modal-footer">
              <a :href="currentImage.url" download class="btn btn-brand-dark">Download</a>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import DashboardLayout from "@/components/userDashboard/dashboard/DashboardLayout.vue";
import * as bootstrap from "bootstrap";

// Dummy image data
const totalImages = 50;
const allImages = Array.from({ length: totalImages }, (_, i) => ({
  id: i + 1,
  name: `Image ${i + 1}`,
  thumbnail: `https://picsum.photos/id/${100 + i}/300/200`,
  url: `https://picsum.photos/id/${100 + i}/1200/800`
}));

const displayedImages = ref([]);
const currentIndex = ref(0);
const loading = ref(false);
const currentImage = ref({});

let modal;
const loadMoreSentinel = ref(null);

// Rows configuration
const imagesPerRow = 4;
const initialRows = 5;
const batchRows = 3;

onMounted(() => {
  modal = new bootstrap.Modal(document.getElementById("previewModal"));
  loadInitialImages();

  // Intersection Observer for infinite scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !loading.value) {
        loadMoreImages();
      }
    });
  }, {
    root: null,
    rootMargin: '200px',
    threshold: 0
  });

  if (loadMoreSentinel.value) {
    observer.observe(loadMoreSentinel.value);
  }
});

function loadInitialImages() {
  const count = initialRows * imagesPerRow;
  const nextBatch = allImages.slice(currentIndex.value, currentIndex.value + count);
  displayedImages.value.push(...nextBatch);
  currentIndex.value += count;
}

function loadMoreImages() {
  if (currentIndex.value >= allImages.length) return;
  loading.value = true;

  setTimeout(() => {
    const count = batchRows * imagesPerRow;
    const nextBatch = allImages.slice(currentIndex.value, currentIndex.value + count);
    displayedImages.value.push(...nextBatch);
    currentIndex.value += count;
    loading.value = false;
  }, 300); // simulate API delay
}

function openPreview(image) {
  currentImage.value = image;
  modal.show();
}
</script>

<style scoped>
.gallery-card {
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.gallery-card img {
  transition: transform 0.3s;
}

.gallery-card:hover img {
  transform: scale(1.1);
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-card:hover .overlay {
  opacity: 1;
}

.btn-brand-dark {
  background-color: var(--logo-brown);
  color: white;
}

.btn-brand-dark:hover {
  background-color: #704e2f;
}
</style>

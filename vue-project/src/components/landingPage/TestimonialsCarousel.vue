<template>
  <section class="testimonials-section py-5 bg-brand-light">
    <div class="container">
      <h2 class="text-center text-brand-dark mb-4">What Our Users Say</h2>

      <div id="testimonialsCarousel" class="carousel slide px-5" data-bs-ride="carousel">
        <div class="carousel-inner">
          <div
            v-for="(chunk, index) in testimonialChunks"
            :key="index"
            :class="['carousel-item', { active: index === 0 }]"
          >
            <div class="row justify-content-center">
              <div
                v-for="testimonial in chunk"
                :key="testimonial.id"
                class="col-md-6 mb-3"
              >
                <div class="card h-100 shadow-sm p-3">
                  <div class="d-flex align-items-center mb-2">
                    <img
                      :src="testimonial.photo"
                      class="rounded-circle me-3"
                      width="50"
                      height="50"
                      alt="User photo"
                    />
                    <div>
                      <h6 class="mb-0">{{ testimonial.name }}</h6>
                      <small class="text-muted">{{ testimonial.role }}</small>
                    </div>
                  </div>
                  <p class="mb-0">{{ testimonial.feedback }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <button
          class="carousel-control-prev"
          type="button"
          data-bs-target="#testimonialsCarousel"
          data-bs-slide="prev"
        >
          <span class="carousel-control-prev-icon bg-brand-dark rounded-circle p-3" aria-hidden="true"></span>
        </button>
        <button
          class="carousel-control-next"
          type="button"
          data-bs-target="#testimonialsCarousel"
          data-bs-slide="next"
        >
          <span class="carousel-control-next-icon bg-brand-dark rounded-circle p-3" aria-hidden="true"></span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const testimonials = [
  {
    id: 1,
    name: "Alice Johnson",
    role: "Bride",
    feedback: "The platform made planning our wedding effortless!",
    photo: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    id: 2,
    name: "Mark Smith",
    role: "Event Organizer",
    feedback: "Managing multiple events is now so simple.",
    photo: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    id: 3,
    name: "Sophie Lee",
    role: "Mom",
    feedback: "Planning my kid’s birthday was fun and easy.",
    photo: "https://randomuser.me/api/portraits/women/3.jpg",
  },
  {
    id: 4,
    name: "John Doe",
    role: "Corporate Planner",
    feedback: "Corporate events are now stress-free thanks to this tool.",
    photo: "https://randomuser.me/api/portraits/men/4.jpg",
  },
];

// Split testimonials into chunks of 2
const testimonialChunks = computed(() => {
  const chunks = [];
  for (let i = 0; i < testimonials.length; i += 2) {
    chunks.push(testimonials.slice(i, i + 2));
  }
  return chunks;
});
</script>

<style scoped>
.carousel-control-prev-icon,
.carousel-control-next-icon {
  background-size: 100% 100%;
}
</style>

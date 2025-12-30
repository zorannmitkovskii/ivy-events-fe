<template>
  <section class="featured-organizers py-5 bg-brand-light">
    <div class="container">
      <h2 class="text-center text-brand-dark mb-4">Featured Organizers</h2>

      <div class="position-relative">
        <!-- Carousel -->
        <div class="d-flex overflow-hidden">
          <div
            class="d-flex transition"
            :style="{ transform: `translateX(-${currentIndex * slideWidth}%)` }"
          >
            <div
              v-for="(organizer, index) in organizers"
              :key="index"
              class="card mx-2 flex-shrink-0"
              :style="{ width: cardWidth + '%' }"
            >
              <img :src="organizer.image" class="card-img-top" />
              <div class="card-body">
                <h5 class="card-title">{{ organizer.name }}</h5>
                <p class="card-text">Rating: {{ organizer.rating }} ⭐</p>
                <p class="card-text">Category: {{ organizer.category }}</p>
                <button class="btn btn-primary w-100">View Profile</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <button
          v-if="currentIndex > 0"
          class="arrow-btn position-absolute top-50 start-0 translate-middle-y"
          @click="prev"
        >
          ‹
        </button>
        <button
          v-if="currentIndex < maxIndex"
          class="arrow-btn position-absolute top-50 end-0 translate-middle-y"
          @click="next"
        >
          ›
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";

const organizers = ref([
  { name: "Alice Event Co", rating: 4.8, category: "Weddings", image: "https://picsum.photos/300/200?random=1" },
  { name: "Corporate Masters", rating: 4.6, category: "Business Events", image: "https://picsum.photos/300/200?random=2" },
  { name: "Kids Party Pros", rating: 4.7, category: "Kid’s Birthdays", image: "https://picsum.photos/300/200?random=3" },
  { name: "Baby Shower Experts", rating: 4.5, category: "Baby Showers", image: "https://picsum.photos/300/200?random=4" },
  { name: "Anniversary Stars", rating: 4.9, category: "Anniversaries", image: "https://picsum.photos/300/200?random=5" },
  { name: "Concert Crew", rating: 4.4, category: "Concerts", image: "https://picsum.photos/300/200?random=6" },
  { name: "Baby Shower Experts", rating: 4.5, category: "Baby Showers", image: "https://picsum.photos/300/200?random=4" },
  { name: "Anniversary Stars", rating: 4.9, category: "Anniversaries", image: "https://picsum.photos/300/200?random=5" },
  { name: "Concert Crew", rating: 4.4, category: "Concerts", image: "https://picsum.photos/300/200?random=6" },
]);

const currentIndex = ref(0);
const itemsPerSlide = ref(3);
const cardWidth = ref(0); // % width of card including gap
const slideWidth = ref(0); // % to move per scroll
const totalSlides = ref(0);

const calculateLayout = () => {
  const width = window.innerWidth;
  if (width < 768) itemsPerSlide.value = 1;
  else if (width < 992) itemsPerSlide.value = 2;
  else itemsPerSlide.value = 3;

  cardWidth.value = 100 / itemsPerSlide.value - 2; // % width minus gap
  slideWidth.value = 100 / itemsPerSlide.value;
  totalSlides.value = Math.ceil(organizers.value.length - itemsPerSlide.value) + 1; // ensures last slide fully visible
};

const maxIndex = computed(() => totalSlides.value - 1);

const next = () => {
  if (currentIndex.value < maxIndex.value) currentIndex.value++;
};

const prev = () => {
  if (currentIndex.value > 0) currentIndex.value--;
};

onMounted(() => {
  calculateLayout();
  window.addEventListener("resize", calculateLayout);
});

watch(itemsPerSlide, () => {
  if (currentIndex.value > maxIndex.value) currentIndex.value = maxIndex.value;
});
</script>


<style scoped>
.card {
  border: none;
  border-radius: 10px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
}

.arrow-btn {
  background-color: var(--primary-main);
  color: var(--white);
  border: none;
  font-size: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
}

.transition {
  transition: transform 0.5s ease;
}
</style>

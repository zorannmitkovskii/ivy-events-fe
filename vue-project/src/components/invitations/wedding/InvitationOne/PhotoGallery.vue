<template>
  <div class="gallery-grid">
    <div
      v-for="(photo, index) in displayPhotos"
      :key="index"
      class="gallery-box"
    >
      <img v-if="photo" :src="photo" alt="Wedding photo" class="gallery-img" />
      <span v-else class="gallery-placeholder">{{ placeholders[index] }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  photos: { type: Array, default: () => [] }
});

const placeholders = ['📸', '💐', '💍', '🎊', '🥂'];

const displayPhotos = computed(() => {
  const result = [...props.photos];
  while (result.length < 5) {
    result.push(null);
  }
  return result.slice(0, 5);
});
</script>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 40px 0;
}

.gallery-box {
  aspect-ratio: 1;
  border-radius: 15px;
  background: linear-gradient(135deg, #d4e8f0 0%, #b8d4e0 100%);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-placeholder {
  font-size: 70px;
  opacity: 0.4;
}
</style>

<template>
  <div class="couple-photo-section">
    <div class="photo-frame">
      <img v-if="photoUrl" :src="photoUrl" alt="Couple" class="couple-photo" />
      <div v-else class="photo-placeholder">💑</div>
    </div>
    <div class="couple-intro">{{ intro }}</div>
  </div>
</template>

<script setup>
defineProps({
  intro: { type: String, required: true },
  photoUrl: { type: String, default: null }
});
</script>

<style scoped>
.couple-photo-section {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 252, 254, 0.95) 100%);
  border-radius: 20px;
  padding: 60px 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-bottom: 40px;
  text-align: center;
}

.photo-frame {
  width: 100%;
  max-width: 450px;
  aspect-ratio: 0.8;
  margin: 0 auto 30px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #d4e8f0 0%, #b8d4e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.couple-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  font-size: 120px;
  opacity: 0.3;
}

.couple-intro {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: #4a7a95;
  font-style: italic;
  margin-top: 20px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .photo-frame {
    max-width: 100%;
  }
  .couple-intro {
    font-size: 20px;
  }
}
</style>

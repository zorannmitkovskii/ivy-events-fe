<template>
  <section class="story-section">
    <div class="section-header">
      <h2 class="section-title">Our Story</h2>
      <div class="title-underline"></div>
    </div>

    <div class="stories-container">
      <div
        v-for="(story, index) in stories"
        :key="index"
        class="story-block"
        :class="index % 2 === 0 ? 'image-left' : 'image-right'"
      >
        <div class="story-image-wrapper">
          <div v-if="story.imageUrl" class="story-image" :style="{ backgroundImage: `url(${story.imageUrl})` }"></div>
          <div v-else class="story-image placeholder-image">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4C24 4 16 16 8 24C16 24 24 16 24 4Z" fill="#A8B89C"/>
              <path d="M24 4C24 4 32 16 40 24C32 24 24 16 24 4Z" fill="#8B9E7E"/>
              <path d="M24 24C24 24 18 34 14 40C20 36 24 28 24 24Z" fill="#A8B89C" opacity="0.6"/>
              <path d="M24 24C24 24 30 34 34 40C28 36 24 28 24 24Z" fill="#8B9E7E" opacity="0.6"/>
            </svg>
          </div>
        </div>

        <div class="story-text-wrapper">
          <div class="accent-line"></div>
          <h3 class="story-title">{{ story.title }}</h3>
          <p class="story-body">{{ story.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  stories: {
    type: Array,
    required: true,
    default: () => []
  }
});
</script>

<style scoped>
.story-section {
  padding: 80px 20px;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 40px;
  font-weight: 700;
  color: #3D4A3A;
  margin: 0 0 12px;
}

.title-underline {
  width: 80px;
  height: 2px;
  margin: 0 auto;
  background: linear-gradient(90deg, transparent, #C8A870, transparent);
}

.stories-container {
  max-width: 960px;
  margin: 0 auto;
}

.story-block {
  display: flex;
  align-items: center;
  gap: 50px;
  margin-bottom: 70px;
}

.story-block:last-child {
  margin-bottom: 0;
}

.image-left {
  flex-direction: row;
}

.image-right {
  flex-direction: row-reverse;
}

.story-image-wrapper {
  flex: 0 0 340px;
}

.story-image {
  width: 340px;
  height: 280px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.placeholder-image {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F5F0EB 0%, #E8C4C0 50%, #F2D7D5 100%);
}

.story-text-wrapper {
  flex: 1;
  position: relative;
  padding-left: 24px;
}

.image-right .story-text-wrapper {
  padding-left: 0;
  padding-right: 24px;
}

.accent-line {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 2px;
  background: linear-gradient(180deg, #C8A870, #D4B896);
}

.image-right .accent-line {
  left: auto;
  right: 0;
}

.story-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  color: #3D4A3A;
  margin: 0 0 14px;
}

.story-body {
  font-family: 'Crimson Text', serif;
  font-size: 18px;
  color: #5C6858;
  margin: 0;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .story-block {
    flex-direction: column !important;
    gap: 24px;
  }

  .story-image-wrapper {
    flex: none;
    width: 100%;
  }

  .story-image {
    width: 100%;
    height: 220px;
  }

  .story-text-wrapper {
    padding-left: 20px;
    padding-right: 0;
  }

  .image-right .story-text-wrapper {
    padding-left: 20px;
    padding-right: 0;
  }

  .accent-line {
    left: 0 !important;
    right: auto !important;
  }

  .section-title {
    font-size: 32px;
  }
}
</style>
